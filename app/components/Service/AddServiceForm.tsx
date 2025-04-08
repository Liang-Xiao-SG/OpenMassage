import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Card, Title, TextInput, Button, Chip, Text } from 'react-native-paper';
import supabase from '../../../utils/supabaseClient'; // Adjust path if needed
import { Database } from '../../../types/database.types';

type ServiceInsert = Database['public']['Tables']['services']['Insert'];

interface AddServiceFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (serviceData: ServiceInsert) => Promise<void>; // Make async to handle loading
  practitionerId: string | null;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({ visible, onDismiss, onSubmit, practitionerId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [currentSpecialty, setCurrentSpecialty] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSpecialty = () => {
    if (currentSpecialty && !specialties.includes(currentSpecialty.trim())) {
      setSpecialties([...specialties, currentSpecialty.trim()]);
      setCurrentSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    setSpecialties(specialties.filter(spec => spec !== specToRemove));
  };

  const handleSubmit = async () => {
    if (!practitionerId) {
        Alert.alert("Error", "Cannot add service without practitioner ID.");
        return;
    }
    if (!title || !price) {
      Alert.alert('Missing Information', 'Please provide at least a title and price.');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
        Alert.alert('Invalid Price', 'Please enter a valid positive number for the price.');
        return;
    }

    const serviceData: ServiceInsert = {
      title: title,
      description: description || null, // Allow empty description
      price: priceNumber,
      specialties: specialties.length > 0 ? specialties : null, // Allow empty specialties
      user_id: practitionerId,
    };

    setLoading(true);
    try {
        await onSubmit(serviceData);
        // Clear form on successful submission before dismissing
        // This happens in useEffect now based on visibility change
        // onDismiss(); // Close modal - called by parent on success
    } catch (error) {
        // Error handling is done in the parent component's onSubmit
        console.error("Submission failed in form:", error);
    } finally {
        setLoading(false);
    }
  };

  // Reset form state when modal becomes hidden or practitionerId changes (to prevent stale data)
  useEffect(() => {
    if (!visible) {
        setTitle('');
        setDescription('');
        setPrice('');
        setSpecialties([]);
        setCurrentSpecialty('');
        setLoading(false);
    }
  }, [visible]);


  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Add New Service</Title>
            <TextInput
              label="Service Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              disabled={loading}
            />
            <TextInput
              label="Price (SGD)"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              disabled={loading}
            />

            <View style={styles.specialtyContainer}>
                 <TextInput
                    label="Add Specialty"
                    value={currentSpecialty}
                    onChangeText={setCurrentSpecialty}
                    mode="outlined"
                    style={styles.specialtyInput}
                    disabled={loading}
                 />
                 <Button onPress={handleAddSpecialty} disabled={!currentSpecialty || loading} mode="contained" style={styles.addButton}>Add</Button>
            </View>
            <View style={styles.chipContainer}>
                {specialties.map((spec) => (
                    <Chip
                        key={spec}
                        onClose={() => handleRemoveSpecialty(spec)}
                        style={styles.chip}
                        disabled={loading}
                    >
                        {spec}
                    </Chip>
                ))}
                 {specialties.length === 0 && <Text style={styles.noSpecsText}>No specialties added yet.</Text>}
            </View>

            <View style={styles.buttonRow}>
              <Button onPress={onDismiss} disabled={loading} style={styles.cancelButton}>Cancel</Button>
              <Button onPress={handleSubmit} mode="contained" loading={loading} disabled={loading || !title || !price}>
                Add Service
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
     backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  card: {
    width: '95%', // Adjust width as needed
    maxWidth: 500,
    padding: 10,
  },
  input: {
    marginBottom: 12,
  },
   specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    height: 55, // Match TextInput height approx
    justifyContent: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    minHeight: 30, // Ensure space even when empty
  },
  chip: {
    margin: 4,
  },
  noSpecsText: {
      fontStyle: 'italic',
      color: 'grey',
      marginLeft: 4,
      marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  cancelButton: {
      marginRight: 8,
  }
});

export default AddServiceForm;