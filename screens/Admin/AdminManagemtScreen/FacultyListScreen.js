import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Image, TextInput, TouchableOpacity, Modal, Alert, BackHandler, Keyboard,
  Animated, RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const SERVER_URL = 'http://192.168.65.136:5000';

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // For animated opacity per item, we'll keep a ref map:
  const fadeAnimMap = useRef({});

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();

    const backAction = () => {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedIds]);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/faculty`);
      setFaculties(res.data);
    } catch {
      alert('Failed to fetch faculty list');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/departments`);
      setDepartments(res.data);
    } catch {
      alert('Failed to fetch departments');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFaculties();
    setRefreshing(false);
  };

  const openEditModal = (faculty) => {
    setEditFaculty(faculty);
    setEditName(faculty.Name);
    setEditEmail(faculty.Email);
    setEditDept(faculty.Dept_ID);
    setModalVisible(true);
  };

  const saveFacultyChanges = async () => {
    if (!editName.trim() || !editEmail.trim() || !editDept) {
      alert('All fields are required');
      return;
    }
    try {
      await axios.put(`${SERVER_URL}/admin/faculty/${editFaculty.Faculty_id}`, {
        Name: editName.trim(),
        Email: editEmail.trim(),
        Dept_ID: editDept,
      });
      setModalVisible(false);
      fetchFaculties();
    } catch {
      alert('Failed to update faculty');
    }
  };

  const handleMultiDelete = () => {
    Alert.alert('Delete Selected', `Delete ${selectedIds.length} faculty?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            for (const id of selectedIds) {
              await axios.delete(`${SERVER_URL}/admin/faculty/${id}`);
            }
            setSelectedIds([]);
            fetchFaculties();
          } catch {
            alert('Failed to delete selected faculty');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    // Initialize Animated.Value if not present
    if (!fadeAnimMap.current[id]) {
      fadeAnimMap.current[id] = new Animated.Value(1);
    }

    Animated.sequence([
      Animated.timing(fadeAnimMap.current[id], { toValue: 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnimMap.current[id], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredFaculties = faculties.filter(f =>
    f.Name.toLowerCase().includes(search.toLowerCase()) ||
    f.Email.toLowerCase().includes(search.toLowerCase()) ||
    (f.Dept_name && f.Dept_name.toLowerCase().includes(search.toLowerCase()))
  );

  const renderFacultyItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.Faculty_id);
    if (!fadeAnimMap.current[item.Faculty_id]) {
      fadeAnimMap.current[item.Faculty_id] = new Animated.Value(1);
    }

    return (
      <Animated.View style={{ opacity: fadeAnimMap.current[item.Faculty_id], marginBottom: 12 }}>
        <TouchableOpacity
          onLongPress={() => toggleSelect(item.Faculty_id)}
          onPress={() => {
            if (selectedIds.length > 0) {
              toggleSelect(item.Faculty_id);
            }
          }}
          style={[
            styles.itemContainer,
            isSelected && styles.selectedItem
          ]}
        >
          <Image
            source={require('../../../assets/default-profile.png')}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.Name}</Text>
            <Text style={styles.role}>{item.Dept_name || 'No Department'}</Text>
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <FontAwesome name="edit" size={18} color="#007bff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <Text style={styles.headerText}>Faculty List</Text>
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedIds.length === 0 && styles.disabledButton
          ]}
          onPress={selectedIds.length > 0 ? handleMultiDelete : () => {}}
          disabled={selectedIds.length === 0}
        >
          <Ionicons name={selectedIds.length > 0 ? "trash" : "add"} size={24} color="#fff" />
          {selectedIds.length > 0 && (
            <Text style={styles.selectedCount}> ({selectedIds.length})</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#ccc" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for faculty..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          clearButtonMode="while-editing"
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={filteredFaculties}
          renderItem={renderFacultyItem}
          keyExtractor={(item) => item.Faculty_id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007bff" />
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Faculty</Text>

            <TextInput
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Picker
              selectedValue={editDept}
              onValueChange={(itemValue) => setEditDept(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Department" value="" />
              {departments.map((dept) => (
                <Picker.Item
                  key={dept.Dept_id}
                  label={dept.Dept_name}
                  value={dept.Dept_id}
                />
              ))}
            </Picker>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={saveFacultyChanges}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setEditFaculty(null);
                }}
              >
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
  container: { flex: 1, backgroundColor: '#f9fafd', padding: 16 },
  headerWrapper: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  headerText: { fontSize: 26, fontWeight: '700', color: '#222' },
  actionButton: {
    backgroundColor: '#007bff', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
  },
  selectedCount: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 8, marginBottom: 16,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  itemContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedItem: {
    backgroundColor: '#cce5ff',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, marginRight: 12,
    backgroundColor: '#ddd',
  },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  role: { fontSize: 14, color: '#777', marginTop: 2 },
  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '600', color: '#007bff',
    marginBottom: 16, textAlign: 'center'
  },
  input: {
    backgroundColor: '#f1f1f1', padding: 10, borderRadius: 8,
    marginBottom: 12, borderColor: '#ccc', borderWidth: 1,
    fontSize: 16,
  },
  picker: {
    backgroundColor: '#f1f1f1', borderRadius: 8,
    marginBottom: 12, height: 50,
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10
  },
  saveBtn: {
    backgroundColor: '#007bff', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center', marginRight: 10
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelBtn: {
    backgroundColor: '#ccc', padding: 10, borderRadius: 8,
    flex: 1, alignItems: 'center'
  },
  cancelText: { color: '#333', fontWeight: '600' }
});
