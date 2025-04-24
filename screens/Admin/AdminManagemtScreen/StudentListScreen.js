import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, Modal, TextInput, TouchableOpacity
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.225.136:5000';

export default function StudentListScreen() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editFaculty, setEditFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((s) =>
        s.Name.toLowerCase().includes(search.toLowerCase()) ||
        s.Email.toLowerCase().includes(search.toLowerCase()) ||
        s.Roll_no.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [search, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/students`);
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [batchRes, deptRes, courseRes, facultyRes] = await Promise.all([
        axios.get(`${SERVER_URL}/admin/batches`),
        axios.get(`${SERVER_URL}/admin/departments`),
        axios.get(`${SERVER_URL}/admin/courses`),
        axios.get(`${SERVER_URL}/admin/faculty`),
      ]);
      setBatches(batchRes.data);
      setDepartments(deptRes.data);
      setCourses(courseRes.data);
      setFaculties(facultyRes.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch dropdown data');
    }
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setEditName(student.Name);
    setEditEmail(student.Email);
    setEditRoll(student.Roll_no);
    setEditBatch(student.Batch || '');
    setEditDepartment(student.Dept_ID || '');
    setEditCourse(student.Course_ID || '');
    setEditFaculty(student.Faculty_id || '');
    setModalVisible(true);
  };

  const saveStudentChanges = async () => {
    try {
      await axios.put(`${SERVER_URL}/admin/students/${editStudent.Student_id}`, {
        Name: editName,
        Email: editEmail,
        Roll_no: editRoll,
        Batch: editBatch,
        Dept_ID: editDepartment,
        Course_ID: editCourse,
        Faculty_id: editFaculty,
        Password: editStudent.Password,
      });
      setModalVisible(false);
      fetchStudents();  // Refresh students list after updating
    } catch (err) {
      Alert.alert('Error', 'Failed to update student');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/admin/students/${id}`);
            fetchStudents();
          } catch {
            Alert.alert('Error', 'Failed to delete student');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.Name}</Text>
          <Text style={styles.info}>🎓 Roll No: {item.Roll_no}</Text>
          <Text style={styles.info}>📧 {item.Email}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <FontAwesome name="edit" size={20} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.Student_id)} style={{ marginLeft: 15 }}>
            <Ionicons name="trash-outline" size={22} color="#d9534f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student List</Text>

      <TextInput
        placeholder="Search by name, email, or roll no"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <TextInput value={editName} onChangeText={setEditName} placeholder="Name" style={styles.input} />
            <TextInput value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" style={styles.input} />
            <TextInput value={editRoll} onChangeText={setEditRoll} placeholder="Roll No" style={styles.input} />

            <RNPickerSelect
              placeholder={{ label: 'Select Batch...', value: null }}
              value={editBatch}
              onValueChange={setEditBatch}
              items={batches.map((batch) => ({
                label: batch.batch_name,
                value: batch.Batch_id,
              }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Department...', value: null }}
              value={editDepartment}
              onValueChange={setEditDepartment}
              items={departments.map((dept) => ({
                label: dept.Dept_name,
                value: dept.Dept_id,
              }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Course...', value: null }}
              value={editCourse}
              onValueChange={setEditCourse}
              items={courses.map((course) => ({
                label: course.Course_name,
                value: course.Course_ID,
              }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Faculty...', value: null }}
              value={editFaculty}
              onValueChange={setEditFaculty}
              items={faculties.map((faculty) => ({
                label: faculty.Name,
                value: faculty.Faculty_id,
              }))}
              style={pickerStyle}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={saveStudentChanges}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pickerStyle = {
  inputIOS: {
    backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
  inputAndroid: {
    backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fb', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#fff', padding: 10, borderRadius: 10, borderColor: '#ccc',
    borderWidth: 1, marginBottom: 12
  },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
    marginBottom: 12, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  info: { fontSize: 14, color: '#555', marginTop: 2 },
  actions: { flexDirection: 'row' },
  modalBackground: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  modalCard: {
    width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#007bff', marginBottom: 15
  },
  input: {
    backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8,
    borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10
  },
  saveBtn: {
    backgroundColor: '#007bff', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center', marginRight: 8
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center'
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#666', fontWeight: '600' },
});
