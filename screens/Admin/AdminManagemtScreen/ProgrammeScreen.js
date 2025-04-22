import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SectionList,
  Alert, StyleSheet, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const SERVER_URL = 'http://192.168.225.136:5000';

export default function ProgrammeScreen() {
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(50);
  const [displayedCount, setDisplayedCount] = useState(50);

  useEffect(() => {
    fetchProgrammes();
    fetchDepartments();
  }, []);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/courses`);
      setProgrammes(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch programmes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/departments`);
      setDepartments(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch departments');
    }
  };

  const handleAddOrUpdate = async () => {
    if (!courseName.trim() || !selectedDept) {
      return Alert.alert('Validation', 'Please fill all fields');
    }

    try {
      if (editingCourse) {
        await axios.put(`${SERVER_URL}/admin/courses/${editingCourse.Course_ID}`, {
          Course_name: courseName,
          Dept_ID: selectedDept,
        });
        Alert.alert('Updated', 'Programme updated successfully');
      } else {
        await axios.post(`${SERVER_URL}/admin/courses`, {
          Course_name: courseName,
          Dept_ID: selectedDept,
        });
        Alert.alert('Added', 'Programme added successfully');
      }

      resetForm();
      fetchProgrammes();
    } catch {
      Alert.alert('Error', 'Failed to save programme');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/admin/courses/${id}`);
            fetchProgrammes();
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setCourseName('');
    setSelectedDept('');
    setEditingCourse(null);
  };

  const groupedProgrammes = [...departments]
    .sort((a, b) => a.Dept_name.localeCompare(b.Dept_name))
    .map((dept) => {
      const data = programmes
        .filter(p =>
          p.Dept_ID === dept.Dept_id &&
          p.Course_name.toLowerCase().includes(search.toLowerCase()) &&
          (!searchDept || p.Dept_ID === searchDept)
        )
        .sort((a, b) => a.Course_name.localeCompare(b.Course_name))
        .slice(0, displayedCount);
      return { title: dept.Dept_name, data };
    }).filter(group => group.data.length > 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{item.Course_name}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => {
          setCourseName(item.Course_name);
          setSelectedDept(String(item.Dept_ID));
          setEditingCourse(item);
        }}>
          <FontAwesome name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Course_ID)} style={{ marginLeft: 16 }}>
          <Ionicons name="trash-outline" size={22} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title, data } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title} ({data.length})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Programme Management</Text>

      <View style={styles.inputGroup}>
        <TextInput
          placeholder="Enter Programme Name"
          value={courseName}
          onChangeText={setCourseName}
          style={styles.input}
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDept}
            onValueChange={setSelectedDept}
          >
            <Picker.Item label="Select Department" value="" />
            {departments.map(dept => (
              <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
            ))}
          </Picker>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddOrUpdate}>
            <Text style={styles.buttonText}>{editingCourse ? 'Update' : 'Add'} Programme</Text>
          </TouchableOpacity>
          {editingCourse && (
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={searchDept}
            onValueChange={(val) => setSearchDept(val)}
          >
            <Picker.Item label="Filter by Department" value="" />
            {departments.map(dept => (
              <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : groupedProgrammes.length === 0 ? (
        <Text style={styles.emptyText}>😕 No programmes found.</Text>
      ) : (
        <SectionList
          sections={groupedProgrammes}
          keyExtractor={(item) => item.Course_ID.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f3ff', padding: 15 },
  header: { fontSize: 22, fontWeight: '700', color: '#0d6efd', marginBottom: 15 },
  inputGroup: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 2 },
  input: {
    borderColor: '#ccc', borderWidth: 1, borderRadius: 8,
    padding: 10, marginBottom: 10, backgroundColor: '#f9f9f9'
  },
  pickerContainer: {
    borderColor: '#ccc', borderWidth: 1, borderRadius: 8,
    backgroundColor: '#f9f9f9', marginBottom: 10
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: {
    flex: 1, backgroundColor: '#0d6efd', padding: 12,
    borderRadius: 8, alignItems: 'center', marginRight: 5
  },
  cancelButton: {
    flex: 1, backgroundColor: '#6c757d', padding: 12,
    borderRadius: 8, alignItems: 'center', marginLeft: 5
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  searchBox: { marginBottom: 15 },
  searchInput: {
    backgroundColor: '#fff', borderColor: '#ccc',
    borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10
  },
  sectionHeader: {
    backgroundColor: '#d6eaff', padding: 10, borderRadius: 8,
    marginTop: 10
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  card: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, elevation: 2
  },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  cardActions: { flexDirection: 'row' },
  emptyText: {
    textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888',
  }
});
