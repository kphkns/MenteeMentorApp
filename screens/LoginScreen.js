// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Student');
  const [loginMessage, setLoginMessage] = useState('');

  const handleLogin = async () => {
    try {
        const response = await fetch('http://192.168.225.136:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginMessage(data.message);
        Alert.alert("Login Success", data.message);
        navigation.navigate(userType); // Student, Faculty, or Admin

      } else {
        setLoginMessage(data.message || 'Login failed.');
        Alert.alert("Login Failed", data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginMessage('An error occurred. Please try again.');
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>

        {/* Text Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Login to continue using the Mentor Appointment System</Text>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* User Type Picker */}
          <Text style={styles.label}>Select User Type</Text>
          <View style={styles.pickerContainer}>
            {['Student', 'Faculty', 'Admin'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerItem, userType === type && styles.selected]}
                onPress={() => setUserType(type)}
              >
                <Text style={userType === type ? styles.selectedText : styles.unselectedText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* Login Message */}
          {loginMessage !== '' && <Text style={styles.loginMessage}>{loginMessage}</Text>}

          {/* Forgot password */}
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/cartoon.jpg')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    paddingVertical: 30,
  },
  container: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#f9fafb',
  },
  input: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: '#111',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerItem: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  selected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  unselectedText: {
    color: '#333',
  },
  loginBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginMessage: {
    color: 'green',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  forgot: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  backBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  backText: {
    color: '#007bff',
    fontSize: 14,
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
});
 