import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button, Paragraph } from 'react-native-paper';

// Define the structure of a booking request based on schema and usage
export interface BookingRequest { // Add export keyword
  id: string; // Assuming UUID is string
  date: string; // Assuming formatted date string
  time: string; // Assuming formatted time string
  special_requests: string;
  status: 'pending' | 'accepted' | 'declined';
  // Add other fields like client name if available/needed
}

// Define the props for the component
interface BookingRequestsProps {
  requests: BookingRequest[];
  onRespond: (requestId: string, response: 'accepted' | 'declined') => void;
}

const BookingRequests: React.FC<BookingRequestsProps> = ({ requests, onRespond }) => {
  return (
    <View>
      <Text variant="headlineMedium" style={{ marginBottom: 16 }}>Booking Requests</Text>
      {requests.map(request => (
        <Card key={request.id} style={{ marginBottom: 16 }}>
          <Card.Content>
            <Paragraph>Date: {request.date}</Paragraph>
            <Paragraph>Time: {request.time}</Paragraph>
            <Paragraph>Special Requests: {request.special_requests}</Paragraph>
            <Paragraph>Status: {request.status}</Paragraph>
          </Card.Content>
          {request.status === 'pending' && (
            <Card.Actions>
              <Button mode="contained" onPress={() => onRespond(request.id, 'accepted')}>Accept</Button>
              <Button mode="outlined" onPress={() => onRespond(request.id, 'declined')} style={{ marginLeft: 8 }}>Decline</Button>
            </Card.Actions>
          )}
        </Card>
      ))}
    </View>
  );
};

export default BookingRequests;