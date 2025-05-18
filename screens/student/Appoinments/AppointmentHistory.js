import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Modal,
  TouchableOpacity, Pressable, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.65.136:5000';

export default function AppointmentHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load appointment history.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    if (!['cancelled', 'completed', 'failed'].includes(item.status)) return null;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.dateText}>
            📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}
          </Text>
          <TouchableOpacity onPress={() => openModal(item)}>
            <Text style={styles.infoButton}>ⓘ</Text>
          </TouchableOpacity>
        </View>
        <Text>👨‍🏫 Faculty: {item.faculty_name}</Text>
        <Text>Status: <Text style={{ fontWeight: 'bold' }}>{item.status}</Text></Text>
        {item.status === 'cancelled' && (
          <>
            <Text>❌ Cancelled By: {item.cancelled_by}</Text>
            <Text>📝 Reason: {item.cancel_reason}</Text>
          </>
        )}
        {item.status === 'completed' && (
          <Text>✅ Completed Appointment</Text>
        )}
        {item.status === 'failed' && (
          <Text>⚠️ Failed Appointment</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📜 Appointment History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No history available.</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Appointment Details</Text>
            {selectedItem && (
              <>
                <Text>🕒 Duration: {selectedItem.duration} mins</Text>
                <Text>💬 Message: {selectedItem.message || 'N/A'}</Text>
                <Text>📍 Location: {selectedItem.location}</Text>
                <Text>📹 Mode: {selectedItem.meeting_mode || 'N/A'}</Text>
                {selectedItem.status === 'cancelled' && (
                  <>
                    <Text>❌ Cancelled By: {selectedItem.cancelled_by || 'N/A'}</Text>
                    <Text>📝 Cancel Reason: {selectedItem.cancel_reason || 'N/A'}</Text>
                  </>
                )}
                {selectedItem.status === 'failed' && (
                  <Text>⚠️ Failed Appointment</Text>
                )}
                <Text>📅 Created At: {new Date(selectedItem.created_at).toLocaleString()}</Text>
                <Text>🔄 Updated At: {new Date(selectedItem.updated_at).toLocaleString()}</Text>
              </>
            )}
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  dateText: { fontWeight: '700', marginBottom: 6, color: '#1e40af' },
  empty: { textAlign: 'center', marginTop: 20, color: '#64748b' },
  infoButton: { fontSize: 18, marginLeft: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  closeButton: {
    backgroundColor: '#2563eb',
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
});
