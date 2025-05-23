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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SERVER_URL = 'http://192.168.84.136:5000';

export default function AddStudentScreen() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    batch: null,
    department: null,
    course: null,
    faculty: null
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, deptRes, courseRes, facultyRes] = await Promise.all([
          axios.get(`${SERVER_URL}/admin/batches`),
          axios.get(`${SERVER_URL}/admin/departments`),
          axios.get(`${SERVER_URL}/admin/courses`),
          axios.get(`${SERVER_URL}/admin/faculty`)
        ]);

        setBatches(batchRes.data);
        setDepartments(deptRes.data);
        setCourses(courseRes.data);
        setFaculties(facultyRes.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch dropdown data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = formData.department
    ? courses.filter(c => c.Dept_ID === formData.department)
    : [];

  const filteredFaculties = formData.department
    ? faculties.filter(f => f.Dept_ID === formData.department)
    : [];

  const handleChange = (field, value) => {
    setFormData(prev => {
      // Reset dependent fields when department changes
      if (field === 'department') {
        return { ...prev, [field]: value, course: null, faculty: null };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async () => {
    const { name, rollNo, email, password, batch, department, course, faculty } = formData;
    
    if (!name || !rollNo || !email || !password || !batch || !department || !course || !faculty) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
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
        setFormData({
          name: '',
          rollNo: '',
          email: '',
          password: '',
          batch: null,
          department: null,
          course: null,
          faculty: null
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const toPickerItems = (arr, labelKey, valueKey) =>
    arr.map(item => ({ label: item[labelKey], value: item[valueKey] }));

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
          <Text style={styles.headerTitle}>Add Student</Text>
        </LinearGradient>
        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.formHeader}>
            <MaterialIcons name="person-add" size={32} color="#6366f1" />
            <Text style={styles.formTitle}>Student Registration</Text>
            <Text style={styles.formSubtitle}>Enter all required details</Text>
          </View>

          {/* Personal Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InputField
              icon="person-outline"
              label="Full Name"
              value={formData.name}
              onChange={(val) => handleChange('name', val)}
              placeholder="John Doe"
            />
            <InputField
              icon="id-card-outline"
              label="Roll Number"
              value={formData.rollNo}
              onChange={(val) => handleChange('rollNo', val)}
              placeholder="2023CS101"
            />
            <InputField
              icon="mail-outline"
              label="Email Address"
              value={formData.email}
              onChange={(val) => handleChange('email', val)}
              placeholder="john.doe@university.edu"
              keyboardType="email-address"
            />
            <InputField
              icon="lock-closed-outline"
              label="Password"
              value={formData.password}
              onChange={(val) => handleChange('password', val)}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#94a3b8" 
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Academic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>
            <PickerField
              icon="calendar-outline"
              label="Batch"
              value={formData.batch}
              onValueChange={(val) => handleChange('batch', val)}
              items={toPickerItems(batches, 'batch_name', 'Batch_id')}
              placeholder="Select batch..."
            />
            <PickerField
              icon="business-outline"
              label="Department"
              value={formData.department}
              onValueChange={(val) => handleChange('department', val)}
              items={toPickerItems(departments, 'Dept_name', 'Dept_id')}
              placeholder="Select department..."
            />
            <PickerField
              icon="school-outline"
              label="Course"
              value={formData.course}
              onValueChange={(val) => handleChange('course', val)}
              items={toPickerItems(filteredCourses, 'Course_name', 'Course_ID')}
              placeholder="Select course..."
              disabled={!formData.department}
            />
            <PickerField
              icon="people-outline"
              label="Faculty Mentor"
              value={formData.faculty}
              onValueChange={(val) => handleChange('faculty', val)}
              items={toPickerItems(filteredFaculties, 'Name', 'Faculty_id')}
              placeholder="Select faculty..."
              disabled={!formData.department}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Register Student</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity
              style={styles.excelButton}
              onPress={() => navigation.navigate('UploadExcelScreen')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="upload-file" size={20} color="#fff" />
              <Text style={styles.excelButtonText}>Upload Excel File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewListButton}
              onPress={() => navigation.navigate('StudentListScreen')}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={20} color="#6366f1" />
              <Text style={styles.viewListButtonText}>View Student List</Text>
              <Ionicons name="chevron-forward" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputField = ({ icon, label, value, onChange, placeholder, keyboardType, secureTextEntry, rightIcon }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#94a3b8" style={styles.inputIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChange}
        style={styles.input}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
      {rightIcon}
    </View>
  </View>
);

// UPDATED PickerField with improved dropdown and click handling
const PickerField = ({ icon, label, value, onValueChange, items, placeholder, disabled }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.pickerWrapper, disabled && styles.disabledPicker]}>
      <Ionicons name={icon} size={20} color="#94a3b8" style={styles.pickerIcon} />
      <View style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
        <RNPickerSelect
          placeholder={{ label: placeholder, value: null, color: '#94a3b8' }}
          value={value}
          onValueChange={onValueChange}
          items={items}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
          disabled={disabled}
          Icon={() => (
            <Ionicons name="chevron-down" size={20} color="#94a3b8" style={styles.pickerDropdownIcon} />
          )}
        />
      </View>
    </View>
  </View>
);

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  inputIcon: {
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingRight: 16,
    minHeight: 48, // Ensures enough height for touch
  },
  disabledPicker: {
    opacity: 0.6,
  },
  pickerIcon: {
    marginLeft: 16,
    marginRight: 12,
    zIndex: 2,
  },
  pickerDropdownIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 2,
  },
  actionsContainer: {
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
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
  excelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  excelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
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

const pickerStyles = {
  inputIOS: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#1e293b',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  inputAndroid: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#1e293b',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  placeholder: {
    color: '#94a3b8',
  },
};
