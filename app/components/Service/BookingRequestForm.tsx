import React, { useState } from 'react';
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BookingFormData } from './ProviderList';

interface BookingRequestFormProps {
  onSubmit: (formData: BookingFormData) => void;
  onCancel: () => void;
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [booking_date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
    }
  };

  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setDate(newDate);
    }
  };

  const handleSubmit = () => {
    if (!booking_date || !specialRequests) {
      alert('Please select a date/time and fill in special requests.');
      return;
    }
    const formData: BookingFormData = {
      booking_date: booking_date.toISOString(), // Changed key to booking_date
      special_requests: specialRequests,
    };
    onSubmit(formData);
  };

  const formatDate = (dateToFormat: Date) => {
    return `${dateToFormat.getFullYear()}-${String(dateToFormat.getMonth() + 1).padStart(2, '0')}-${String(dateToFormat.getDate()).padStart(2, '0')} ${String(dateToFormat.getHours()).padStart(2, '0')}:${String(dateToFormat.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Card style={styles.card}>
      <Title>Request a Booking</Title>

      <Text style={styles.label}>Select Date & Time</Text>

      {Platform.OS === 'web' ? (
        <input
          type="datetime-local"
          onChange={handleWebDateChange}
          value={booking_date.toISOString().slice(0, 16)}
          className="web-date-input"
          title="Select date and time"
          placeholder="YYYY-MM-DDTHH:MM"
        />
      ) : (
         <TextInput
           label="Date & Time (YYYY-MM-DD HH:MM)"
           value={formatDate(booking_date)}
           // onChangeText={(text) => { /* Basic text handling if needed, but complex date parsing omitted */ }}
           editable={false} // Make it non-editable for now, user needs native picker
           placeholder="Requires native date picker setup"
           style={styles.textInput} // Reuse existing style
         />
      )}

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
  dateDisplay: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    marginBottom: 12,
  },
  webDateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
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
