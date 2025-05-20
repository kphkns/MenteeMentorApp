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

const SERVER_URL = 'http://192.168.134.136:5000';
const TEMPLATE_URL = `${SERVER_URL}/templates/student_upload_format.xlsx`;

export default function ExcelUploadScreen() {
  const [batchList, setBatchList] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [courseList, setCourseList] = useState([]);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📋 Upload Student Excel Sheet</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Batch</Text>
        <Picker
          selectedValue={selectedBatch}
          onValueChange={setSelectedBatch}
          style={styles.picker}
        >
          <Picker.Item label="Select Batch..." value="" />
          {batchList.map(batch => (
            <Picker.Item key={batch.Batch_id} label={batch.batch_name} value={batch.Batch_id} />
          ))}
        </Picker>

        <Text style={styles.label}>Department</Text>
        <Picker
          selectedValue={selectedDept}
          onValueChange={setSelectedDept}
          style={styles.picker}
        >
          <Picker.Item label="Select Department..." value="" />
          {deptList.map(dept => (
            <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
          ))}
        </Picker>

        <Text style={styles.label}>Course</Text>
        <Picker
          selectedValue={selectedCourse}
          onValueChange={setSelectedCourse}
          style={styles.picker}
        >
          <Picker.Item label="Select Course..." value="" />
          {courseList.map(course => (
            <Picker.Item key={course.Course_ID} label={course.Course_name} value={course.Course_ID} />
          ))}
        </Picker>

        <TouchableOpacity onPress={pickFile} style={styles.uploadBtn}>
          <Text style={styles.uploadText}>
            {selectedFile ? `📄 ${selectedFile.name}` : '📤 Choose Excel File'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
          <Text style={styles.submitText}>
            {loading ? 'Submitting...' : '🚀 Submit'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={downloadTemplate} style={styles.templateBtn}>
          <Text style={styles.templateText}>📥 Download Excel Template</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 15 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9f0f8',
    padding: 24,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 30,
    color: '#1a202c',
    textAlign: 'center',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    color: '#2d3748',
  },
  picker: {
    backgroundColor: '#f0f4f8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#1a202c',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    // Android specific padding fix for picker
    height: 50,
  },
  uploadBtn: {
    backgroundColor: '#38b2ac',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 36,
    alignItems: 'center',
    shadowColor: '#38b2ac',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
  },
  uploadText: {
    color: '#e6fffa',
    fontSize: 19,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 26,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.55,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 7 },
  },
  submitText: {
    color: '#eef2ff',
    fontSize: 19,
    fontWeight: '700',
  },
  templateBtn: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.48,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  templateText: {
    color: '#d1fae5',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.6,
  },
});
