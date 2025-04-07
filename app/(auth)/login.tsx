import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link, useRouter } from 'expo-router'; // Import Link and useRouter
import supabase from '../../utils/supabaseClient'; // Adjust path

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook for navigation

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Login Error', error.message);
    } else {
      // On successful login, Supabase client handles session persistence.
      // Navigate to the main part of the app (e.g., home screen)
      // Replace '/' with your main app route if different
      router.replace('/');
      Alert.alert('Login Successful', 'Welcome back!');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Login</Text>
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
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading || !email || !password}
        style={styles.button}
      >
        Login
      </Button>

      <Link href="/signup" style={styles.link}>
         <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </Link>

      {/* TODO: Add Password Reset Link */}
      {/* <Link href="/forgot-password" style={styles.link}>
         <Text style={styles.linkText}>Forgot Password?</Text>
      </Link> */}
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
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    marginBottom: 20, // Add margin below button
  },
  link: {
    marginTop: 15,
    textAlign: 'center',
  },
  linkText: {
    color: '#6200ee', // Or use theme primary color
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;