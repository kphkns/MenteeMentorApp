import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.225.136:5000';

export default function DepartmentScreen() {
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [search, setSearch] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

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
      setSubmitting(true);
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
      fetchDepartments();
    } catch {
      Alert.alert('Error', 'Could not save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm', 'Delete this department?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/admin/departments/${id}`);
            fetchDepartments();
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.Dept_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.Dept_name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => {
          setDeptName(item.Dept_name);
          setEditingDept(item);
        }}>
          <FontAwesome name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Dept_id)} style={{ marginLeft: 15 }}>
          <Ionicons name="trash-outline" size={22} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Department Management</Text>
        <Text style={styles.subtext}>Add, edit, and organize departments</Text>
      </View>

      <TextInput
        placeholder="Enter Department Name"
        value={deptName}
        onChangeText={setDeptName}
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleAddOrUpdate}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {editingDept ? 'Update' : 'Add'} Department
          </Text>
        </TouchableOpacity>

        {editingDept && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => {
            setEditingDept(null);
            setDeptName('');
          }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search departments..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredDepartments.length === 0 ? (
        <Text style={styles.emptyText}>No departments found 😕</Text>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => item.Dept_id.toString()}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f3ff', padding: 20 },
  headerCard: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtext: {
    fontSize: 14,
    color: '#cce6ff',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  button: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  cancelText: {
    color: '#555',
    fontWeight: '500'
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 10
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  actions: {
    flexDirection: 'row'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 30
  }
});
