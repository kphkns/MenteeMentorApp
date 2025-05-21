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

const SERVER_URL = 'http://192.168.84.136:5000';

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
  const [courses, setCourses] = useState([]); // all courses
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
        setCourses(courseRes.data); // set all courses here
        setFaculties(facultyRes.data);
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch dropdown data');
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter courses based on selected department
  const filteredCourses = department
    ? courses.filter((c) => c.Dept_ID === department)
    : [];

  // Filter faculties based on selected department
  const filteredFaculties = department
    ? faculties.filter((f) => f.Dept_ID === department)
    : [];

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
      style={{ flex: 1, backgroundColor: '#f6f8fa' }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Title + Excel button row */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>🎓 Add Student</Text>
            <TouchableOpacity
              style={styles.excelButtonCompact}
              onPress={() => navigation.navigate('UploadExcelScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.excelButtonText}>By Excel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Fill student details carefully</Text>

          {/* Input fields */}
          <InputField label="Name" value={name} onChange={setName} placeholder="Enter full name" />
          <InputField label="Roll Number" value={rollNo} onChange={setRollNo} placeholder="Enter roll number" />
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />

          {/* Pickers */}
          <PickerField
            label="Batch"
            value={batch}
            onValueChange={setBatch}
            items={toPickerItems(batches, 'batch_name', 'Batch_id')}
            placeholder="Select Batch..."
          />
          <PickerField
            label="Department"
            value={department}
            onValueChange={(val) => {
              setDepartment(val);
              setCourse(null); // Reset course when department changes
              setFaculty(null); // Reset faculty when department changes
            }}
            items={toPickerItems(departments, 'Dept_name', 'Dept_id')}
            placeholder="Select Department..."
          />
          <PickerField
            label="Course"
            value={course}
            onValueChange={setCourse}
            items={toPickerItems(filteredCourses, 'Course_name', 'Course_ID')}
            placeholder="Select Course..."
          />
          <PickerField
            label="Faculty"
            value={faculty}
            onValueChange={setFaculty}
            items={toPickerItems(filteredFaculties, 'Name', 'Faculty_id')}
            placeholder="Select Faculty..."
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleAddStudent}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add Student</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('StudentListScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>View Student List ➔</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 40 }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputField = ({ label, value, onChange, placeholder, secureTextEntry = false, keyboardType = 'default' }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor="#a1a1aa"
      selectionColor="#007bff"
    />
  </View>
);

const PickerField = ({ label, value, onValueChange, items, placeholder }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.pickerWrapper}>
      <RNPickerSelect
        placeholder={{ label: placeholder, value: null, color: '#6c757d' }}
        value={value}
        onValueChange={onValueChange}
        items={items}
        style={pickerStyle}
        useNativeAndroidPickerStyle={false}
        Icon={() => (
          <View
            style={{
              backgroundColor: 'transparent',
              borderTopWidth: 8,
              borderTopColor: '#007bff',
              borderRightWidth: 8,
              borderRightColor: 'transparent',
              borderLeftWidth: 8,
              borderLeftColor: 'transparent',
              width: 0,
              height: 0,
              marginRight: 10,
              marginTop: 16,
            }}
          />
        )}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#007bff',
  },
  excelButtonCompact: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#b02a37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation:5,
},
excelButtonText: {
color: '#fff',
fontWeight: '600',
},
subtitle: {
fontSize: 14,
color: '#6c757d',
marginBottom: 20,
},
label: {
fontWeight: '600',
marginBottom: 6,
color: '#212529',
fontSize: 15,
},
input: {
borderWidth: 1,
borderColor: '#ced4da',
borderRadius: 12,
paddingVertical: 10,
paddingHorizontal: 14,
fontSize: 16,
color: '#212529',
},
pickerWrapper: {
borderWidth: 1,
borderColor: '#ced4da',
borderRadius: 12,
backgroundColor: '#fff',
},
button: {
marginTop: 12,
backgroundColor: '#007bff',
paddingVertical: 14,
borderRadius: 12,
alignItems: 'center',
shadowColor: '#007bff',
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 0.32,
shadowRadius: 8,
elevation: 12,
},
buttonDisabled: {
backgroundColor: '#6c757d',
},
buttonText: {
color: '#fff',
fontWeight: '800',
fontSize: 16,
},
secondaryButton: {
marginTop: 20,
paddingVertical: 12,
alignItems: 'center',
},
secondaryButtonText: {
fontWeight: '600',
fontSize: 16,
color: '#007bff',
},
});

const pickerStyle = {
inputIOS: {
fontSize: 16,
paddingVertical: 12,
paddingHorizontal: 10,
color: '#212529',
paddingRight: 30, // to ensure the text is not behind the icon
},
inputAndroid: {
fontSize: 16,
paddingHorizontal: 10,
paddingVertical: 8,
color: '#212529',
paddingRight: 30, // to ensure the text is not behind the icon
},
};
