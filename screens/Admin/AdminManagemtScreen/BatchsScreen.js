import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, BackHandler, Modal
} from 'react-native';
import axios from 'axios';
import { Ionicons, Feather } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.153.136:5000';

export default function AddBatchesScreen() {
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [search, setSearch] = useState('');
  const [editingBatch, setEditingBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const flatListRef = useRef();

  useEffect(() => {
    fetchBatches();
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
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/batches`);
      setBatches(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
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
    if (selectedBatches.includes(id)) {
      setSelectedBatches(selectedBatches.filter(item => item !== id));
    } else {
      setSelectedBatches([...selectedBatches, id]);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedBatches.includes(item.Batch_id);
    return (
      <TouchableOpacity
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelect(item.Batch_id);
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelect(item.Batch_id);
          }
        }}
        style={[styles.card, isSelected && { backgroundColor: '#e0f0ff' }]}
      >
        <Text style={styles.cardTitle}>{item.batch_name}</Text>
        {!isSelectionMode && (
          <TouchableOpacity onPress={() => {
            setBatchName(item.batch_name);
            setEditingBatch(item);
            setModalVisible(true);
          }}>
            <Feather name="edit" size={20} color="#4e73df" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
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

        <TextInput
          placeholder="Search Batches..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#4e73df" style={{ marginTop: 20 }} />
        ) : filteredBatches.length === 0 ? (
          <Text style={styles.emptyMessage}>No batches found.</Text>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredBatches}
            keyExtractor={(item) => item.Batch_id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingBatch ? `Editing: ${editingBatch.batch_name}` : 'Add Batch'}</Text>
              <TextInput
                placeholder="Batch Year"
                value={batchName}
                onChangeText={setBatchName}
                style={styles.input}
                keyboardType="numeric"
              />
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
  wrapper: { flex: 1, backgroundColor: '#e6f3ff' },
  container: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  header: { fontSize: 22, fontWeight: '700', color: '#4e73df' },
  addBtn: { backgroundColor: '#4e73df', padding: 10, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: '#e74a3b', padding: 10, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  selectedCount: { color: '#e74a3b', fontWeight: '600', fontSize: 16, marginRight: 10 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 10, borderColor: '#ccc', borderWidth: 1, marginBottom: 16 },
  input: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1, marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderColor: '#d1d3e2', borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#343a40' },
  emptyMessage: { textAlign: 'center', color: '#6c757d', fontSize: 16, marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#4e73df' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#4e73df', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' }
});