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

const SERVER_URL = 'http://192.168.65.136:5000';
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
    backgroundColor: '#eef3f9',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    backgroundColor: '#f2f4f7',
    borderRadius: 8,
  },
  uploadBtn: {
    backgroundColor: '#17a2b8',
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  templateBtn: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  templateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
