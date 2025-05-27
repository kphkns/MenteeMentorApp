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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SERVER_URL = 'http://192.168.216.136:5000';

export default function FacultyScreen({ navigation }) {
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        Alert.alert('Success', 'Faculty added successfully');
        setFacultyName('');
        setFacultyEmail('');
        setFacultyPassword('');
        setSelectedDept(null);
      }
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message;
        if (message === 'Email already exists') {
          Alert.alert('Duplicate Email', 'This email is already registered');
        } else if (message === 'Invalid email format') {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
        } else {
          Alert.alert('Error', message || 'Something went wrong');
        }
      } else {
        Alert.alert('Network Error', 'Could not connect to server');
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#818cf8']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Add Faculty</Text>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.formHeader}>
            <MaterialIcons name="person-add-alt-1" size={32} color="#6366f1" />
            <Text style={styles.formTitle}>Faculty Registration</Text>
            <Text style={styles.formSubtitle}>Enter the faculty details below</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#94a3b8"
                value={facultyName}
                onChangeText={setFacultyName}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput
                placeholder="john.doe@university.edu"
                placeholderTextColor="#94a3b8"
                value={facultyEmail}
                onChangeText={setFacultyEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#94a3b8"
                value={facultyPassword}
                onChangeText={setFacultyPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Department Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                onValueChange={setSelectedDept}
                items={departmentOptions}
                placeholder={{ label: 'Select department...', value: null }}
                style={{
                  inputIOS: styles.picker,
                  inputAndroid: styles.picker,
                  placeholder: { color: '#94a3b8' },
                }}
                value={selectedDept}
                useNativeAndroidPickerStyle={false}
                Icon={() => <Ionicons name="chevron-down" size={20} color="#94a3b8" />}
              />
            </View>
            {selectedDept && (
              <Text style={styles.selectedDeptText}>
                Selected: {departments.find(d => d.Dept_id === selectedDept)?.Dept_name}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleAddFaculty}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Register Faculty</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* View Faculty List Button */}
          <TouchableOpacity
            style={styles.viewListButton}
            onPress={() => navigation.navigate('FacultyListScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={20} color="#6366f1" />
            <Text style={styles.viewListButtonText}>View Faculty List</Text>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading departments...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#1e293b',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#1e293b',
    paddingRight: 30,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingVertical: 0,
  },
  pickerWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  picker: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingVertical: 0,
  },
  selectedDeptText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 12,
  },
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewListButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});