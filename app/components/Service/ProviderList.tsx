import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { Card, Text, Button, Title, Paragraph } from 'react-native-paper';
// import mockProviders from '../../utils/mockProviders'; // Remove mock data
import supabase from '../../../utils/supabaseClient';
import BookingRequestForm from './BookingRequestForm';
import BookingRequests, { BookingRequest } from './BookingRequests';
import { Database } from '../../../types/database.types'; // Import generated types

// Define type alias for convenience
type Service = Database['public']['Tables']['services']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];

// Define the combined type for service with provider info
type ServiceWithProvider = Service & {
  users: Pick<User, 'name'> | null; // Fetching only the name from the related user
};

// Define the structure of data coming from the form
export interface BookingFormData { // Add export keyword
    date: string; // Or Date object, depending on form implementation
    // time: string; // Removed as per schema (DateTime)
    special_requests: string;
}

// Remove SupabaseBooking interface, use generated Booking type

const ProviderList: React.FC = () => {
  const [services, setServices] = useState<ServiceWithProvider[]>([]); // State for fetched services
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true); // Loading state for services
  const [isFormVisible, setFormVisible] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null); // Changed from providerId to serviceId
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]); // Keep this for now, might need adjustment based on BookingRequests component props

  const handleBookingRequest = async (request: BookingFormData, serviceId: string) => { // Changed providerId to serviceId
    // TODO: Replace 'client-id-placeholder' with actual authenticated user ID
    const clientId = 'client-id-placeholder';

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        service_id: serviceId, // Use the correct service ID
        client_id: clientId,
        date: request.date, // Ensure this is in a format Supabase accepts (e.g., ISO string)
        special_requests: request.special_requests,
        status: 'pending' // Use the enum type directly if needed, but Supabase infers it
      }])
      .select() // Select the inserted row to potentially use it
      .single(); // Expecting a single row back
      
    if (error) {
      console.error('Error storing booking request:', error);
      // TODO: Show user feedback
    } else {
      console.log('Booking request stored:', data);
      // Optional: Add to local state immediately, but realtime should handle it.
      // If adding locally, ensure 'data' matches the 'BookingRequest' interface structure.
      // const newRequest: BookingRequest = { ...data, time: new Date(data.date).toLocaleTimeString() }; // Example transformation
      // setBookingRequests(prev => [...prev, newRequest]);
    }
    setFormVisible(false); // Close the form after submission
  };

  const handleRespond = async (id: string, status: BookingStatus) => { // Use generated Enum type
    console.log(`Provider responded to request ${id}: ${status}`);
    
    // Update status in Supabase
    const { error } = await supabase
      .from('bookings')
      .update({ status }) // Use the enum type
      .eq('id', id);

    if (error) {
      console.error('Error updating booking status:', error);
    } else {
      // Update local state to reflect the change
      // Update local state to reflect the change immediately
      setBookingRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === id ? { ...req, status: status } : req // Assumes req matches BookingRequest structure
        )
      );
      // Simulate notifying the client
      console.log(`Notify client: Your booking request (ID: ${id}) was ${status}.`);
    }
  };

  const fetchBookingRequests = async () => {
    // Assuming we fetch requests relevant to the current provider/client
    // For now, let's fetch all pending requests for demonstration
    // Replace 'client-id' or add provider logic as needed
    // TODO: Add filtering based on user role (client sees their requests, provider sees requests for their services)
    // const userId = 'user-id-placeholder'; // Get current user ID
    // const userRole = 'client'; // Get current user role
    // let query = supabase.from('bookings').select('*');
    // if (userRole === 'client') {
    //   query = query.eq('client_id', userId);
    // } else if (userRole === 'practitioner') {
    //   // Need to fetch services offered by practitioner first, then filter bookings by those service_ids
    //   // This might require a more complex query or multiple queries.
    //   // query = query.in('service_id', providerServiceIds);
    // }

    const { data, error } = await supabase
      .from('bookings')
      .select<string, Booking>('*') // Use generated Booking type
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching booking requests:', error);
      setBookingRequests([]); // Set to empty array on error
    } else {
      // Transform Supabase data to match the BookingRequest prop type if necessary
      interface FormattedBookingRequest extends BookingRequest {
          time: string; // Add 'time' field to extend BookingRequest
      }

      // Transform Supabase data to match the BookingRequest prop type
      const formattedRequests: BookingRequest[] = (data || []).map((req: Booking): BookingRequest => {
        const bookingDateTime = new Date(req.booking_date); // Create Date object once
        return {
          id: req.id,
          date: bookingDateTime.toLocaleDateString(), // Extract date part
          time: bookingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Extract time part
          special_requests: req.special_requests ?? '', // Handle null
          status: req.status,
        };
      });
      setBookingRequests(formattedRequests);
    }
  };

  // Fetch services and booking requests, set up realtime
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          users ( name )
        `); // Fetch services and related user's name

      if (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      } else {
        // Filter out services where the user relationship might be null if needed,
        // or handle the null case in rendering.
        console.log('Fetched services:', data); // Keep a log for confirmation
        setServices(data as ServiceWithProvider[] || []);
      }
      setIsLoadingServices(false);
    };

    fetchServices();
    fetchBookingRequests(); // Fetch initial booking requests

    // Set up Supabase Realtime subscription for bookings
    const bookingsChannel = supabase.channel('public:bookings')
      .on<Booking>( // Use the generated type for payload
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Bookings change received!', payload);
          // Re-fetch data or update state smartly based on payload
          // For simplicity, re-fetching:
          fetchBookingRequests();
        }
      )
      .subscribe();

    // Optional: Add subscription for services if they can change
    // const servicesChannel = supabase.channel('public:services')...subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(bookingsChannel);
      // supabase.removeChannel(servicesChannel); // If added
    };
  }, []);


  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Title style={{ marginBottom: 16 }}>Available Services</Title>
      {isLoadingServices ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
      ) : (
        <View style={{ marginBottom: 20 }}>
          {services.length === 0 && <Text>No services available currently.</Text>}
          {services.map((service) => (
            <Card key={service.id} style={{ marginBottom: 16 }}>
              <Card.Content>
                <Title>{service.title}</Title>
                {/* Display provider name if available */}
                {service.users?.name && <Paragraph>Provider: {service.users.name}</Paragraph>}
                {service.description && <Paragraph>{service.description}</Paragraph>}
                {service.specialties && service.specialties.length > 0 && (
                  <Paragraph>Specialties: {service.specialties.join(', ')}</Paragraph>
                )}
                 {service.price && <Paragraph>Price: ${service.price.toFixed(2)}</Paragraph>}
                {/* Add Rating later if implemented */}
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedServiceId(service.id); // Use service ID
                    setFormVisible(true);
                  }}
                >
                  Request Booking
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
      {/* Conditionally render BookingRequestForm */}
      {/* Conditionally render BookingRequestForm */}
      {isFormVisible && selectedServiceId && (
        <BookingRequestForm
          onSubmit={(formData: BookingFormData) => handleBookingRequest(formData, selectedServiceId)}
          onCancel={() => {
              setFormVisible(false);
              setSelectedServiceId(null); // Clear selected service ID
          }}
        />
      )}

      {/* Display existing booking requests */}
      {bookingRequests.length > 0 && (
        <View style={{ marginTop: 24 }}>
           <BookingRequests requests={bookingRequests} onRespond={handleRespond} />
        </View>
      )}
    </View>
  );
};

export default ProviderList;