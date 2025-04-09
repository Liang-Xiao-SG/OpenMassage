import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Title, Button, Text, ActivityIndicator, Card } from 'react-native-paper'; // Added Text, ActivityIndicator, Card
import { useRouter } from 'expo-router';
import supabase from '../../../utils/supabaseClient';
import { Database } from '../../../types/database.types'; // Import generated types
import ProviderList from '../../components/Service/ProviderList';

// Removed BookingWithDetails type definition (Ensured removal)
const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null); // Ensured only userId state remains
  // Removed refreshCounter state

  // Get user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        // Handle case where user is somehow not logged in (should be caught by index.tsx)
        console.error("User not found in HomeScreen");
        // setLoadingBooking removed
      }
    };
    fetchUser();
  }, []);

  // Removed fetchLastBooking function and related useEffect entirely

  // Function to trigger a screen refresh by navigating to itself
  const handleBookingMade = () => {
    console.log("HomeScreen: Booking made, triggering refresh...");
    router.replace('/home'); // Replace current screen with itself
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout Error', error.message);
    } else {
      // The onAuthStateChange listener in index.tsx should handle redirection
      // but we can force it if needed:
      router.replace('/'); // Navigate back to the root/welcome screen
    }
  };
// Ensured renderLastBooking function is removed

const handleDeleteAccount = async () => {
  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Alert.alert("Account Deletion", "Account deletion functionality not yet implemented."); // Remove placeholder
          // Implement Supabase function call for deletion
          try {
            // Ensure the user is authenticated before calling the function
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
               Alert.alert("Error", "You must be logged in to delete your account.");
               return;
            }

            console.log("Invoking delete-user function...");
            const { error } = await supabase.functions.invoke('delete-user'); // Call the function
            if (error) throw error; // Throw if function invocation fails

            Alert.alert("Success", "Your account has been successfully deleted.");
            await supabase.auth.signOut(); // Sign out the user locally
            router.replace('/'); // Navigate back to the root/login screen
          } catch (error: any) {
            console.error("Account Deletion Error:", error);
            Alert.alert("Deletion Error", error.message || "An unexpected error occurred while deleting your account.");
          }
        },
      },
    ]
  );
};

return (
  <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} /> {/* Spacer to push buttons right */}
        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          style={styles.deleteButton} // Add specific style if needed, or reuse logoutButton style
          textColor="red" // Make it visually distinct
        >
          Delete Account
        </Button>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
      {/* Ensured renderLastBooking call is removed */}
      <Title style={styles.listTitle}>Available Practitioners</Title>
      <ProviderList onBookingMade={handleBookingMade} /> {/* Pass refresh handler */}
    </View>
  );
};

// Add some basic styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: { // Container for title and logout button
    flexDirection: 'row',
    // justifyContent: 'space-between', // Removed to use spacer
    alignItems: 'center', // Vertically align items
    marginBottom: 16,
  },
  logoutButton: {
    marginLeft: 8, // Add some space between buttons
  },
  deleteButton: {
    // Add specific styling if needed, e.g., marginRight: 8npx 
    // Using marginLeft on logoutButton achieves spacing for now
  },
  // Optional title styling
  // title: {
  //   marginRight: 'auto', // Push title left if uncommented
  // },
  infoCard: {
    marginBottom: 20, // Space below the booking card
  },
  specialRequests: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#555',
  },
  listTitle: { // Title for the provider list
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold', // Make title bolder
  }
});

export default HomeScreen;