import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Modal, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Pressable, Alert, BackHandler, RefreshControl
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.134.136:5000'; // your IP

export default function StudentListScreen() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    return () => backHandler.remove();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
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
          isSelected && styles.itemSelected,
          pressed && styles.itemPressed
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
            <Ionicons name="checkmark-circle" size={28} color="#007bff" />
          ) : (
            <TouchableOpacity onPress={() => openEditModal(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="edit" size={24} color="#007bff" style={{ marginLeft: 10 }} />
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
        <Text style={styles.title}>Students</Text>
        {selectedStudents.length > 0 ? (
          <TouchableOpacity style={styles.headerButton} onPress={handleMultipleDelete} accessibilityLabel={`Delete ${selectedStudents.length} students`}>
            <Ionicons name="trash-bin" size={30} color="#d9534f" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Add Student', 'Add student functionality')} accessibilityLabel="Add new student">
            <Ionicons name="add-circle-outline" size={34} color="#007bff" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search students by name, email, or roll no"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
        clearButtonMode="while-editing"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 40 }} />
      ) : filteredStudents.length === 0 ? (
        <Text style={styles.emptyText}>No students found</Text>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          extraData={selectedStudents}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007bff']}
            />
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              keyboardType="email-address"
              style={styles.input}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextInput
              value={editRoll}
              onChangeText={setEditRoll}
              placeholder="Roll No"
              style={styles.input}
              returnKeyType="next"
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Batch...', value: null }}
              value={editBatch}
              onValueChange={setEditBatch}
              items={batches.map((batch) => ({ label: batch.batch_name, value: batch.Batch_id }))}
              style={pickerStyle}
              useNativeAndroidPickerStyle={false}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Department...', value: null }}
              value={editDepartment}
              onValueChange={setEditDepartment}
              items={departments.map((dept) => ({ label: dept.Dept_name, value: dept.Dept_id }))}
              style={pickerStyle}
              useNativeAndroidPickerStyle={false}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Course...', value: null }}
              value={editCourse}
              onValueChange={setEditCourse}
              items={courses.map((course) => ({ label: course.Course_name, value: course.Course_ID }))}
              style={pickerStyle}
              useNativeAndroidPickerStyle={false}
            />

            <RNPickerSelect
              placeholder={{ label: 'Select Faculty...', value: null }}
              value={editFaculty}
              onValueChange={setEditFaculty}
              items={faculties.map((faculty) => ({ label: faculty.Name, value: faculty.Faculty_id }))}
              style={pickerStyle}
              useNativeAndroidPickerStyle={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={saveStudentChanges} activeOpacity={0.8}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.8}>
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
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    color: '#333',
    paddingRight: 30,
    marginVertical: 8,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    color: '#333',
    paddingRight: 30,
    marginVertical: 8,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  headerButton: {
    padding: 6,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemSelected: {
    backgroundColor: '#e0f0ff',
  },
  itemPressed: {
    opacity: 0.7,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 22,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  itemSubInfo: {
    color: '#555',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 18,
    color: '#888',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 18,
    color: '#1c1c1e',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  saveBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginLeft: 14,
  },
  saveText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  cancelText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 16,
  },
});
