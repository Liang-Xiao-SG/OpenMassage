import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title } from 'react-native-paper'; // Import Title
import ProviderList from '../../components/Service/ProviderList';

const HomeScreen: React.FC = () => { // Use React.FC for TypeScript
  return (
    <View style={styles.container}>
      {/* Optional: Add a screen title */}
      {/* <Title style={styles.title}>Home Dashboard</Title> */}
      <ProviderList />
    </View>
  );
};

// Add some basic styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16, // Add padding around the screen content
  },
  // Optional title styling
  // title: {
  //   marginBottom: 16,
  //   textAlign: 'center',
  // }
});

export default HomeScreen;