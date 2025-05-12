import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, Modal, BackHandler
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.65.136:5000';

export default function DepartmentScreen() {
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [search, setSearch] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedDepts([]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSelectionMode]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/departments`);
      const sorted = res.data.sort((a, b) => a.Dept_name.localeCompare(b.Dept_name));
      setDepartments(sorted);
    } catch {
      Alert.alert('Error', 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!deptName.trim()) return;
    try {
      if (editingDept) {
        await axios.put(`${SERVER_URL}/admin/departments/${editingDept.Dept_id}`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Updated', 'Department successfully updated');
      } else {
        await axios.post(`${SERVER_URL}/admin/departments`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Added', 'Department successfully added');
      }
      setDeptName('');
      setEditingDept(null);
      setModalVisible(false);
      fetchDepartments();
    } catch {
      Alert.alert('Error', 'Could not save department');
    }
  };

  const handleDelete = async (ids) => {
    Alert.alert('Confirm', `Delete ${ids.length} department(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await Promise.all(ids.map(id => axios.delete(`${SERVER_URL}/admin/departments/${id}`)));
            setSelectedDepts([]);
            setIsSelectionMode(false);
            fetchDepartments();
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    if (selectedDepts.includes(id)) {
      setSelectedDepts(selectedDepts.filter(item => item !== id));
    } else {
      setSelectedDepts([...selectedDepts, id]);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.Dept_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedDepts.includes(item.Dept_id);
    return (
      <TouchableOpacity
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelect(item.Dept_id);
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelect(item.Dept_id);
          }
        }}
        style={[styles.item, isSelected && { backgroundColor: '#e0f0ff' }]}
      >
        <Text style={styles.itemText}>{item.Dept_name}</Text>
        {!isSelectionMode && (
          <TouchableOpacity onPress={() => {
            setDeptName(item.Dept_name);
            setEditingDept(item);
            setModalVisible(true);
          }}>
            <Feather name="edit" size={18} color="#007bff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Departments</Text>
        {isSelectionMode ? (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectedCount}>{selectedDepts.length} selected</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleDelete(selectedDepts)}>
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
        placeholder="Search departments..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredDepartments.length === 0 ? (
        <Text style={styles.emptyText}>No departments found 😕</Text>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => item.Dept_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Modal for Add/Update */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingDept ? `Editing: ${editingDept.Dept_name}` : 'Add Department'}</Text>
            <TextInput
              placeholder="Department Name"
              value={deptName}
              onChangeText={setDeptName}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrUpdate}>
                <Text style={styles.saveText}>{editingDept ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setDeptName('');
                  setEditingDept(null);
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
  item: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },
  actions: { flexDirection: 'row' },
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
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#007bff', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  selectionHeader: { flexDirection: 'row', alignItems: 'center' },
  selectedCount: { marginRight: 10, fontSize: 16, fontWeight: '600', color: '#d9534f' },
});
