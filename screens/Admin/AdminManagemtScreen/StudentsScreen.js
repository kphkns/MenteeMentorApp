import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const SERVER_URL = 'http://192.168.153.136:5000';

export default function AddStudentScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [batch, setBatch] = useState(null);
  const [department, setDepartment] = useState(null);
  const [course, setCourse] = useState(null);
  const [faculty, setFaculty] = useState(null);

  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${SERVER_URL}/admin/batches`),
      axios.get(`${SERVER_URL}/admin/departments`),
      axios.get(`${SERVER_URL}/admin/courses`),
      axios.get(`${SERVER_URL}/admin/faculty`),
    ])
      .then(([batchRes, deptRes, courseRes, facultyRes]) => {
        setBatches(batchRes.data);
        setDepartments(deptRes.data);
        setCourses(courseRes.data);
        setFaculties(facultyRes.data);
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch dropdown data');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddStudent = async () => {
    if (!name || !rollNo || !email || !password || !batch || !department || !course || !faculty) {
      Alert.alert('Missing Fields', 'Please fill all the fields');
      return;
    }

    const newStudent = {
      Name: name,
      Roll_no: rollNo,
      Email: email,
      Password: password,
      Batch: batch,
      Dept_ID: department,
      Course_ID: course,
      Faculty_id: faculty,
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`${SERVER_URL}/admin/students`, newStudent);
      if (res.status === 201) {
        Alert.alert('Success ✅', 'Student added successfully');
        setName('');
        setRollNo('');
        setEmail('');
        setPassword('');
        setBatch(null);
        setDepartment(null);
        setCourse(null);
        setFaculty(null);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error ❌', 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const toPickerItems = (arr, labelKey, valueKey) =>
    arr.map((item) => ({ label: item[labelKey], value: item[valueKey] }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      {/* Top Button Row */}
      <View style={styles.topButtonRow}>
        <TouchableOpacity
          style={styles.excelButton}
          onPress={() => navigation.navigate('UploadExcelScreen')}
        >
          <Text style={styles.excelButtonText}>Add by Excel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>🎓 Add Student</Text>
          <Text style={styles.subtitle}>Fill student details below carefully</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Roll Number</Text>
          <TextInput
            placeholder="Enter roll number"
            value={rollNo}
            onChangeText={setRollNo}
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <Text style={styles.label}>Batch</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              placeholder={{ label: 'Select Batch...', value: null }}
              value={batch}
              onValueChange={setBatch}
              items={toPickerItems(batches, 'batch_name', 'Batch_id')}
              style={pickerStyle}
            />
          </View>

          <Text style={styles.label}>Department</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              placeholder={{ label: 'Select Department...', value: null }}
              value={department}
              onValueChange={setDepartment}
              items={toPickerItems(departments, 'Dept_name', 'Dept_id')}
              style={pickerStyle}
            />
          </View>

          <Text style={styles.label}>Course</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              placeholder={{ label: 'Select Course...', value: null }}
              value={course}
              onValueChange={setCourse}
              items={toPickerItems(courses, 'Course_name', 'Course_ID')}
              style={pickerStyle}
            />
          </View>

          <Text style={styles.label}>Faculty</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              placeholder={{ label: 'Select Faculty...', value: null }}
              value={faculty}
              onValueChange={setFaculty}
              items={toPickerItems(faculties, 'Name', 'Faculty_id')}
              style={pickerStyle}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && { backgroundColor: '#6c757d' }]}
            onPress={handleAddStudent}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Add Student'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('StudentListScreen')}
          >
            <Text style={styles.secondaryButtonText}>View Student List ➔</Text>
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
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f0f4f7',
  },
  excelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  excelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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

const pickerStyle = {
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#212529',
    fontSize: 16,
  },
  inputAndroid: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#212529',
    fontSize: 16,
  },
};
