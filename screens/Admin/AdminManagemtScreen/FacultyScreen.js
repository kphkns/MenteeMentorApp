import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.65.136:5000'; // Replace with your server IP

export default function FacultyScreen({ navigation }) {
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${SERVER_URL}/admin/departments`)
      .then((res) => {
        setDepartments(res.data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to fetch departments');
        setLoading(false);
      });
  }, []);

  const handleAddFaculty = async () => {
    if (!facultyName.trim() || !facultyEmail.trim() || !facultyPassword.trim() || !selectedDept) {
      Alert.alert('Missing Fields', 'Please fill all fields before submitting.');
      return;
    }

    const newFaculty = {
      Name: facultyName.trim(),
      Email: facultyEmail.trim(),
      Password: facultyPassword.trim(),
      Dept_ID: selectedDept,
    };

    setSubmitting(true);
    try {
      const response = await axios.post(`${SERVER_URL}/admin/faculty`, newFaculty);
      if (response.status === 201) {
        Alert.alert('Success ✅', 'Faculty added successfully.');
        setFacultyName('');
        setFacultyEmail('');
        setFacultyPassword('');
        setSelectedDept(null);
      }
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message;
        if (message === 'Email already exists') {
          Alert.alert('Duplicate Email ⚠️', 'This email is already registered.');
        } else if (message === 'Invalid email format') {
          Alert.alert('Invalid Email ❌', 'Please enter a valid email address.');
        } else {
          Alert.alert('Error', message || 'Something went wrong. Please try again.');
        }
      } else {
        Alert.alert('Network Error 🌐', 'Could not connect to server.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const departmentOptions = departments.map((dept) => ({
    label: dept.Dept_name,
    value: dept.Dept_id,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>👨‍🏫 Add Faculty</Text>
          <Text style={styles.subtitle}>Fill the details below carefully</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Enter faculty name"
            value={facultyName}
            onChangeText={setFacultyName}
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter email"
            value={facultyEmail}
            onChangeText={setFacultyEmail}
            style={styles.input}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter password"
            value={facultyPassword}
            onChangeText={setFacultyPassword}
            style={styles.input}
            secureTextEntry
          />

          <Text style={styles.label}>Department</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setSelectedDept}
              items={departmentOptions}
              placeholder={{ label: 'Select Department...', value: null }}
              style={{
                inputIOS: styles.picker,
                inputAndroid: styles.picker,
                placeholder: { color: '#6c757d' },
              }}
              value={selectedDept}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && { backgroundColor: '#6c757d' }]}
            onPress={handleAddFaculty}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Add Faculty'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('FacultyListScreen')}
          >
            <Text style={styles.secondaryButtonText}>View Faculty List ➔</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 15,
    marginTop: 4,
  },
  picker: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#212529',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 17,
  },
  secondaryButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
});
