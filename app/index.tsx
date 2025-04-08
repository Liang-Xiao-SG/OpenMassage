import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { Link, Redirect } from 'expo-router';
import supabase from '../utils/supabaseClient'; // Adjust path if necessary
import { Session, User } from '@supabase/supabase-js';
import { Database } from '../types/database.types'; // Import Database types

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
  const [userRole, setUserRole] = useState<Database['public']['Enums']['user_role'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Combined function to fetch session and user role
    const checkAuthAndRole = async (currentSession: Session | null) => {
        setSession(currentSession); // Update session state immediately

        if (currentSession?.user) {
            console.log("Session found, fetching user role for:", currentSession.user.id);
            try {
                const { data: userData, error: profileError } = await supabase
                    .from('users') // Your public users table
                    .select('role')
                    .eq('id', currentSession.user.id)
                    .single(); // Expecting one profile row

                if (profileError) {
                    console.error("Error fetching user profile:", profileError);
                    // Handle profile fetch error - maybe user exists in auth but not public.users?
                    // Log out or redirect to an error page/login?
                    setUserRole(null); // Ensure role is null if profile fetch fails
                    await supabase.auth.signOut(); // Log out user if profile is missing
                } else if (userData) {
                    console.log("User role fetched:", userData.role);
                    setUserRole(userData.role);
                } else {
                     console.warn("User profile not found for ID:", currentSession.user.id);
                     setUserRole(null); // No profile found
                     await supabase.auth.signOut(); // Log out user if profile is missing
                }
            } catch (error) {
                 console.error("Unexpected error fetching role:", error);
                 setUserRole(null);
            } finally {
                 setLoading(false); // Loading finished after role check
            }
        } else {
            console.log("No active session.");
            setUserRole(null); // Clear role if no session
            setLoading(false); // Loading finished if no session
        }
    };

    // Initial check on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
        checkAuthAndRole(session);
    });

    // Optional: Listen for auth state changes
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed, new session:", session ? 'Exists' : 'Null');
        setLoading(true); // Set loading true while checking new session/role
        checkAuthAndRole(session);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Run effect only once on mount

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- Redirection Logic ---
  if (session && session.user && userRole) {
    // Session exists and role is determined
    if (userRole === 'practitioner') {
      console.log("Redirecting practitioner to /practitioner/home");
      return <Redirect href="/practitioner/home" />;
    } else if (userRole === 'client') {
      console.log("Redirecting client to /home");
      return <Redirect href="/home" />;
    } else {
      // Should not happen if enum is correct, but handle defensively
       console.warn("Unknown user role:", userRole);
       // Fallback to welcome screen or show error
       return <WelcomeScreen />;
    }
  }

  // If session exists but role is still null (e.g., profile fetch failed/pending),
  // stay in loading state or show welcome screen. Here we show WelcomeScreen if not loading.
  if (!loading && !session) {
      console.log("No session, showing WelcomeScreen");
      return <WelcomeScreen />;
  }

  // If still loading, show indicator (already handled above)
  // If session exists but role is null and still loading, indicator is shown.
  // If session exists but role is null and *not* loading (e.g., error), show WelcomeScreen.
  if (!loading && session && !userRole) {
     console.log("Session exists but role unknown/missing, showing WelcomeScreen");
     // Consider logging out here if profile is consistently missing after login
     // supabase.auth.signOut();
     return <WelcomeScreen />;
  }

  // Default case while loading or in intermediate states
  // This should ideally be covered by the loading check at the top,
  // but kept here as a fallback during initial checks.
  return (
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" />
       </View>
   );

  // This part is now handled by the logic above
  // return <WelcomeScreen />;
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