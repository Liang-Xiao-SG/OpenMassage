import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { Link, Redirect } from 'expo-router';
import supabase from '../utils/supabaseClient'; // Adjust path if necessary
import { Session } from '@supabase/supabase-js';

// Keep the original WelcomeScreen component
const WelcomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Placeholder for App Logo */}
            <Text style={styles.logoPlaceholder}>[App Logo]</Text>

            <Text variant="headlineMedium" style={styles.title}>
              Welcome to Open Massage
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Connect with massage practitioners in Singapore.
            </Text>

            <Link href="/login" asChild>
              <Button mode="contained" style={styles.button}>
                Login
              </Button>
            </Link>

            <Link href="/signup" asChild>
              <Button mode="outlined" style={styles.button}>
                Sign Up
              </Button>
            </Link>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
};

// New default export component to handle auth check
const RootIndex = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error fetching session:", error);
        // Handle error appropriately, maybe show an error message
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Optional: Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // No need to setLoading(false) here again unless the initial fetch fails
      // and this listener provides the first valid session state.
      // If fetchSession completes, loading is already false.
      if (loading && session !== null) { // Corrected: Use && instead of &amp;amp;
         setLoading(false); // Ensure loading stops if listener fires quickly
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [loading]); // Rerun effect if loading state changes (e.g., manual refresh)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session && session.user) { // Corrected: Use && instead of &amp;amp;
    // User is logged in, redirect to the home screen
    // Assuming '/home' is the route for the main dashboard/home screen
    return <Redirect href="/home" />;
  }

  // No user session, show the Welcome screen
  return <WelcomeScreen />;
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light background for the whole screen
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400, // Max width for larger screens
    padding: 10,
  },
  logoPlaceholder: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#888', // Placeholder color
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  button: {
    marginTop: 15,
  },
  loadingContainer: { // Added style for loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default RootIndex; // Export the new RootIndex component