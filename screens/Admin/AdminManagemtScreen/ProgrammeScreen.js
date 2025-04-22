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
  const [limit] = useState(50); // For future pagination
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
        .slice(0, displayedCount); // For pagination
      return { title: dept.Dept_name, data };
    }).filter(group => group.data.length > 0);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.Course_name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => {
          setCourseName(item.Course_name);
          setSelectedDept(String(item.Dept_ID));
          setEditingCourse(item);
        }}>
          <FontAwesome name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Course_ID)} style={{ marginLeft: 15 }}>
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
      <Text style={styles.title}>Programme Management</Text>

      <TextInput
        placeholder="Programme Name"
        value={courseName}
        onChangeText={setCourseName}
        style={styles.input}
      />

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedDept}
          onValueChange={(itemValue) => setSelectedDept(itemValue)}
        >
          <Picker.Item label="Select Department" value="" />
          {[...departments].sort((a, b) => a.Dept_name.localeCompare(b.Dept_name)).map((dept) => (
            <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
          ))}
        </Picker>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleAddOrUpdate}>
          <Text style={styles.buttonText}>{editingCourse ? 'Update' : 'Add'} Programme</Text>
        </TouchableOpacity>
        {editingCourse && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={resetForm}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search programmes..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={searchDept}
          onValueChange={(value) => setSearchDept(value)}
        >
          <Picker.Item label="Filter by Department" value="" />
          {[...departments].sort((a, b) => a.Dept_name.localeCompare(b.Dept_name)).map((dept) => (
            <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : groupedProgrammes.length === 0 ? (
        <Text style={styles.emptyText}>😕 No programmes found.</Text>
      ) : (
        <SectionList
          sections={groupedProgrammes}
          keyExtractor={(item) => item.Course_ID.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#e6f3ff' },
  title: { fontSize: 22, fontWeight: '700', color: '#007bff', marginBottom: 15 },
  input: {
    backgroundColor: '#fff', padding: 10, borderRadius: 8,
    borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
  pickerWrapper: {
    backgroundColor: '#fff', borderColor: '#ccc',
    borderWidth: 1, borderRadius: 8, marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  searchInput: {
    backgroundColor: '#fff', padding: 10, borderRadius: 8,
    borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
  sectionHeader: {
    backgroundColor: '#d0e8ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  item: {
    backgroundColor: '#fff', padding: 15, borderRadius: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 6,
    elevation: 1,
  },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },
  actions: { flexDirection: 'row' },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#888',
  },
});
