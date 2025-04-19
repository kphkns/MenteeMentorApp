import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentProfile({ navigation }) {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken'); // 🔐 remove JWT token
      Alert.alert('Logged Out', 'You have been logged out.');
      navigation.replace('Login'); // 🚪 redirect to Login screen
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>👤 Student Profile</Text>

      {/* 👇 Logout Button */}
      <View style={styles.buttonWrapper}>
        <Button title="Logout" onPress={handleLogout} color="#dc3545" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonWrapper: {
    marginTop: 20,
    width: '80%',
  },
});
