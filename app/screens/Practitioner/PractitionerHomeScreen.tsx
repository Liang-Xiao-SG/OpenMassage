import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Text, Card, Title, Paragraph, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import supabase from '../../../utils/supabaseClient';
import { Database } from '../../../types/database.types';
import BookingRequests, { BookingRequest } from '../../components/Service/BookingRequests';
import AddServiceForm from '../../components/Service/AddServiceForm';

type Service = Database['public']['Tables']['services']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type User = Database['public']['Tables']['users']['Row'];

type BookingRequestWithClient = Booking & {
    users: Pick<User, 'name' | 'email'> | null;
    services: Pick<Service, 'title'> | null;
};

const PractitionerHomeScreen: React.FC = () => {
    const router = useRouter();
    const [practitionerId, setPractitionerId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [pendingBookings, setPendingBookings] = useState<BookingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingResponse, setIsProcessingResponse] = useState(false);
    const [bookingsChannel, setBookingsChannel] = useState<any>(null);
    const [isAddServiceModalVisible, setIsAddServiceModalVisible] = useState(false);
    // Removed isMounted state variable

    // --- Data Fetching Functions ---
    const fetchServicesForPractitioner = async (id: string | null) => {
        if (!id) return { data: [], error: null }; // Return empty if no ID
        console.log("Fetching services for practitioner:", id);
        // Fetch full service data for display
        return await supabase
            .from('services')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false }); // Show newest services first
    };

    const fetchPendingBookingsForServices = async (serviceIds: string[]) => {
        if (serviceIds.length === 0) return { data: [], error: null }; // Return empty if no service IDs
        console.log("Fetching pending bookings for service IDs:", serviceIds);
        return await supabase
            .from('bookings')
            .select(`
                *,
                users!bookings_client_id_fkey ( name, email ),
                services ( title )
            `)
            .in('service_id', serviceIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
    };

    // --- Effects ---
    // Removed useEffect for isMounted state
    const isMountedRef = useRef(true); // Use ref to track mount status

    // Set ref to false on unmount
    useEffect(() => {
        isMountedRef.current = true; // Set true on mount
        return () => {
            isMountedRef.current = false; // Set false on unmount
        };
    }, []);


    // Fetch Practitioner ID on mount
    useEffect(() => {
        const fetchUser = async () => {
            // No need to set isLoading here, handled by the main data fetch effect
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (!isMountedRef.current) return; // Check mount ref

            if (sessionError || !session?.user) {
                console.error("Error fetching session or no user found:", sessionError);
                Alert.alert("Error", "Could not get user session. Please log in again.");
                router.replace('/login');
                return;
            }
            // TODO: Add check here to ensure user role is 'practitioner'
            setPractitionerId(session.user.id);
        };
        fetchUser();
    }, [router]); // Removed isMounted dependency

    // Main data fetching and realtime setup effect
    useEffect(() => {
        if (!practitionerId) return; // No need to check ref here, done in async callbacks

        let currentSubscription: any = bookingsChannel;

        const fetchDataAndSubscribe = async () => {
            if (!isMountedRef.current) return; // Check ref
            console.log("fetchDataAndSubscribe called for practitioner:", practitionerId);
            setIsLoading(true); // Set loading true at the start

            // Fetch services
            const { data: servicesData, error: servicesError } = await fetchServicesForPractitioner(practitionerId);

            if (!isMountedRef.current) return; // Check ref
            if (servicesError) {
                console.error("Error fetching services:", servicesError);
                Alert.alert("Error", "Could not fetch your services.");
                setServices([]); // Clear services on error
            } else {
                setServices(servicesData || []);
            }

            const serviceIds = (servicesData || []).map((s: Service) => s.id);

            // Fetch pending bookings
            const { data: bookingsData, error: bookingsError } = await fetchPendingBookingsForServices(serviceIds);

            if (!isMountedRef.current) return; // Check ref
            if (bookingsError) {
                console.error("Error fetching pending bookings:", bookingsError);
                Alert.alert("Error", "Could not fetch pending bookings.");
                setPendingBookings([]);
            } else {
                const formattedRequests: BookingRequest[] = (bookingsData as BookingRequestWithClient[] || []).map((req): BookingRequest => {
                    const bookingDateTime = new Date(req.booking_date);
                    return {
                        id: req.id,
                        booking_date: bookingDateTime.toLocaleDateString(),
                        time: bookingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        special_requests: req.special_requests ?? '',
                        status: req.status,
                        clientName: req.users?.name ?? 'Unknown Client',
                        serviceTitle: req.services?.title ?? 'Unknown Service',
                    };
                });
                setPendingBookings(formattedRequests);
            }

            // --- Realtime Setup ---
            if (currentSubscription) {
                console.log("Removing previous channel subscription before creating new one.");
                supabase.removeChannel(currentSubscription).catch(removeError => console.error("Error removing previous channel:", removeError));
            }

            const channelName = `practitioner-bookings-${practitionerId}-${Date.now()}`;
            const newChannelFilter = serviceIds.length > 0
                ? `service_id=in.(${serviceIds.join(',')})`
                : 'service_id=eq.00000000-0000-0000-0000-000000000000';

            console.log(`Setting up new bookings channel '${channelName}' with filter: ${newChannelFilter}`);
            currentSubscription = supabase
                .channel(channelName)
                .on<Booking>(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'bookings', filter: newChannelFilter },
                    (payload) => {
                        console.log('Realtime: Practitioner bookings change received!', payload);
                        if (isMountedRef.current) { // Check ref
                            console.log("Realtime: Re-fetching data due to change.");
                            fetchDataAndSubscribe(); // Re-run fetch and subscribe logic
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (!isMountedRef.current) return; // Check ref
                    setBookingsChannel(currentSubscription); // Store the active channel in state
                    if (status === 'SUBSCRIBED') {
                        console.log(`Realtime: Successfully subscribed to channel ${channelName}`);
                    } else {
                        console.warn(`Realtime: Subscription status for ${channelName}: ${status}`);
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error(`Realtime: Channel error for ${channelName}:`, err);
                    }
                    if (status === 'TIMED_OUT') {
                        console.warn(`Realtime: Channel timeout for ${channelName}`);
                    }
                });
            // ----------------------

            setIsLoading(false); // Loading finished
        };

        fetchDataAndSubscribe();

        // Cleanup function
        return () => {
            console.log("PractitionerHomeScreen unmounting, cleaning up channel.");
            // isMounted = false; // Ref is handled in its own effect's cleanup
            const channelToRemove = bookingsChannel || currentSubscription;
            if (channelToRemove) {
                supabase.removeChannel(channelToRemove)
                    .then(() => console.log("Realtime: Channel removed successfully on unmount."))
                    .catch(err => console.error("Realtime: Error removing channel on unmount:", err));
            }
            setBookingsChannel(null);
        };

    }, [practitionerId, bookingsChannel]); // Rerun if practitionerId changes, manage channel state internally

    // --- Action Handlers ---
    const handleRespond = async (bookingId: string, response: 'accepted' | 'declined') => {
        setIsProcessingResponse(true);
        const { error } = await supabase
            .from('bookings')
            .update({ status: response })
            .eq('id', bookingId);

        if (error) {
            console.error(`Error ${response === 'accepted' ? 'accepting' : 'declining'} booking:`, error);
            Alert.alert("Error", `Failed to ${response} booking.`);
        } else {
            Alert.alert("Success", `Booking ${response}.`);
            // Optimistic update (or rely on realtime refetch)
            setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        }
        setIsProcessingResponse(false);
    };

     const handleLogout = async () => {
        setIsLoading(true); // Use main loading indicator
        const { error } = await supabase.auth.signOut();
        // No need to set isLoading false here, navigation will unmount
        if (error) {
          Alert.alert('Logout Error', error.message);
          setIsLoading(false); // Set loading false only if logout fails
        } else {
          router.replace('/');
        }
      };

    const handleAddServiceSubmit = async (serviceData: ServiceInsert) => {
        if (!practitionerId) {
             Alert.alert("Error", "User ID not found.");
             return; // Should not happen if button is only enabled when ID exists
        }
        console.log("Attempting to add service:", serviceData);
        const dataToInsert = { ...serviceData, user_id: practitionerId };

        const { error } = await supabase
            .from('services')
            .insert(dataToInsert);
            // No need to select here, we will refetch

        if (error) {
            console.error("Error adding service:", error);
            Alert.alert("Error", `Failed to add service: ${error.message}`);
            throw error; // Re-throw error so form knows submission failed
        } else {
            console.log("Service added successfully to DB.");
            Alert.alert("Success", "Service added successfully!");
            setIsAddServiceModalVisible(false); // Close modal on success
            // Re-fetch services to update the list reliably
            fetchServicesForPractitioner(practitionerId).then(({ data, error: fetchError }) => {
                 if (isMountedRef.current) { // Check ref before updating
                     if (!fetchError && data) {
                         setServices(data);
                     } else if (fetchError) {
                          console.error("Error re-fetching services after add:", fetchError);
                     }
                 }
            });
        }
    };

    // --- Render Logic ---
    if (isLoading && !practitionerId) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
     
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                 <Title>Practitioner Dashboard</Title>
                 <Button mode="outlined" onPress={handleLogout} loading={isLoading}>Logout</Button>
            </View>

            {/* Manage Services Section */}
            <Card style={styles.sectionCard}>
                <Card.Content>
                    <Title>My Services</Title>
                    {isLoading && services.length === 0 ? (
                         <ActivityIndicator />
                    ) : services.length === 0 ? (
                        <Text>You haven't added any services yet.</Text>
                    ) : (
                        services.map(service => (
                            <Card key={service.id} style={styles.itemCard}>
                                <Card.Content>
                                    <Paragraph style={styles.itemTitle}>{service.title}</Paragraph>
                                    <Paragraph>Price: ${service.price?.toFixed(2)}</Paragraph>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                     <Button mode="contained" style={{marginTop: 10}} onPress={() => setIsAddServiceModalVisible(true)} disabled={isLoading}>Add New Service</Button>
                </Card.Content>
            </Card>

            {/* Pending Booking Requests Section */}
            <Card style={styles.sectionCard}>
                <Card.Content>
                    <Title>Pending Booking Requests</Title>
                     {isLoading && pendingBookings.length === 0 ? (
                         <ActivityIndicator />
                     ) : pendingBookings.length === 0 ? (
                         <Text>No pending booking requests.</Text>
                     ) : (
                         <BookingRequests
                             requests={pendingBookings}
                             userRole="practitioner"
                             onRespond={handleRespond}
                             onCancel={() => {}} // Practitioners don't cancel
                             isProcessingResponse={isProcessingResponse}
                         />
                     )}
                </Card.Content>
            </Card>

            {/* Add Service Modal */}
            <AddServiceForm
               visible={isAddServiceModalVisible}
               onDismiss={() => setIsAddServiceModalVisible(false)}
               onSubmit={handleAddServiceSubmit} // Now this function exists
               practitionerId={practitionerId}
            />
        </ScrollView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionCard: {
        marginBottom: 20,
    },
    itemCard: {
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#f9f9f9'
    },
    itemTitle: {
        fontWeight: 'bold',
    }
});

export default PractitionerHomeScreen;

function useRef(arg0: boolean) {
    throw new Error('Function not implemented.');
}
