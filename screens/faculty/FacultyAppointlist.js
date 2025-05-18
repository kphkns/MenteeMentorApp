import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Button, Alert, ActivityIndicator
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.65.136:5000';

export default function FacultyAppointlist() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/faculty/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = res.data.filter(app => app.status === 'pending' || app.status === 'accepted');
      setAppointments(filtered);
    } catch {
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

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
      <Text style={styles.boldText}>📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}</Text>
      <Text>👨‍🎓 Student: {item.student_name}</Text>
      <Text>📍 Mode: {item.meeting_mode} | Location: {item.location}</Text>
      <Text>Status: {item.status}</Text>

      {item.status === 'pending' && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => confirmAccept(item.appointment_id)}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => openCancelModal(item)}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleBtn} onPress={() => openReschedule(item)}>
            <Text style={styles.btnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: '#3b82f6' }]}
            onPress={() => markAsCompleted(item)}
          >
            <Text style={styles.btnText}>Mark as Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📖 Appointment Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No appointments.</Text>}
        />
      )}

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancellation Reason</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason for cancellation"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setCancelModalVisible(false)} />
              <Button title="Submit" onPress={submitCancel} />
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
              placeholder="Reschedule Reason"
              multiline
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
            />

            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setRescheduleModalVisible(false)} />
              <Button title="Submit" onPress={submitReschedule} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 2 },
  boldText: { fontWeight: '700', marginBottom: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  acceptBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#ef4444', padding: 10, borderRadius: 6 },
  rescheduleBtn: { backgroundColor: '#f59e0b', padding: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  selector: { padding: 12, backgroundColor: '#e2e8f0', borderRadius: 6, marginVertical: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, height: 80, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' }
});