import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Text, Card, Title, Paragraph } from 'react-native-paper';
import { useRouter } from 'expo-router';
import supabase from '../../../utils/supabaseClient';
import { Database } from '../../../types/database.types';
import BookingRequests, { BookingRequest } from '../../components/Service/BookingRequests'; // Re-use component

type Service = Database['public']['Tables']['services']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type User = Database['public']['Tables']['users']['Row'];

// Define type for booking requests with client info (needed for practitioner view)
type BookingRequestWithClient = Booking & {
    users: Pick<User, 'name' | 'email'> | null; // Fetch client name/email
    services: Pick<Service, 'title'> | null; // Fetch service title
};


const PractitionerHomeScreen: React.FC = () => {
    const router = useRouter();
    const [practitionerId, setPractitionerId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [pendingBookings, setPendingBookings] = useState<BookingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingResponse, setIsProcessingResponse] = useState(false);
    const [bookingsChannel, setBookingsChannel] = useState<any>(null); // State for realtime channel

    // Fetch Practitioner ID on mount
    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) {
                console.error("Error fetching session or no user found:", sessionError);
                Alert.alert("Error", "Could not get user session. Please log in again.");
                router.replace('/login'); // Redirect to login if no session
                setIsLoading(false);
                return;
            }
            // TODO: Add check here to ensure user role is 'practitioner'
            // Fetch role from public.users table if needed
            setPractitionerId(session.user.id);
        };
        fetchUser();
    }, [router]);

    // Fetch Services and Pending Bookings, setup realtime
    useEffect(() => {
        if (!practitionerId) return;

        let isMounted = true;
        let currentSubscription: any = bookingsChannel; // Use state for current channel reference

        const fetchDataAndSubscribe = async () => {
            if (!isMounted) return;
            console.log("fetchDataAndSubscribe called for practitioner:", practitionerId);
            setIsLoading(true);
            // Don't reset state here initially, let fetch update it

            // Fetch services first
            console.log("Fetching services for practitioner:", practitionerId);
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id') // Only need IDs for filtering bookings
                .eq('user_id', practitionerId);

            if (!isMounted) return;
            if (servicesError) {
                console.error("Error fetching service IDs:", servicesError);
                Alert.alert("Error", "Could not fetch your service IDs.");
                setIsLoading(false);
                return;
            }

            const serviceIds = (servicesData || []).map((s: { id: string }) => s.id);
            console.log("Service IDs obtained:", serviceIds);

            // Fetch initial pending bookings based on fetched service IDs
            if (serviceIds.length > 0) {
                console.log("Fetching pending bookings for service IDs:", serviceIds);
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        users!bookings_client_id_fkey ( name, email ),
                        services ( title )
                    `)
                    .in('service_id', serviceIds)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });

                 if (!isMounted) return;
                 if (bookingsError) {
                    console.error("Error fetching initial pending bookings:", bookingsError);
                    Alert.alert("Error", "Could not fetch pending bookings.");
                    setPendingBookings([]);
                 } else {
                    console.log("Fetched initial pending bookings:", bookingsData?.length ?? 0);
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
            } else {
                 console.log("No services found, setting pending bookings to empty.");
                 setPendingBookings([]);
            }

            // --- Realtime Setup ---
            // Ensure previous subscription is removed before creating a new one
            if (currentSubscription) {
                console.log("Removing previous channel subscription before creating new one.");
                supabase.removeChannel(currentSubscription).then(() => {
                    console.log("Previous channel removed successfully");
                    currentSubscription = null; // Clear reference after removal
                    setBookingsChannel(null); // Clear state after removal
                    subscribeToNewChannel(serviceIds); // Subscribe after removal
                }).catch(removeError => {
                    console.error("Error removing previous channel:", removeError);
                    // Still attempt to subscribe even if removal failed
                    subscribeToNewChannel(serviceIds);
                });
            } else {
                subscribeToNewChannel(serviceIds); // Subscribe directly if no previous channel
            }

            setIsLoading(false); // Loading finished after initial fetch and subscription setup
        };

        const subscribeToNewChannel = (serviceIds: string[]) => {
            if (!isMounted) return; // Don't subscribe if unmounted

            const channelName = `practitioner-bookings-${practitionerId}-${Date.now()}`; // Define channel name
            const newChannelFilter = serviceIds.length > 0
                ? `service_id=in.(${serviceIds.join(',')})`
                : 'service_id=eq.00000000-0000-0000-0000-000000000000'; // Non-matching filter

            console.log(`Setting up new bookings channel '${channelName}' with filter: ${newChannelFilter}`);
            const newChannel = supabase
                .channel(channelName) // Use defined channel name
                .on<Booking>(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'bookings', filter: newChannelFilter },
                    (payload) => {
                        console.log('Realtime: Practitioner bookings change received!', payload);
                        if (isMounted) {
                            // Refetch all data on any change for simplicity
                            // TODO: Implement smarter updates based on payload (INSERT, UPDATE, DELETE) later
                            console.log("Realtime: Re-fetching data due to change.");
                            fetchDataAndSubscribe();
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (!isMounted) return;
                    currentSubscription = newChannel; // Update local reference
                    setBookingsChannel(newChannel); // Store channel in state
                    if (status === 'SUBSCRIBED') {
                        console.log(`Realtime: Successfully subscribed to channel ${channelName}`);
                    } else {
                        console.warn(`Realtime: Subscription status for ${channelName}: ${status}`);
                        // Clear state if subscription fails? Maybe retry?
                        // setBookingsChannel(null);
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error(`Realtime: Channel error for ${channelName}:`, err);
                    }
                    if (status === 'TIMED_OUT') {
                        console.warn(`Realtime: Channel timeout for ${channelName}`);
                    }
                });
        };


        fetchDataAndSubscribe();

        // Cleanup function
        return () => {
            console.log("PractitionerHomeScreen unmounting, cleaning up channel.");
            isMounted = false;
            const channelToRemove = bookingsChannel || currentSubscription; // Use state or local ref
            if (channelToRemove) {
                supabase.removeChannel(channelToRemove)
                    .then(() => console.log("Realtime: Channel removed successfully on unmount."))
                    .catch(err => console.error("Realtime: Error removing channel on unmount:", err));
            }
            setBookingsChannel(null); // Clear state on unmount
        };

    }, [practitionerId]); // Dependency array includes practitionerId

    const handleRespond = async (bookingId: string, response: 'accepted' | 'declined') => {
        setIsProcessingResponse(true); // Indicate activity
        const { error } = await supabase
            .from('bookings')
            .update({ status: response })
            .eq('id', bookingId);

        if (error) {
            console.error(`Error ${response === 'accepted' ? 'accepting' : 'declining'} booking:`, error);
            Alert.alert("Error", `Failed to ${response} booking.`);
        } else {
            // Refresh data locally or rely on realtime/refetch
            setPendingBookings(prev => prev.filter(b => b.id !== bookingId)); // Optimistic update: remove from pending
            Alert.alert("Success", `Booking ${response}.`);
            // Realtime should handle the update, but explicit fetch can be added if needed
            // fetchBookingRequests(practitionerId);
        }
        setIsProcessingResponse(false);
    };

     const handleLogout = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        setIsLoading(false);
        if (error) {
          Alert.alert('Logout Error', error.message);
        } else {
          router.replace('/'); // Navigate back to the root/welcome screen
        }
      };


    if (isLoading && !practitionerId) { // Show loading only during initial user fetch
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                 <Title>Practitioner Dashboard</Title>
                 <Button mode="outlined" onPress={handleLogout} loading={isLoading || isProcessingResponse}>Logout</Button>
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
                                    {/* Add Edit/Delete buttons later */}
                                </Card.Content>
                                {/* Add Edit/Delete Actions later */}
                                {/* <Card.Actions>
                                    <Button onPress={() => alert('Edit ' + service.id)}>Edit</Button>
                                    <Button onPress={() => alert('Delete ' + service.id)}>Delete</Button>
                                </Card.Actions> */}
                            </Card>
                        ))
                    )}
                    {/* Add "Add Service" button later */}
                     <Button mode="contained" style={{marginTop: 10}} onPress={() => alert('Add Service - To be implemented')}>Add New Service</Button>
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
                             userRole="practitioner" // Pass correct role
                             onRespond={handleRespond}
                             onCancel={() => {}} // Practitioners don't cancel this way
                             isProcessingResponse={isProcessingResponse} // Pass loading state
                         />
                     )}
                </Card.Content>
            </Card>
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
        backgroundColor: '#f9f9f9' // Slight background for item cards
    },
    itemTitle: {
        fontWeight: 'bold',
    }
});

export default PractitionerHomeScreen;