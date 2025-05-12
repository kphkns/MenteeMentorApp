import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, Modal, BackHandler
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const SERVER_URL = 'http://192.168.65.136:5000';

export default function ProgrammeScreen() {
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProgs, setSelectedProgs] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [expandedProgs, setExpandedProgs] = useState([]);

  useEffect(() => {
    fetchProgrammes();
    fetchDepartments();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedProgs([]);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSelectionMode]);

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

  const resetForm = () => {
    setCourseName('');
    setSelectedDept('');
    setEditingCourse(null);
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
      } else {
        await axios.post(`${SERVER_URL}/admin/courses`, {
          Course_name: courseName,
          Dept_ID: selectedDept,
        });
      }
      await fetchProgrammes();
      setModalVisible(false);
      resetForm();
      Alert.alert(editingCourse ? 'Updated' : 'Added', `Programme ${editingCourse ? 'updated' : 'added'} successfully`);
    } catch {
      Alert.alert('Error', 'Failed to save programme');
    }
  };

  const handleDelete = async (ids) => {
    Alert.alert('Confirm', `Delete ${ids.length} programme(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await Promise.all(ids.map(id => axios.delete(`${SERVER_URL}/admin/courses/${id}`)));
            setSelectedProgs([]);
            setIsSelectionMode(false);
            fetchProgrammes();
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    if (selectedProgs.includes(id)) {
      setSelectedProgs(selectedProgs.filter(item => item !== id));
    } else {
      setSelectedProgs([...selectedProgs, id]);
    }
  };

  const toggleExpansion = (id) => {
    setExpandedProgs(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredProgrammes = programmes.filter(p =>
    p.Course_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedProgs.includes(item.Course_ID);
    const isExpanded = expandedProgs.includes(item.Course_ID);
    const department = departments.find(d => d.Dept_id === item.Dept_ID);

    return (
      <TouchableOpacity
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelect(item.Course_ID);
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelect(item.Course_ID);
          } else {
            toggleExpansion(item.Course_ID);
          }
        }}
        style={[styles.card, isSelected && { backgroundColor: '#e0f0ff' }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.Course_name}</Text>
          {isExpanded && department && (
            <Text style={styles.cardSub}>
              Department: <Text style={{ fontWeight: '600' }}>{department.Dept_name}</Text>
            </Text>
          )}
        </View>
        {!isSelectionMode && (
          <TouchableOpacity onPress={() => {
            setCourseName(item.Course_name);
            setSelectedDept(String(item.Dept_ID));
            setEditingCourse(item);
            setModalVisible(true);
          }}>
            <Feather name="edit" size={20} color="#007bff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Programmes</Text>
        {isSelectionMode ? (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectedCount}>{selectedProgs.length} selected</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleDelete(selectedProgs)}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search programmes..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredProgrammes.length === 0 ? (
        <Text style={styles.emptyText}>No programmes found 😕</Text>
      ) : (
        <FlatList
          data={filteredProgrammes}
          keyExtractor={(item) => item.Course_ID.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCourse ? 'Update Programme' : 'Add Programme'}</Text>
            <TextInput
              placeholder="Programme Name"
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
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrUpdate}>
                <Text style={styles.saveText}>{editingCourse ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  addBtn: {
    backgroundColor: '#007bff', padding: 10, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center'
  },
  searchInput: {
    backgroundColor: '#fff', padding: 10, borderRadius: 10, borderColor: '#ccc',
    borderWidth: 1, marginBottom: 16
  },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  cardSub: { marginTop: 6, fontSize: 14, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#666' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '90%', backgroundColor: '#fff', borderRadius: 10, padding: 20
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#007bff' },
  input: {
    backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderColor: '#ccc',
    borderWidth: 1, marginBottom: 15
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1,
    borderColor: '#ccc', marginBottom: 15
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#007bff', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  selectionHeader: { flexDirection: 'row', alignItems: 'center' },
  selectedCount: { marginRight: 10, fontSize: 16, fontWeight: '600', color: '#d9534f' },
});
