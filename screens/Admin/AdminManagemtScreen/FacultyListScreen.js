import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Image, TextInput, TouchableOpacity, Alert, Modal, Pressable
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const SERVER_URL = 'http://192.168.153.136:5000';

export default function FacultyListScreen() {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editFaculty, setEditFaculty] = useState(null);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();
  }, []);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/faculty`);
      setFaculties(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch faculty list');
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

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this faculty?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/admin/faculty/${id}`);
            fetchFaculties();
          } catch {
            Alert.alert('Error', 'Failed to delete faculty');
          }
        }
      }
    ]);
  };

  const openEditModal = (faculty) => {
    setEditFaculty(faculty);
    setEditName(faculty.Name);
    setEditEmail(faculty.Email);
    setEditDept(faculty.Dept_ID);
    setModalVisible(true);
  };

  const saveFacultyChanges = async () => {
    try {
      await axios.put(`${SERVER_URL}/admin/faculty/${editFaculty.Faculty_id}`, {
        Name: editName,
        Email: editEmail,
        Dept_ID: editDept,
      });
      setModalVisible(false);
      fetchFaculties();
    } catch {
      Alert.alert('Error', 'Failed to update faculty');
    }
  };

  const filteredFaculties = faculties.filter(f =>
    f.Name.toLowerCase().includes(search.toLowerCase()) ||
    f.Email.toLowerCase().includes(search.toLowerCase()) ||
    (f.Dept_name && f.Dept_name.toLowerCase().includes(search.toLowerCase()))
  );

  const renderFacultyItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={require('../../../assets/default-profile.png')}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.Name}</Text>
          <Text style={styles.email}>{item.Email}</Text>
          <Text style={styles.department}>{item.Dept_name || 'No Department'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <FontAwesome name="edit" size={20} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.Faculty_id)} style={{ marginLeft: 15 }}>
            <Ionicons name="trash-outline" size={22} color="#d9534f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Faculty Contacts</Text>

      <TextInput
        placeholder="Search by name, email or department..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={filteredFaculties}
          renderItem={renderFacultyItem}
          keyExtractor={(item) => item.Faculty_id.toString()}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Faculty</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              style={styles.input}
            />
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              style={styles.input}
              keyboardType="email-address"
            />

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editDept}
                onValueChange={(value) => setEditDept(value)}
              >
                <Picker.Item label="Select Department" value="" />
                {departments.map((dept) => (
                  <Picker.Item key={dept.Dept_id} label={dept.Dept_name} value={dept.Dept_id} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={saveFacultyChanges}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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
  container: { flex: 1, backgroundColor: '#f3f6fb', padding: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#fff', padding: 10, borderRadius: 8,
    borderColor: '#ccc', borderWidth: 1, marginBottom: 15
  },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
    marginBottom: 12, elevation: 3, shadowColor: '#000',
    shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, marginRight: 12,
    backgroundColor: '#dfe6ed'
  },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  email: { fontSize: 14, color: '#888', marginTop: 2 },
  department: { fontSize: 13, color: '#555', marginTop: 1 },
  actions: { flexDirection: 'row' },

  // Modal
  modalBackground: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  modalCard: {
    width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#007bff', marginBottom: 15
  },
  input: {
    backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8,
    borderColor: '#ccc', borderWidth: 1, marginBottom: 10
  },
  pickerWrapper: {
    borderColor: '#ccc', borderWidth: 1, borderRadius: 8,
    marginBottom: 15, backgroundColor: '#fff'
  },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10
  },
  saveBtn: {
    backgroundColor: '#007bff', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center', marginRight: 8
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center'
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#666', fontWeight: '600' },
});
