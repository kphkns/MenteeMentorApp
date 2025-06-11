import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, BackHandler, Modal, RefreshControl, Animated
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.158.136:5000';

export default function AddBatchesScreen() {
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [search, setSearch] = useState('');
  const [editingBatch, setEditingBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const flatListRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBatches();
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
        setSelectedBatches([]);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSelectionMode]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/admin/batches`);
      // Sort batches by year descending (newest first)
      const sorted = res.data.sort((a, b) => b.batch_name.localeCompare(a.batch_name));
      setBatches(sorted);
    } catch {
      Alert.alert('Error', 'Failed to fetch batches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBatches();
  };

  const handleAddOrUpdate = async () => {
    if (!batchName.trim() || !/^\d{4}$/.test(batchName)) {
      return Alert.alert('Validation', 'Please enter a valid 4-digit batch year.');
    }

    try {
      const payload = { batch_name: batchName.trim() };
      if (editingBatch) {
        await axios.put(`${SERVER_URL}/admin/batches/${editingBatch.Batch_id}`, payload);
        Alert.alert('Updated', 'Batch updated successfully');
      } else {
        await axios.post(`${SERVER_URL}/admin/batches`, payload);
        Alert.alert('Added', 'Batch added successfully');
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      }
      setBatchName('');
      setEditingBatch(null);
      setSearch('');
      setModalVisible(false);
      fetchBatches();
    } catch (err) {
      if (err.response?.status === 409) {
        Alert.alert('Duplicate', 'This batch already exists.');
      } else {
        Alert.alert('Error', 'Operation failed. Please try again.');
      }
    }
  };

  const handleDelete = async (ids) => {
    Alert.alert('Delete', `Delete ${ids.length} batch(es)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await Promise.all(ids.map(id => axios.delete(`${SERVER_URL}/admin/batches/${id}`)));
            setSelectedBatches([]);
            setIsSelectionMode(false);
            fetchBatches();
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const toggleSelect = (id) => {
    setSelectedBatches(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredBatches = batches.filter(batch =>
    batch.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedBatches.includes(item.Batch_id);
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          onLongPress={() => {
            setIsSelectionMode(true);
            toggleSelect(item.Batch_id);
          }}
          onPress={() => {
            if (isSelectionMode) toggleSelect(item.Batch_id);
          }}
          style={[
            styles.card,
            isSelected && styles.selectedCard,
            { transform: [{ scale: fadeAnim }] }
          ]}
          activeOpacity={0.8}
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
                name="calendar-today"
                size={24}
                color={isSelected ? "#6366f1" : "#94a3b8"}
                style={styles.batchIcon}
              />
              <Text style={styles.cardTitle}>{item.batch_name}</Text>
            </View>
            {!isSelectionMode && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setBatchName(item.batch_name);
                  setEditingBatch(item);
                  setModalVisible(true);
                }}>
                <Feather name="edit-3" size={18} color="#4e73df" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Batches</Text>
          {isSelectionMode ? (
            <View style={styles.selectionHeader}>
              <Text style={styles.selectedCount}>{selectedBatches.length} selected</Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedBatches)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search batches..."
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

        {loading ? (
          <ActivityIndicator size="large" color="#4e73df" style={{ marginTop: 20 }} />
        ) : filteredBatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#c7d2fe" />
            <Text style={styles.emptyTitle}>No batches found</Text>
            <Text style={styles.emptySubtext}>
              {search.length > 0 ? 'Try a different search' : 'Add your first batch'}
            </Text>
            {search.length === 0 && (
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.addFirstButtonText}>Add Batch</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredBatches}
            keyExtractor={(item) => item.Batch_id.toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        )}

        {/* Modal */}
        <Modal visible={modalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBatch ? `Edit: ${editingBatch.batch_name}` : 'Add Batch'}
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="calendar-today" size={20} color="#6366f1" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter batch year"
                  value={batchName}
                  onChangeText={setBatchName}
                  style={styles.modalInput}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrUpdate}>
                  <Text style={styles.saveText}>{editingBatch ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setBatchName('');
                    setEditingBatch(null);
                  }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f2f6fc' },
  container: { flex: 1, padding: 20 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
  },
  header: { fontSize: 24, fontWeight: 'bold', color: '#4e73df' },
  addBtn: {
    backgroundColor: '#4e73df', padding: 10, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center'
  },
  deleteBtn: {
    backgroundColor: '#e74a3b', padding: 10, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center'
  },
  selectionHeader: { flexDirection: 'row', alignItems: 'center' },
  selectedCount: { marginRight: 10, fontWeight: '600', color: '#e74a3b', fontSize: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#dbeafe', borderColor: '#60a5fa'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
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
  batchIcon: {
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  editBtn: { padding: 8, borderRadius: 8 },
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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '90%', backgroundColor: '#fff',
    borderRadius: 12, padding: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#4e73df', marginBottom: 15
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
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
    flexDirection: 'row', justifyContent: 'space-between'
  },
  saveBtn: {
    backgroundColor: '#4e73df', padding: 10, borderRadius: 10,
    flex: 1, alignItems: 'center', marginRight: 10
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: {
    backgroundColor: '#f0f0f0', padding: 10, borderRadius: 10,
    flex: 1, alignItems: 'center'
  },
  cancelText: { color: '#333', fontWeight: '600' }
});
