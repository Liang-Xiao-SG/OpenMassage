import React, { useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Card, Title, TextInput, Button, Text } from 'react-native-paper';
import DatePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs'; // Datepicker uses dayjs
import { BookingFormData } from './ProviderList';

interface BookingRequestFormProps {
  onSubmit: (formData: BookingFormData) => void;
  onCancel: () => void;
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [booking_date, setDate] = useState(dayjs()); // Use dayjs for the date state
  const [specialRequests, setSpecialRequests] = useState('');

  // Remove old date handlers handleDateChange and handleWebDateChange

  const handleSubmit = () => {
    if (!booking_date || !specialRequests) {
      alert('Please select a date/time and fill in special requests.');
      return;
    }
    const formData: BookingFormData = {
      booking_date: booking_date.toISOString(),
      special_requests: specialRequests,
    };
    onSubmit(formData);
  };

  // Remove unused formatDate function

  return (
    <Card style={styles.card}>
      <Title>Request a Booking</Title>

      <Text style={styles.label}>Select Date & Time</Text>

      <DatePicker
        mode="datetime" // Use datetime mode
        value={booking_date}
        onValueChange={date => setDate(dayjs(date))} // Update state using dayjs
        style={styles.datePicker}
      />

      <TextInput
        label="Special Requests"
        placeholder="Any specific needs or preferences?"
        value={specialRequests}
        onChangeText={setSpecialRequests}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.textInput}
      />

      <View style={styles.buttonContainer}>
        <Button onPress={onCancel} mode="outlined" style={styles.cancelButton}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} mode="contained">
          Submit Request
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
  },
  label: {
    marginBottom: 4,
    color: 'grey',
    fontSize: 12,
  },
  // Remove unused styles dateDisplay and webDateInput
  datePicker: { // Add style for the new date picker if needed
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
  },
});

export default BookingRequestForm;
