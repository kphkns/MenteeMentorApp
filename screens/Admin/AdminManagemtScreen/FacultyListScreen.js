import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Image, TextInput, TouchableOpacity, Modal, Alert, BackHandler, Keyboard,
  Animated, RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const SERVER_URL = 'http://192.168.15.136:5000';

export default function FacultyListScreen() {
  // Color palette
  const colors = {
    primary: '#6366F1',
    primaryLight: '#A5B4FC',
    background: '#f2f6ff',
    card: '#FFFFFF',
    text: '#1E293B',
    subText: '#64748B',
    success: '#10B981',
    error: '#EF4444',
    border: '#E2E8F0',
    shadow: '#94A3B8',
  };

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
  const fadeAnimMap = useRef({});
  const scrollY = useRef(new Animated.Value(0)).current; // <-- Animated value for scroll

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
      Alert.alert('Validation', 'All fields are required');
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
      Alert.alert('Error', 'Failed to update faculty');
    }
  };

  const handleMultiDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedIds.length} faculty member(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedIds) {
                await axios.delete(`${SERVER_URL}/admin/faculty/${id}`);
              }
              setSelectedIds([]);
              fetchFaculties();
            } catch {
              Alert.alert('Error', 'Failed to delete selected faculty');
            }
          }
        }
      ]
    );
  };

  const toggleSelect = (id) => {
    if (!fadeAnimMap.current[id]) {
      fadeAnimMap.current[id] = new Animated.Value(1);
    }

    Animated.sequence([
      Animated.timing(fadeAnimMap.current[id], { toValue: 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnimMap.current[id], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
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
      <Animated.View style={{ opacity: fadeAnimMap.current[item.Faculty_id] }}>
        <TouchableOpacity
          onLongPress={() => toggleSelect(item.Faculty_id)}
          onPress={() => selectedIds.length > 0 && toggleSelect(item.Faculty_id)}
          style={[
            styles.facultyCard,
            isSelected && styles.selectedCard
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../assets/default-profile.png')}
              style={styles.avatar}
            />
            {isSelected && (
              <View style={styles.selectionBadge}>
                <Feather name="check" size={16} color="#fff" />
              </View>
            )}
          </View>
          
          <View style={styles.facultyInfo}>
            <Text style={styles.facultyName}>{item.Name}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={14} color={colors.subText} />
              <Text style={styles.detailText}>{item.Email}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="building" size={14} color={colors.subText} />
              <Text style={styles.detailText}>{item.Dept_name || 'No Department'}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => openEditModal(item)}
            style={styles.editButton}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Faculty Members</Text>
        <Text style={styles.headerSubtitle}>{faculties.length} total faculty</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={colors.subText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search faculty..."
          placeholderTextColor={colors.subText}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {/* Selection Controls */}
      {selectedIds.length > 0 && (
        <View style={styles.selectionControls}>
          <Text style={styles.selectedCount}>
            {selectedIds.length} selected
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleMultiDelete}
          >
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Faculty List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={filteredFaculties}
          renderItem={renderFacultyItem}
          keyExtractor={(item) => item.Faculty_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="users" size={48} color={colors.subText} />
              <Text style={styles.emptyText}>No faculty found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            </View>
          )}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Faculty</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Enter full name"
                value={editName}
                onChangeText={setEditName}
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                placeholder="Enter email"
                value={editEmail}
                onChangeText={setEditEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editDept}
                  onValueChange={setEditDept}
                  style={styles.picker}
                  dropdownIconColor={colors.subText}
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
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveFacultyChanges}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#94A3B8',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  selectedCount: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 15,
  },
  facultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#94A3B8',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
  },
  selectionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6366F1',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  facultyInfo: {
    flex: 1,
  },
  facultyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  picker: {
    height: 50,
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
