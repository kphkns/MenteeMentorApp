import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator,
  Modal, BackHandler, RefreshControl, KeyboardAvoidingView, 
  Platform, Animated
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SERVER_URL = 'http://192.168.15.136:5000';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchDepartments();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
    if (!deptName.trim()) {
      Alert.alert('Validation', 'Please enter a department name');
      return;
    }
    try {
      if (editingDept) {
        await axios.put(`${SERVER_URL}/admin/departments/${editingDept.Dept_id}`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Success', 'Department updated successfully');
      } else {
        await axios.post(`${SERVER_URL}/admin/departments`, {
          Dept_name: deptName.trim()
        });
        Alert.alert('Success', 'Department added successfully');
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
    Alert.alert('Confirm Delete', `Are you sure you want to delete ${ids.length} department(s)?`, [
      { 
        text: 'Cancel', 
        style: 'cancel',
        onPress: () => {
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      },
      {
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
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

  // --- UPDATED renderItem ---
  const renderItem = ({ item }) => {
    const isSelected = selectedDepts.includes(item.Dept_id);
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          onLongPress={() => {
            setIsSelectionMode(true);
            toggleSelect(item.Dept_id);
          }}
          onPress={() => {
            if (isSelectionMode) toggleSelect(item.Dept_id);
          }}
          style={[
            styles.item, 
            isSelected && styles.selectedItem,
            { transform: [{ scale: fadeAnim }] }
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.itemRow}>
            <View style={styles.itemContent}>
              {isSelectionMode && (
                <View style={[
                  styles.selectionIndicator,
                  isSelected && styles.selectedIndicator
                ]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              )}
              <MaterialIcons 
                name="apartment" 
                size={24} 
                color={isSelected ? "#6366f1" : "#94a3b8"} 
                style={styles.deptIcon}
              />
              <Text style={styles.itemText}>{item.Dept_name}</Text>
            </View>
            {!isSelectionMode && (
              <TouchableOpacity 
                onPress={() => {
                  setDeptName(item.Dept_name);
                  setEditingDept(item);
                  setModalVisible(true);
                }}
                style={styles.editButton}
              >
                <Feather name="edit-2" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  // --- END UPDATED renderItem ---

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#818cf8']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Departments</Text>
        
        {isSelectionMode ? (
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedDepts([]);
              }}
              style={styles.cancelSelectionButton}
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.selectedCount}>{selectedDepts.length} selected</Text>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDelete(selectedDepts)}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setModalVisible(true)}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search departments..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading departments...</Text>
        </View>
      ) : filteredDepartments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color="#c7d2fe" />
          <Text style={styles.emptyTitle}>No departments found</Text>
          <Text style={styles.emptySubtext}>
            {search.length > 0 ? 'Try a different search' : 'Add your first department'}
          </Text>
          {search.length === 0 && (
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addFirstButtonText}>Add Department</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => item.Dept_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true);
                fetchDepartments();
              }}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </Text>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="apartment" size={20} color="#6366f1" style={styles.inputIcon} />
                <TextInput
                  placeholder="Department Name"
                  placeholderTextColor="#94a3b8"
                  value={deptName}
                  onChangeText={setDeptName}
                  style={styles.modalInput}
                  autoFocus
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={resetForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleAddOrUpdate}
                  disabled={!deptName.trim()}
                >
                  <Text style={styles.saveButtonText}>
                    {editingDept ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  selectedItem: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  // NEW: for row with edit icon at end
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  deptIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelSelectionButton: {
    marginRight: 8,
  },
  selectedCount: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  addFirstButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
