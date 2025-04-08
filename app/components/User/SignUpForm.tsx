import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import supabase from '../../../utils/supabaseClient'; // Adjusted path
import { Database } from '../../../types/database.types'; // Import Database types

type UserRole = Database['public']['Enums']['user_role'];

const SignUpForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client'); // Default to client
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!role) {
        Alert.alert('Role Required', 'Please select whether you are a Client or Practitioner.');
        return;
    }
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      // Supabase auth itself doesn't store custom table fields like 'role' or 'name' directly in auth.users
      // We need a separate step to insert into our public 'users' table.
    });

    if (authError) {
      Alert.alert('Sign Up Error', authError.message);
      setLoading(false); // Stop loading on auth error
      return; // Stop execution if auth fails
    }

    if (authData.user) {
      // Auth successful, now insert into public 'users' table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Use the ID from the authenticated user
          email: email,
          name: name,
          role: role,
        });

      if (insertError) {
        console.error("!!! Critical Error: Failed to insert user profile into public.users after auth signup. User ID:", authData.user.id, "Error:", insertError);
        // TODO: Consider a more robust handling strategy, like queuing the profile creation or deleting the auth user.
        // Deleting the auth user requires admin privileges and is usually done server-side.
        // await supabase.auth.admin.deleteUser(authData.user.id);
        Alert.alert('Profile Creation Error', `Your account was created for login, but saving your profile failed. Please contact support. Error: ${insertError.message}`);
      } else {
        console.log("Successfully inserted user profile into public.users for ID:", authData.user.id);
        Alert.alert('Sign Up Successful', 'Please check your email to confirm your account.');
        // TODO: Add navigation logic after successful sign up / confirmation
      }
    } else {
        Alert.alert('Sign Up Issue', 'An unexpected issue occurred during sign up.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        disabled={loading}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        mode="outlined"
        disabled={loading}
      />

      <Text style={styles.roleLabel}>I am a:</Text>
      <SegmentedButtons
        value={role}
        onValueChange={(value) => setRole(value as UserRole)}
        buttons={[
          { value: 'client', label: 'Client' },
          { value: 'practitioner', label: 'Practitioner' },
        ]}
        style={styles.segmentedButton}
        density="medium" // Adjust density as needed
      />

      <Button
        mode="contained"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading || !email || !password || !name || !role} // Also disable if role isn't selected
        style={styles.button}
      >
        Sign Up
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12, // Slightly reduced margin
  },
  roleLabel: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    // color: theme.colors.onSurfaceVariant, // Use theme colors if available
  },
  segmentedButton: {
    marginBottom: 15,
  },
  button: {
    marginTop: 15, // Increased margin
  },
});

export default SignUpForm;