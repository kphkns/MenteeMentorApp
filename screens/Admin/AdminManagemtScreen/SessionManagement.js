import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Button,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.134.136:5000';

const CustomCheckbox = ({ checked, onToggle }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={[styles.checkboxBase, checked && styles.checkboxChecked]}
  >
    {checked && <Text style={styles.checkboxTick}>✓</Text>}
  </TouchableOpacity>
);

export default function StudentBasicListScreen() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchDropdowns();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchCoursesByDepartment(selectedDept);
    } else {
      setCourses([]);
      setSelectedCourse(null);
    }
  }, [selectedDept]);

  useEffect(() => {
    setSearch('');
    fetchStudents();
  }, [selectedBatch, selectedDept, selectedCourse]);

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

  const fetchDropdowns = async () => {
    try {
      const [batchRes, deptRes] = await Promise.all([
        axios.get(`${SERVER_URL}/admin/batchess`),
        axios.get(`${SERVER_URL}/admin/departmentss`),
      ]);
      setBatches(batchRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dropdown data');
    }
  };

  const fetchCoursesByDepartment = async (deptId) => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/coursess`, {
        params: { dept: deptId },
      });
      setCourses(res.data);
      setSelectedCourse(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to load courses');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedDept) params.dept = selectedDept;
      if (selectedCourse) params.course = selectedCourse;

      const res = await axios.get(`${SERVER_URL}/admin/studentss`, { params });
      setStudents(res.data);
      setFilteredStudents(res.data);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.Student_id));
    }
    setSelectAll(!selectAll);
  };

  const updateStatus = async (newStatus) => {
    if (selectedIds.length === 0) {
      Alert.alert('No Selection', 'Please select at least one student.');
      return;
    }

    try {
      await axios.put(`${SERVER_URL}/admin/students/statuss`, {
        studentIds: selectedIds,
        status: newStatus,
      });
      Alert.alert('Success', 'Status updated successfully.');
      fetchStudents();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.checkboxRow}>
        <CustomCheckbox
          checked={selectedIds.includes(item.Student_id)}
          onToggle={() => toggleSelect(item.Student_id)}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.Name}</Text>
          <Text style={styles.subText}>Roll No: {item.Roll_no}</Text>
          <Text style={styles.subText}>Email: {item.Email}</Text>
          <Text style={styles.status}>{item.status === 1 ? '🟢 Active' : '🔴 Inactive'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <RNPickerSelect
          onValueChange={setSelectedBatch}
          value={selectedBatch}
          placeholder={{ label: 'Select Batch', value: null }}
          items={batches.map((b) => ({ label: b.batch_name, value: b.Batch_id }))}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />
        <RNPickerSelect
          onValueChange={setSelectedDept}
          value={selectedDept}
          placeholder={{ label: 'Select Department', value: null }}
          items={departments.map((d) => ({ label: d.Dept_name, value: d.Dept_id }))}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />
        <RNPickerSelect
          onValueChange={setSelectedCourse}
          value={selectedCourse}
          placeholder={{ label: 'Select Course', value: null }}
          items={courses.map((c) => ({ label: c.Course_name, value: c.Course_ID }))}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
          disabled={courses.length === 0}
        />
      </View>

      <TextInput
        placeholder="Search by name, email, or roll no"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <View style={styles.actionRow}>
        <View style={styles.checkboxRow}>
          <CustomCheckbox checked={selectAll} onToggle={toggleSelectAll} />
          <Text>Select All</Text>
        </View>
        <View style={styles.buttonGroup}>
          <View style={{ marginRight: 10 }}>
            <Button title="Set Active" onPress={() => updateStatus(1)} />
          </View>
          <Button title="Set Inactive" color="red" onPress={() => updateStatus(0)} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
          }
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
              No students found.
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  subText: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  status: {
    marginTop: 6,
    fontWeight: 'bold',
    color: '#555',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
  checkboxTick: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
    minWidth: 110,
    backgroundColor: 'white',
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
    minWidth: 110,
    backgroundColor: 'white',
  },
};
