import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import SignUpForm from '../components/User/SignUpForm'; // Adjust path relative to app directory

const SignUpScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* We could add a header or other elements here if needed */}
        <SignUpForm />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Or use theme background color
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center the form vertically
    paddingHorizontal: 20, // Add some horizontal padding
  },
});

export default SignUpScreen;