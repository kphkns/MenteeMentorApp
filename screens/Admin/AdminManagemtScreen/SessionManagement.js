import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Modal, TextInput,
  TouchableOpacity, Alert, ScrollView
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const SERVER_URL = 'http://192.168.65.136:5000';

const SessionManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  useEffect(() => {
    fetchFilters();
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, selectedBatch, selectedDept, selectedCourse]);

  const fetchFilters = async () => {
    try {
      const deptRes = await axios.get(`${SERVER_URL}/departments`);
      const batchRes = await axios.get(`${SERVER_URL}/batches`);
      const courseRes = await axios.get(`${SERVER_URL}/courses`);
      setDepartments(deptRes.data);
      setBatches(batchRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      console.error('Error fetching filters:', err);
      Alert.alert('Error', 'Failed to load filters');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/students`);
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const filterStudents = () => {
    const filtered = students.filter((student) =>
      (searchQuery === '' || student.Name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedBatch === '' || student.Batch_ID === selectedBatch) &&
      (selectedDept === '' || student.Dept_ID === selectedDept) &&
      (selectedCourse === '' || student.Course_ID === selectedCourse)
    );
    setFilteredStudents(filtered);
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setSelectedStatus(student.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      await axios.put(`${SERVER_URL}/students/${editStudent.Student_ID}`, {
        status: selectedStatus,
      });
      fetchStudents();
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert('Error', 'Failed to update student');
    }
  };

  const handleSelectAll = async (statusValue) => {
    try {
      await Promise.all(
        filteredStudents.map((student) =>
          axios.put(`${SERVER_URL}/students/${student.Student_ID}`, {
            status: statusValue,
          })
        )
      );
      fetchStudents();
    } catch (error) {
      console.error('Error updating all students:', error);
      Alert.alert('Error', 'Failed to update all students');
    }
  };

  const renderStudent = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardText}>Name: {item.Name}</Text>
        <Text style={styles.cardText}>Roll No: {item.Roll_No}</Text>
        <Text style={styles.cardText}>
          Status: <Text style={{ fontWeight: 'bold', color: item.status === 1 ? '#4CAF50' : '#F44336' }}>
            {item.status === 1 ? 'Active' : 'Inactive'}
          </Text>
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
        <Icon name="edit" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.heading}>Session Management</Text>

      <View style={styles.filterSection}>
        <RNPickerSelect
          onValueChange={(value) => setSelectedBatch(value)}
          value={selectedBatch}
          placeholder={{ label: 'All Batches', value: '' }}
          items={batches.map((b) => ({ label: b.Batch_Name, value: b.Batch_ID }))}
          style={pickerSelectStyles}
        />

        <RNPickerSelect
          onValueChange={(value) => setSelectedDept(value)}
          value={selectedDept}
          placeholder={{ label: 'All Departments', value: '' }}
          items={departments.map((d) => ({ label: d.Dept_Name, value: d.Dept_ID }))}
          style={pickerSelectStyles}
        />

        <RNPickerSelect
          onValueChange={(value) => setSelectedCourse(value)}
          value={selectedCourse}
          placeholder={{ label: 'All Courses', value: '' }}
          items={courses.map((c) => ({ label: c.Course_Name, value: c.Course_ID }))}
          style={pickerSelectStyles}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.selectAllContainer}>
        <TouchableOpacity
          style={[styles.selectAllButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleSelectAll(1)}
        >
          <Text style={styles.selectAllText}>Set All Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectAllButton, { backgroundColor: '#F44336' }]}
          onPress={() => handleSelectAll(0)}
        >
          <Text style={styles.selectAllText}>Set All Inactive</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.Student_ID.toString()}
        renderItem={renderStudent}
        scrollEnabled={false}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Student Status</Text>
            <RNPickerSelect
              onValueChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
              items={[
                { label: 'Inactive', value: 0 },
                { label: 'Active', value: 1 },
              ]}
              style={pickerSelectStyles}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f4f6f8',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#222',
  },
  filterSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectAllButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
  },
  selectAllText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    width: '45%',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 14,
    color: '#333',
  },
  inputAndroid: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 14,
    color: '#333',
  },
};

export default SessionManagement;
