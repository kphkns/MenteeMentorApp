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
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const SERVER_URL = 'http://192.168.153.136:5000'; // Update with your backend IP

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
        Alert.alert('Success', 'Student added successfully');
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
      Alert.alert('Error', 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const toPickerItems = (arr, labelKey, valueKey) =>
    arr.map((item) => ({
      label: item[labelKey],
      value: item[valueKey],
    }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>Add Student</Text>

      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Roll No" value={rollNo} onChangeText={setRollNo} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          placeholder={{ label: 'Select Batch...', value: null }}
          value={batch}
          onValueChange={setBatch}
          items={toPickerItems(batches, 'batch_name', 'Batch_id')}
          style={pickerStyle}
        />
      </View>

      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          placeholder={{ label: 'Select Department...', value: null }}
          value={department}
          onValueChange={setDepartment}
          items={toPickerItems(departments, 'Dept_name', 'Dept_id')}
          style={pickerStyle}
        />
      </View>

      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          placeholder={{ label: 'Select Course...', value: null }}
          value={course}
          onValueChange={setCourse}
          items={toPickerItems(courses, 'Course_name', 'Course_ID')}
          style={pickerStyle}
        />
      </View>

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
        style={[styles.button, submitting && { opacity: 0.7 }]}
        onPress={handleAddStudent}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Adding...' : 'Add Student'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#28a745', marginTop: 10 }]}
        onPress={() => navigation.navigate('StudentListScreen')}
      >
        <Text style={styles.buttonText}>👀 View Student List</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#007bff' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

const pickerStyle = {
  inputIOS: { paddingVertical: 12, paddingHorizontal: 10, color: '#212529', fontSize: 16 },
  inputAndroid: { paddingVertical: 12, paddingHorizontal: 10, color: '#212529', fontSize: 16 },
};
