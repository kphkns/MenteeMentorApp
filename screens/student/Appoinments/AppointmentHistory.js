import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.84.136:5000';

export default function AppointmentHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!refreshing) setLoading(true);
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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderStatusBadge = (status) => {
    let bgColor = '#60a5fa';
    let text = status.charAt(0).toUpperCase() + status.slice(1);
    switch (status) {
      case 'cancelled': bgColor = '#f87171'; break;
      case 'completed': bgColor = '#34d399'; break;
      case 'failed': bgColor = '#fbbf24'; break;
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (!['cancelled', 'completed', 'failed'].includes(item.status)) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openModal(item)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}
          </Text>
          {renderStatusBadge(item.status)}
        </View>

        <Text style={styles.facultyText}>👨‍🏫 Faculty: {item.faculty_name}</Text>

        {item.status === 'cancelled' && (
          <View style={styles.cancelledContainer}>
            <Text style={styles.cancelledText}>❌ Cancelled By: {item.cancelled_by}</Text>
            <Text style={styles.cancelledText}>📝 Reason: {item.cancel_reason}</Text>
          </View>
        )}

        {item.status === 'completed' && (
          <Text style={styles.completedText}>✅ Completed Appointment</Text>
        )}

        {item.status === 'failed' && (
          <Text style={styles.failedText}>⚠️ Failed Appointment</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📜 Appointment History</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No history available.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          contentContainerStyle={appointments.length === 0 && { flex: 1, justifyContent: 'center' }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Appointment Details</Text>
            {selectedItem && (
              <>
                <Text style={styles.modalText}>🕒 Duration: {selectedItem.duration} mins</Text>
                <Text style={styles.modalText}>💬 Message: {selectedItem.message || 'N/A'}</Text>
                <Text style={styles.modalText}>📍 Location: {selectedItem.location}</Text>
                <Text style={styles.modalText}>📹 Mode: {selectedItem.meeting_mode || 'N/A'}</Text>
                {selectedItem.status === 'cancelled' && (
                  <>
                    <Text style={styles.modalText}>❌ Cancelled By: {selectedItem.cancelled_by || 'N/A'}</Text>
                    <Text style={styles.modalText}>📝 Cancel Reason: {selectedItem.cancel_reason || 'N/A'}</Text>
                  </>
                )}
                {selectedItem.status === 'failed' && (
                  <Text style={[styles.modalText, { color: '#b45309' }]}>
                    ⚠️ Failed Appointment
                  </Text>
                )}
                <Text style={styles.modalText}>
                  📅 Created At: {new Date(selectedItem.created_at).toLocaleString()}
                </Text>
                <Text style={styles.modalText}>
                  🔄 Updated At: {new Date(selectedItem.updated_at).toLocaleString()}
                </Text>
              </>
            )}

            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [
                { backgroundColor: pressed ? '#1e40af' : '#2563eb' },
                styles.closeButton,
              ]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    color: '#1e3a8a',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#2563eb',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  cancelledContainer: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 8,
  },
  cancelledText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 13,
  },
  completedText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },
  failedText: {
    color: '#b45309',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
    color: '#2563eb',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
