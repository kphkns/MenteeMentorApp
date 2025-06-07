import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator,
  Modal, BackHandler, RefreshControl, Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';

const SERVER_URL = 'http://192.168.15.136:5000';

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
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProgrammes = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/courses`);
      setProgrammes(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch programmes');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  useEffect(() => {
    fetchProgrammes();
    fetchDepartments();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        Haptics.selectionAsync();
        setIsSelectionMode(false);
        setSelectedProgs([]);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSelectionMode]);

  const resetForm = () => {
    setCourseName('');
    setSelectedDept('');
    setEditingCourse(null);
  };

  const handleAddOrUpdate = async () => {
    if (!courseName.trim() || !selectedDept) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Validation', 'Please fill all fields');
    }
    try {
      setSaving(true);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(editingCourse ? 'Updated' : 'Added', `Programme ${editingCourse ? 'updated' : 'added'} successfully`);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save programme');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ids) => {
    Alert.alert('Confirm', `Delete ${ids.length} programme(s)?`, [
      { 
        text: 'Cancel', 
        style: 'cancel',
        onPress: () => Haptics.selectionAsync()
      },
      {
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await Promise.all(ids.map(id => axios.delete(`${SERVER_URL}/admin/courses/${id}`)));
            setSelectedProgs([]);
            setIsSelectionMode(false);
            fetchProgrammes();
          } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    Haptics.selectionAsync();
    if (selectedProgs.includes(id)) {
      setSelectedProgs(selectedProgs.filter(item => item !== id));
    } else {
      setSelectedProgs([...selectedProgs, id]);
    }
  };

  const toggleExpansion = (id) => {
    Haptics.selectionAsync();
    setExpandedProgs(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredProgrammes = programmes.filter(p =>
    p.Course_name.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    fetchProgrammes();
  }, []);

  const renderItem = ({ item }) => {
    const isSelected = selectedProgs.includes(item.Course_ID);
    const isExpanded = expandedProgs.includes(item.Course_ID);
    const department = departments.find(d => d.Dept_id === item.Dept_ID);

    return (
      <TouchableOpacity
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        style={[
          styles.card, 
          isSelected && styles.selectedCard,
          isExpanded && styles.expandedCard
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.Course_name}</Text>
            {!isSelectionMode && (
              <TouchableOpacity 
                onPress={() => {
                  Haptics.selectionAsync();
                  setCourseName(item.Course_name);
                  setSelectedDept(String(item.Dept_ID));
                  setEditingCourse(item);
                  setModalVisible(true);
                }}
                style={styles.editButton}
              >
                <Feather name="edit-2" size={20} color={styles.iconColor} />
              </TouchableOpacity>
            )}
          </View>
          
          {isExpanded && department && (
            <View style={styles.departmentInfo}>
              <MaterialIcons name="apartment" size={18} color={styles.iconColor} />
              <Text style={styles.cardSub}>{department.Dept_name}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Programmes</Text>
        {isSelectionMode ? (
          <View style={styles.selectionActions}>
            <Text style={styles.selectedCount}>{selectedProgs.length} selected</Text>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDelete(selectedProgs)}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              Haptics.selectionAsync();
              setModalVisible(true);
            }}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={styles.iconColor} style={styles.searchIcon} />
        <TextInput
          placeholder="Search programmes..."
          placeholderTextColor={styles.placeholderColor}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={styles.primaryColor} style={styles.loadingIndicator} />
      ) : filteredProgrammes.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book" size={40} color={styles.iconColor} />
          <Text style={styles.emptyText}>No programmes found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProgrammes}
          keyExtractor={(item) => item.Course_ID.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[styles.primaryColor]}
              tintColor={styles.primaryColor}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCourse ? 'Update Programme' : 'Add New Programme'}
            </Text>
            
            <Text style={styles.inputLabel}>Programme Name</Text>
            <TextInput
              placeholder="Enter programme name"
              placeholderTextColor={styles.placeholderColor}
              value={courseName}
              onChangeText={setCourseName}
              style={styles.input}
            />
            
            <Text style={styles.inputLabel}>Department</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={selectedDept} 
                onValueChange={setSelectedDept}
                dropdownIconColor={styles.iconColor}
              >
                <Picker.Item label="Select Department" value="" />
                {departments.map(dept => (
                  <Picker.Item 
                    key={dept.Dept_id} 
                    label={dept.Dept_name} 
                    value={dept.Dept_id} 
                  />
                ))}
              </Picker>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleAddOrUpdate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {editingCourse ? 'Update' : 'Add'} Programme
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={[styles.buttonText, { color: styles.primaryColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Theme colors
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#f8faff',
  cardBackground: '#ffffff',
  textColor: '#1a1d2e',
  subtitleColor: '#6b7280',
  iconColor: '#6b7280',
  placeholderColor: '#9ca3af',
  borderColor: '#e5e7eb',
  errorColor: '#ef4444',
  successColor: '#10b981',

  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1d2e',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCount: {
    marginRight: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1d2e',
  },

  // List
  listContent: {
    paddingBottom: 30,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  selectedCard: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  expandedCard: {
    backgroundColor: '#f9fafc',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1d2e',
    flex: 1,
  },
  editButton: {
    padding: 6,
    marginLeft: 10,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cardSub: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1d2e',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1d2e',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerContainer: {
    backgroundColor: '#f9fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
