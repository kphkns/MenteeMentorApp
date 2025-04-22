import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.225.136:5000';

export default function AddBatchesScreen() {
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [search, setSearch] = useState('');
  const [editingBatch, setEditingBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const flatListRef = useRef();

  useEffect(() => {
    fetchBatches();
  }, []);

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
      setSubmitting(true);
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
      fetchBatches();
    } catch (err) {
      if (err.response?.status === 409) {
        Alert.alert('Duplicate', 'This batch already exists.');
      } else {
        Alert.alert('Error', 'Operation failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/admin/batches/${id}`);
            fetchBatches();
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  const filteredBatches = batches.filter(batch =>
    batch.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.batch_name}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => {
          setBatchName(item.batch_name);
          setEditingBatch(item);
        }}>
          <FontAwesome name="edit" size={20} color="#4e73df" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Batch_id)} style={{ marginLeft: 20 }}>
          <Ionicons name="trash-outline" size={22} color="#e74a3b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.container}>
          <Text style={styles.header}>Manage Batches</Text>

          <TextInput
            placeholder="Enter Batch Year (e.g., 2024)"
            placeholderTextColor="#999"
            value={batchName}
            onChangeText={setBatchName}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
              onPress={handleAddOrUpdate}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{editingBatch ? 'Update' : 'Add'} Batch</Text>
            </TouchableOpacity>
            {editingBatch && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingBatch(null);
                  setBatchName('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
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
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e6f3ff',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4e73df',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    borderColor: '#d1d3e2',
    borderWidth: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderColor: '#d1d3e2',
    borderWidth: 1,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4e73df',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#e2e6ea',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: '#444',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: '#d1d3e2',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 20,
  },
});
