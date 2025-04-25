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
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.153.136:5000'; // Replace with your server IP

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.card}>
        <Text style={styles.header}>📚 Faculty Management</Text>
        <Text style={styles.subheader}>Add, edit, and manage faculty members</Text>

        <TextInput
          placeholder="Faculty Name"
          value={facultyName}
          onChangeText={setFacultyName}
          style={styles.input}
        />

        <TextInput
          placeholder="Faculty Email"
          value={facultyEmail}
          onChangeText={setFacultyEmail}
          style={styles.input}
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Faculty Password"
          value={facultyPassword}
          onChangeText={setFacultyPassword}
          style={styles.input}
          secureTextEntry
        />

        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setSelectedDept}
            items={departmentOptions}
            placeholder={{ label: 'Select Department...', value: null }}
            style={{
              inputIOS: styles.picker,
              inputAndroid: styles.picker,
              placeholder: { color: '#999' },
            }}
            value={selectedDept}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleAddFaculty}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Adding...' : 'Add Faculty'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => navigation.navigate('FacultyListScreen')}
        >
          <Text style={styles.buttonText}>View Faculty List</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f3ff',
    padding: 16,
  },
  card: {
    backgroundColor: '#e6f3ff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 15,
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
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
