import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.225.136:5000';

export default function BatchsScreen() {
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [search, setSearch] = useState('');
  const [editingBatch, setEditingBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/batches`);
      const sorted = res.data.sort((a, b) => a.batch_name.localeCompare(b.batch_name));
      setBatches(sorted);
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
      if (editingBatch) {
        await axios.put(`${SERVER_URL}/admin/batches/${editingBatch.Batch_id}`, {
          batch_name: batchName.trim()
        });
        Alert.alert('Updated', 'Batch successfully updated');
      } else {
        await axios.post(`${SERVER_URL}/admin/batches`, {
          batch_name: batchName.trim()
        });
        Alert.alert('Added', 'Batch successfully added');
      }

      setBatchName('');
      setEditingBatch(null);
      fetchBatches();
    } catch {
      Alert.alert('Error', 'Could not save batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm', 'Delete this batch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
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
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.batch_name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => {
          setBatchName(item.batch_name);
          setEditingBatch(item);
        }}>
          <FontAwesome name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Batch_id)} style={{ marginLeft: 15 }}>
          <Ionicons name="trash-outline" size={22} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>Batch Management</Text>

      <TextInput
        placeholder="Enter Batch Year (e.g., 2023)"
        value={batchName}
        onChangeText={setBatchName}
        style={styles.input}
        keyboardType="numeric"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleAddOrUpdate}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {editingBatch ? 'Update' : 'Add'} Batch
          </Text>
        </TouchableOpacity>

        {editingBatch && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => {
            setEditingBatch(null);
            setBatchName('');
          }}>
            <Text style={{ color: '#999' }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Search batch..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredBatches.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No batches found.</Text>
      ) : (
        <FlatList
          data={filteredBatches}
          keyExtractor={(item) => item.Batch_id.toString()}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f3ff', padding: 20 },
  title: {
    fontSize: 22, fontWeight: '700',
    color: '#007bff', marginBottom: 15
  },
  input: {
    backgroundColor: '#fff', padding: 12,
    borderRadius: 8, borderColor: '#ccc', borderWidth: 1,
    marginBottom: 10, fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 15
  },
  button: {
    flex: 1, backgroundColor: '#007bff',
    padding: 12, borderRadius: 8, alignItems: 'center',
    marginRight: 10
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#f0f0f0', borderRadius: 8
  },
  searchInput: {
    backgroundColor: '#fff', padding: 12,
    borderRadius: 8, borderColor: '#ccc',
    borderWidth: 1, marginBottom: 15
  },
  item: {
    backgroundColor: '#fff', padding: 15,
    borderRadius: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },
  actions: { flexDirection: 'row' }
});
