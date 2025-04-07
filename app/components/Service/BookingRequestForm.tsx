import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Title, TextInput, Button } from 'react-native-paper';
import { BookingFormData } from './ProviderList'; // Import the form data type

// Define props for the component
interface BookingRequestFormProps {
  onSubmit: (formData: BookingFormData) => void;
  onCancel: () => void; // Add onCancel prop
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({ onSubmit, onCancel }) => {
  // State aligned with BookingFormData (expecting ISO string for date/time)
  const [dateTimeString, setDateTimeString] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleSubmit = () => {
    // Basic validation (can be improved)
    if (!dateTimeString || !specialRequests) {
        alert('Please fill in all fields.');
        return;
    }
    // Construct data matching BookingFormData
    const formData: BookingFormData = {
        date: dateTimeString, // Pass the ISO string directly
        special_requests: specialRequests
    };
    console.log('Submitting Booking Request:', formData);
    onSubmit(formData);
    // Optionally clear fields after submission, or rely on parent to hide form
    // setDateTimeString('');
    // setSpecialRequests('');
  };

  return (
    // Wrap form in a Card for better UI structure
    <Card style={{ marginTop: 16, marginBottom: 16, padding: 16 }}>
      <Title>Request a Booking</Title>
      <TextInput
        label="Date & Time (YYYY-MM-DDTHH:mm:ss)" // Guide user on format
        placeholder="e.g., 2025-12-31T14:30:00"
        value={dateTimeString}
        onChangeText={setDateTimeString}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Special Requests"
        placeholder="Any specific needs or preferences?"
        value={specialRequests}
        onChangeText={setSpecialRequests}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
         <Button onPress={onCancel} mode="outlined" style={{ marginRight: 8 }}>
            Cancel
         </Button>
         <Button onPress={handleSubmit} mode="contained">
            Submit Request
         </Button>
      </View>
    </Card>
  );
};

export default BookingRequestForm;