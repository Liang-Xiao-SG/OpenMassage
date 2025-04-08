import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button, Paragraph } from 'react-native-paper';

// Define the structure of a booking request based on schema and usage
export interface BookingRequest { // Add export keyword
  id: string; // Assuming UUID is string
  booking_date: string; // Assuming formatted date string
  time: string; // Assuming formatted time string
  special_requests: string;
  // TODO: Ensure 'cancelled' is added to the booking_status enum in Supabase DB schema
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  // Add other fields like client name if available/needed
}

// Define the props for the component
interface BookingRequestsProps {
  requests: BookingRequest[];
  userRole: 'client' | 'practitioner'; // Added userRole prop
  onRespond: (requestId: string, response: 'accepted' | 'declined') => void;
  onCancel: (requestId: string) => void; // Added onCancel prop
}

const BookingRequests: React.FC<BookingRequestsProps> = ({ requests, userRole, onRespond, onCancel }) => {
  return (
    <View>
      <Text variant="headlineMedium" style={{ marginBottom: 16 }}>Booking Requests</Text>
      {requests.map(request => ( // Removed slice, as data is already limited by the fetch in ProviderList
        <Card key={request.id} style={{ marginBottom: 16 }}>
          <Card.Content>
            <Paragraph>Date: {request.booking_date}</Paragraph>
            <Paragraph>Time: {request.time}</Paragraph>
            <Paragraph>Special Requests: {request.special_requests}</Paragraph>
            <Paragraph>Status: {request.status}</Paragraph>
          </Card.Content>
          {request.status === 'pending' && (
            <Card.Actions>
              {userRole === 'practitioner' && (
                <>
                  <Button mode="contained" onPress={() => onRespond(request.id, 'accepted')}>Accept</Button>
                  <Button mode="outlined" onPress={() => onRespond(request.id, 'declined')} style={{ marginLeft: 8 }}>Decline</Button>
                </>
              )}
              {userRole === 'client' && (
                 <Button mode="contained" color="red" onPress={() => onCancel(request.id)}>Cancel Booking</Button> // Example styling
              )}
            </Card.Actions>
          )}
        </Card>
      ))}
    </View>
  );
};

export default BookingRequests;