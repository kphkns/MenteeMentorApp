import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, StyleSheet, ActivityIndicator, Modal,
  TextInput, Button
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const API_URL = 'http://192.168.65.136:5000';

export default function StudentAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

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
      const filtered = (res.data || []).filter(app =>
        app.status === 'pending' || app.status === 'accepted'
      );
      setAppointments(filtered);
    } catch {
      Alert.alert('Error', 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (id) => {
    setSelectedAppointmentId(id);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Validation', 'Please enter a cancellation reason.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/api/appointments/${selectedAppointmentId}/cancel`,
        { cancel_reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Cancelled', 'Appointment cancelled successfully.');
      setCancelModalVisible(false);
      fetchAppointments();
    } catch {
      Alert.alert('Error', 'Failed to cancel appointment.');
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleData(appointment);
    const date = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));
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

    const newDateStr = `${rescheduleDate.getFullYear()}-${(rescheduleDate.getMonth() + 1).toString().padStart(2, '0')}-${rescheduleDate.getDate().toString().padStart(2, '0')}`;
    const newTimeStr = rescheduleTime.toTimeString().split(' ')[0].slice(0, 5);

    const originalDateStr = new Date(rescheduleData.date).toDateString();
    const newDateCompare = rescheduleDate.toDateString();
    const originalTimeStr = rescheduleData.time;

    if (originalDateStr === newDateCompare && originalTimeStr === newTimeStr) {
      Alert.alert('No Changes', 'You must change the date or time to reschedule.');
      return;
    }

    const combinedRescheduleDateTime = new Date(`${newDateStr}T${newTimeStr}`);
    if (combinedRescheduleDateTime <= new Date()) {
      Alert.alert('Invalid', 'You cannot reschedule to a past time.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/api/appointments/${rescheduleData.appointment_id}/reschedule`,
        {
          date: newDateStr,
          time: newTimeStr,
          duration: rescheduleData.duration,
          reschedule_reason: rescheduleReason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Appointment rescheduled successfully.');
      setRescheduleModalVisible(false);
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reschedule appointment.';
      Alert.alert('Error', msg);
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(+hours);
    date.setMinutes(+minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.dateTime}>
        📅 {new Date(item.date).toLocaleDateString('en-US', {
          weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
        })} 🕒 {formatTime(item.time)}
      </Text>
      <Text>🧑‍🏫 Mentor ID: {item.faculty_name}</Text>
      <Text>⏱ Duration: {item.duration} mins</Text>
      <Text>📍 {item.meeting_mode === 'online' ? 'Online' : 'Offline'} - {item.location}</Text>
      <Text>📝 Status: <Text style={{ fontWeight: '600' }}>{item.status}</Text></Text>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => openCancelModal(item.appointment_id)}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleBtn} onPress={() => openRescheduleModal(item)}>
            <Text style={styles.btnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 My Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.appointment_id)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No appointments found.</Text>}
      />

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancellation Reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason for cancellation"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setCancelModalVisible(false)} />
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

            <Text style={styles.label}>New Date</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
              <Text>{rescheduleDate.toDateString()}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={rescheduleDate}
              onConfirm={(date) => { setRescheduleDate(date); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
            />

            <Text style={styles.label}>New Time</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
              <Text>{rescheduleTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              date={rescheduleTime}
              onConfirm={(time) => { setRescheduleTime(time); setShowTimePicker(false); }}
              onCancel={() => setShowTimePicker(false)}
            />

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.textarea}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              multiline
              placeholder="Why are you rescheduling?"
            />

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setRescheduleModalVisible(false)} />
              <Button title="Submit" onPress={submitReschedule} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', flex: 1 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 14, marginBottom: 12, borderRadius: 8, elevation: 3 },
  dateTime: { fontWeight: '700', marginBottom: 6, color: '#2563eb' },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  cancelBtn: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  rescheduleBtn: { backgroundColor: '#facc15', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalInput: { height: 80, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 15, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6, color: '#334155' },
  selector: { backgroundColor: '#e2e8f0', padding: 12, borderRadius: 6, marginBottom: 10 },
  textarea: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', height: 80, padding: 10, borderRadius: 6, marginBottom: 20, textAlignVertical: 'top' },
});
