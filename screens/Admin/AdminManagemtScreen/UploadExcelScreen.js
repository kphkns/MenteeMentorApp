import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.158.136:5000';
const TEMPLATE_URL = `${SERVER_URL}/templates/student_upload_format.xlsx`;

export default function ExcelUploadScreen() {
  const [batchList, setBatchList] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [batches, depts, courses] = await Promise.all([
        fetch(`${SERVER_URL}/admin/batches`).then(res => res.json()),
        fetch(`${SERVER_URL}/admin/departments`).then(res => res.json()),
        fetch(`${SERVER_URL}/admin/courses`).then(res => res.json()),
      ]);
      setBatchList(batches);
      setDeptList(depts);
      setCourseList(courses);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dropdown data');
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const fileExtension = result.assets[0].uri.split('.').pop().toLowerCase();
        if (fileExtension !== 'xlsx') {
          Alert.alert('Error', 'Please select a valid Excel (.xlsx) file');
          return;
        }
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSubmit = async () => {
    if (!selectedBatch || !selectedDept || !selectedCourse || !selectedFile) {
      Alert.alert('Error', 'Please select all fields and a file');
      return;
    }

    try {
      setLoading(true);
      const fileUri = selectedFile.uri;
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(fileData, { type: 'base64' });
      const wsname = workbook.SheetNames[0];
      const sheet = workbook.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (!jsonData.every(row => row.Name && row.Roll_no && row.Email)) {
        Alert.alert('Error', 'Excel file must contain Name, Roll_no, and Email columns');
        return;
      }

      const students = jsonData.map(row => ({
        Name: row.Name,
        Roll_no: row.Roll_no,
        Email: row.Email,
        password: row.Password || '',
        Batch: selectedBatch,
        Dept_ID: selectedDept,
        Course_ID: selectedCourse,
      }));

      Alert.alert(
        'Confirm Upload',
        `Are you sure you want to upload ${students.length} student records?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upload',
            onPress: async () => {
              try {
                const response = await fetch(`${SERVER_URL}/admin/students/bulk-insert`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ students }),
                });
                const resultData = await response.json();
                Alert.alert('Upload Complete', resultData.message || 'Students added!');
                setSelectedFile(null);
              } catch (error) {
                Alert.alert('Error', 'Upload failed. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process Excel file');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    Linking.openURL(TEMPLATE_URL);
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSelectedCourse('');
    const filtered = courseList.filter(course => course.Dept_ID === deptId);
    setFilteredCourses(filtered);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Student Data</Text>
        <Text style={styles.subtitle}>Select batch details and upload your Excel sheet</Text>
      </View>

      <View style={styles.card}>
        {/* Batch Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Batch</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBatch}
              onValueChange={setSelectedBatch}
              style={styles.picker}
              dropdownIconColor="#6b7280"
            >
              <Picker.Item label="Select Batch..." value="" />
              {batchList.map(batch => (
                <Picker.Item key={batch.Batch_id} label={batch.batch_name} value={batch.Batch_id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Department Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Department</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDept}
              onValueChange={handleDeptChange}
              style={styles.picker}
              dropdownIconColor="#6b7280"
            >
              <Picker.Item label="Select Department..." value="" />
              {deptList.map(dept => (
                <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Course Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Course</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCourse}
              onValueChange={setSelectedCourse}
              style={styles.picker}
              enabled={filteredCourses.length > 0}
              dropdownIconColor="#6b7280"
            >
              <Picker.Item label="Select Course..." value="" />
              {filteredCourses.map(course => (
                <Picker.Item
                  key={course.Course_ID}
                  label={course.Course_name}
                  value={course.Course_ID}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* File Upload Section */}
        <TouchableOpacity onPress={pickFile} style={styles.uploadBtn}>
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : 'Choose Excel File'}
          </Text>
          {selectedFile && (
            <MaterialIcons name="check-circle" size={20} color="#4ade80" style={styles.fileCheck} />
          )}
        </TouchableOpacity>

        <Text style={styles.fileNote}>Only .xlsx files are supported</Text>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.submitBtn, (!selectedBatch || !selectedDept || !selectedCourse || !selectedFile) && styles.disabledBtn]}
          disabled={!selectedBatch || !selectedDept || !selectedCourse || !selectedFile}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Submit Data</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Template Download */}
        <TouchableOpacity onPress={downloadTemplate} style={styles.templateBtn}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.templateText}>Download Template</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f2f6ff',
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  picker: {
    height: 50,
    color: '#1e293b',
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  fileCheck: {
    marginLeft: 'auto',
  },
  fileNote: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  templateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
