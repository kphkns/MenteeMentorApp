import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.84.136:5000';

export default function FacultyAppointlist() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(new Date());
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/faculty/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter only pending or accepted appointments to display in list
      const filtered = res.data.filter(app => app.status === 'pending' || app.status === 'accepted');
      setAppointments(filtered);
    } catch {
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const confirmAccept = (id) => {
    Alert.alert('Confirmation', 'Accept this appointment?', [
      { text: 'No' },
      { text: 'Yes', onPress: () => updateStatus(id, 'accepted') }
    ]);
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Validation', 'Please provide a cancellation reason.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_URL}/api/faculty/appointments/${selectedAppointment.appointment_id}/status`, {
        status: 'cancelled',
        cancel_reason: cancelReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCancelModalVisible(false);
      fetchAppointments();
    } catch {
      Alert.alert('Error', 'Failed to cancel appointment');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_URL}/api/faculty/appointments/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
    } catch {
      Alert.alert('Error', `Failed to update appointment to ${status}`);
    }
  };

  const markAsCompleted = async (appointment) => {
    const start = new Date(`${appointment.date}T${appointment.time}`);
    const end = new Date(start.getTime() + appointment.duration * 60000);

    if (new Date() < end) {
      Alert.alert('Too Early', 'You can only mark this as completed after the appointment ends.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_URL}/api/faculty/appointments/${appointment.appointment_id}/status`, {
        status: 'completed'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to mark as completed';
      Alert.alert('Error', message);
    }
  };

  // New function for marking as failed
  const markAsFailed = (appointment) => {
    Alert.alert(
      'Confirm',
      'Mark this appointment as failed (student did not come)?',
      [
        { text: 'No' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.patch(`${API_URL}/api/faculty/appointments/${appointment.appointment_id}/status`, {
                status: 'failed'
              }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchAppointments();
            } catch (err) {
              const message = err.response?.data?.message || 'Failed to mark as failed';
              Alert.alert('Error', message);
            }
          } 
        }
      ]
    );
  };

  const openReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    const date = new Date(appointment.date);
    const [h, m] = appointment.time.split(':');
    date.setHours(+h, +m);
    setRescheduleDate(date);
    setRescheduleTime(date);
    setRescheduleReason('');
    setRescheduleModalVisible(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleReason.trim()) {
      Alert.alert('Validation', 'Please enter a reason for rescheduling.');
      return;
    }

    const newDate = rescheduleDate.toISOString().split('T')[0];
    const newTime = rescheduleTime.toTimeString().split(' ')[0].slice(0, 5);

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_URL}/api/faculty/appointments/${selectedAppointment.appointment_id}/reschedule`, {
        date: newDate,
        time: newTime,
        reschedule_reason: rescheduleReason
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRescheduleModalVisible(false);
      fetchAppointments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.dateText}>📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}</Text>
      <Text style={styles.text}>👨‍🎓 Student: <Text style={styles.bold}>{item.student_name}</Text></Text>
      <Text style={styles.text}>📍 Mode: {item.meeting_mode} | Location: {item.location}</Text>
      <Text style={styles.text}>🟡 Status: <Text style={styles.status}>{item.status}</Text></Text>

      {item.status === 'pending' && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSuccess} onPress={() => confirmAccept(item.appointment_id)}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDanger} onPress={() => openCancelModal(item)}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnWarning} onPress={() => openReschedule(item)}>
            <Text style={styles.btnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginRight: 6 }]} onPress={() => markAsCompleted(item)}>
            <Text style={styles.btnText}>Mark as Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnDanger, { flex: 1, marginLeft: 6 }]} onPress={() => markAsFailed(item)}>
            <Text style={styles.btnText}>Mark as Failed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📖 Appointment Requests</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No appointments.</Text>}
        />
      )}

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Appointment</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnClose} onPress={() => setCancelModalVisible(false)}>
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={submitCancel}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
              <Text>{rescheduleDate.toDateString()}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={rescheduleDate}
              onConfirm={(d) => { setRescheduleDate(d); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
            />

            <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
              <Text>{rescheduleTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              date={rescheduleTime}
              onConfirm={(t) => { setRescheduleTime(t); setShowTimePicker(false); }}
              onCancel={() => setShowTimePicker(false)}
            />

            <TextInput
              style={styles.input}
              placeholder="Reason"
              multiline
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnClose} onPress={() => setRescheduleModalVisible(false)}>
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={submitReschedule}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles for UI
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f2f6ff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#007bff' },
  card: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  dateText: { fontSize: 14, marginBottom: 6, color: '#333' },
  text: { fontSize: 16, marginVertical: 2, color: '#444' },
  bold: { fontWeight: 'bold' },
  status: { fontWeight: 'bold', color: '#d2691e' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnSuccess: {
    flex: 1,
    backgroundColor: 'green',
    marginRight: 6,
    paddingVertical: 10,
    borderRadius: 5,
  },
  btnDanger: {
    flex: 1,
    backgroundColor: 'red',
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 5,
  },
  btnWarning: {
    flex: 1,
    backgroundColor: '#f0ad4e',
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 5,
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnClose: {
    backgroundColor: '#888',
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
  },
  selector: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 5,
    marginBottom: 12,
  },
});
