import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator,
  Modal, BackHandler, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.134.136:5000';

export default function DepartmentScreen() {
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [search, setSearch] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/admin/departments`);
      const sorted = res.data.sort((a, b) => a.Dept_name.localeCompare(b.Dept_name));
      setDepartments(sorted);
    } catch {
      Alert.alert('Error', 'Failed to fetch departments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!deptName.trim()) return;
    try {
      if (editingDept) {
        await axios.put(`${SERVER_URL}/admin/departments/${editingDept.Dept_id}`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Success', 'Department updated');
      } else {
        await axios.post(`${SERVER_URL}/admin/departments`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Success', 'Department added');
      }
      resetForm();
      fetchDepartments();
    } catch {
      Alert.alert('Error', 'Could not save department');
    }
  };

  const resetForm = () => {
    setDeptName('');
    setEditingDept(null);
    setModalVisible(false);
  };

  const handleDelete = async (ids) => {
    Alert.alert('Delete', `Delete ${ids.length} department(s)?`, [
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
    setSelectedDepts(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
          if (isSelectionMode) toggleSelect(item.Dept_id);
        }}
        style={[styles.item, isSelected && styles.selectedItem]}
        activeOpacity={0.7}
      >
        <Text style={styles.itemText}>{item.Dept_name}</Text>
        {!isSelectionMode && (
          <TouchableOpacity onPress={() => {
            setDeptName(item.Dept_name);
            setEditingDept(item);
            setModalVisible(true);
          }}>
            <Feather name="edit" size={20} color="#3b82f6" />
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
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedDepts)}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search departments..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredDepartments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyText}>No departments found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => item.Dept_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchDepartments();
            }} />
          }
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDept ? `Editing: ${editingDept.Dept_name}` : 'Add Department'}
            </Text>
            <TextInput
              placeholder="Department Name"
              value={deptName}
              onChangeText={setDeptName}
              style={styles.input}
              placeholderTextColor="#888"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrUpdate}>
                <Text style={styles.saveText}>{editingDept ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937' },
  addBtn: {
    backgroundColor: '#3b82f6', padding: 10, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center'
  },
  deleteBtn: {
    backgroundColor: '#ef4444', padding: 10, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center'
  },
  searchInput: {
    backgroundColor: '#fff', padding: 12, borderRadius: 10, borderColor: '#d1d5db',
    borderWidth: 1, marginBottom: 16, fontSize: 16
  },
  item: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  selectedItem: { backgroundColor: '#dbeafe' },
  itemText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 15, color: '#1f2937' },
  input: {
    backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, borderColor: '#d1d5db',
    borderWidth: 1, marginBottom: 20, fontSize: 16
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedCount: { fontSize: 16, fontWeight: '600', color: '#ef4444', marginRight: 10 }
});
