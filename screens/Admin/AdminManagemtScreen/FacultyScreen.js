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
import Icon from 'react-native-vector-icons/Ionicons';

const SERVER_URL = 'http://192.168.84.136:5000'; // Replace with your server IP

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

          {/* Name Input */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrapper}>
            <Icon name="person-outline" size={20} color="#6c757d" style={styles.icon} />
            <TextInput
              placeholder="Enter faculty name"
              value={facultyName}
              onChangeText={setFacultyName}
              style={styles.input}
            />
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color="#6c757d" style={styles.icon} />
            <TextInput
              placeholder="Enter email"
              value={facultyEmail}
              onChangeText={setFacultyEmail}
              style={styles.input}
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color="#6c757d" style={styles.icon} />
            <TextInput
              placeholder="Enter password"
              value={facultyPassword}
              onChangeText={setFacultyPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>

          {/* Department Picker */}
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
              useNativeAndroidPickerStyle={false}
              Icon={() => <Icon name="chevron-down-outline" size={20} color="#6c757d" />}
            />
          </View>
          {selectedDept && (
            <Text style={styles.selectedDeptText}>
              Selected: {departments.find(d => d.Dept_id === selectedDept)?.Dept_name}
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleAddFaculty}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add Faculty</Text>
            )}
          </TouchableOpacity>

          {/* Navigate to Faculty List */}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  picker: {
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  selectedDeptText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#495057',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
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
