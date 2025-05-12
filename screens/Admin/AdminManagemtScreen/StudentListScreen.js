import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Modal, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Pressable, Alert, BackHandler
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.65.136:5000'; // your IP

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
  const [selectedStudents, setSelectedStudents] = useState([]); // multi select

  useEffect(() => {
    fetchStudents();
    fetchDropdownData();

    const backAction = () => {
      if (selectedStudents.length > 0) {
        setSelectedStudents([]);
        return true; // block going back
      }
      return false; // allow normal back
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove(); // cleanup
  }, [selectedStudents]);

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
      fetchStudents();
    } catch (err) {
      Alert.alert('Error', 'Failed to update student');
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Student', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Delete', style: 'destructive', onPress: async () => {
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

  const handleMultipleDelete = () => {
    Alert.alert('Delete Students', `Are you sure you want to delete ${selectedStudents.length} students?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Delete', style: 'destructive', onPress: async () => {
          try {
            await Promise.all(selectedStudents.map(id => axios.delete(`${SERVER_URL}/admin/students/${id}`)));
            setSelectedStudents([]);
            fetchStudents();
          } catch {
            Alert.alert('Error', 'Failed to delete students');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sid) => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const onLongPressItem = (id) => {
    toggleSelect(id);
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedStudents.includes(item.Student_id);
    return (
      <Pressable
        onPress={() => {
          if (selectedStudents.length > 0) {
            toggleSelect(item.Student_id);
          }
        }}
        onLongPress={() => onLongPressItem(item.Student_id)}
        style={({ pressed }) => [
          styles.itemContainer,
          isSelected && { backgroundColor: '#cce5ff' },
          pressed && { opacity: 0.9 }
        ]}
      >
        <View style={styles.itemContent}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.Name?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.Name}</Text>
            <Text style={styles.itemSubInfo}>{item.Roll_no} | {item.Email}</Text>
          </View>

          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#007bff" />
          ) : (
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Feather name="edit" size={22} color="#007bff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
        {selectedStudents.length > 0 ? (
          <TouchableOpacity style={styles.headerButton} onPress={handleMultipleDelete}>
            <Ionicons name="trash-bin" size={28} color="#d9534f" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Add Student', 'Add student functionality')}>
            <Ionicons name="add-circle-outline" size={32} color="#007bff" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search for students"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : filteredStudents.length === 0 ? (
        <Text style={styles.emptyText}>No students found</Text>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          extraData={selectedStudents}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <TextInput value={editName} onChangeText={setEditName} placeholder="Name" style={styles.input} />
            <TextInput value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" style={styles.input} />
            <TextInput value={editRoll} onChangeText={setEditRoll} placeholder="Roll No" style={styles.input} />

            <RNPickerSelect
              placeholder={{ label: 'Select Batch...', value: null }}
              value={editBatch}
              onValueChange={setEditBatch}
              items={batches.map((batch) => ({ label: batch.batch_name, value: batch.Batch_id }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Department...', value: null }}
              value={editDepartment}
              onValueChange={setEditDepartment}
              items={departments.map((dept) => ({ label: dept.Dept_name, value: dept.Dept_id }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Course...', value: null }}
              value={editCourse}
              onValueChange={setEditCourse}
              items={courses.map((course) => ({ label: course.Course_name, value: course.Course_ID }))}
              style={pickerStyle}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Faculty...', value: null }}
              value={editFaculty}
              onValueChange={setEditFaculty}
              items={faculties.map((faculty) => ({ label: faculty.Name, value: faculty.Faculty_id }))}
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const pickerStyle = {
  inputIOS: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 },
  inputAndroid: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fb', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerButton: { padding: 6 },

  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },

  itemContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  itemContent: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 18, fontWeight: '600', color: '#333' },
  itemSubInfo: { fontSize: 14, color: '#666', marginTop: 2 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 },

  modalButtons: { flexDirection: 'row', marginTop: 10 },
  saveBtn: { flex: 1, backgroundColor: '#28a745', padding: 12, marginRight: 8, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: '#dc3545', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
});
