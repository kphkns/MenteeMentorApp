import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, StyleSheet, ActivityIndicator, Modal,
  TextInput, Button, ScrollView, RefreshControl
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.84.136:5000';

export default function StudentAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoData, setInfoData] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = res.data.filter(app =>
        app.status === 'pending' || app.status === 'accepted'
      );
      setAppointments(filtered);
    } catch {
      Alert.alert('Error', 'Unable to load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const cancelAppointment = (appointment) => {
    if (appointment.status === 'pending') {
      Alert.alert('Confirm', 'Do you want to delete this pending appointment?', [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.delete(`${API_URL}/api/appointments/${appointment.appointment_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Deleted', 'Appointment deleted successfully.');
              fetchAppointments();
            } catch {
              Alert.alert('Error', 'Failed to delete appointment.');
            }
          }
        }
      ]);
    } else if (appointment.status === 'accepted') {
      setSelectedAppointment(appointment);
      setCancelReason('');
      setCancelModalVisible(true);
    }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Validation', 'Please enter a cancellation reason.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/api/appointments/${selectedAppointment.appointment_id}/cancel`,
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
    const [h, m] = appointment.time.split(':');
    date.setHours(parseInt(h), parseInt(m));
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

    const newDateStr = rescheduleDate.toISOString().split('T')[0];
    const newTimeStr = rescheduleTime.toTimeString().split(':').slice(0, 2).join(':');

    if (
      rescheduleData.date === newDateStr &&
      rescheduleData.time === newTimeStr
    ) {
      Alert.alert('No Changes', 'Date or time must be different to reschedule.');
      return;
    }

    if (new Date(`${newDateStr}T${newTimeStr}`) <= new Date()) {
      Alert.alert('Invalid Time', 'Cannot select a past time.');
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
      Alert.alert('Success', 'Appointment rescheduled.');
      setRescheduleModalVisible(false);
      fetchAppointments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reschedule.');
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const showInfo = (appointment) => {
    setInfoData(appointment);
    setInfoModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}</Text>
        <TouchableOpacity onPress={() => showInfo(item)}>
          <Ionicons name="information-circle-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>👨‍🏫 Mentor  : {item.faculty_name}</Text>
      <Text style={styles.text}>🕐 Duration: {item.duration} min</Text>
      <Text style={styles.text}>📍 Location: {item.meeting_mode} - {item.location}</Text>
      {/* <Text style={styles.status}>📌 Status: {item.status}</Text> */}
      <Text style={[
        styles.status,
        item.status === 'pending' ? styles.pending : styles.accepted
      ]}>📌 Status: {item.status.toUpperCase()}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelAppointment(item)}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.rescheduleBtn} onPress={() => openRescheduleModal(item)}>
            <Text style={styles.btnText}>Reschedule</Text>
          </TouchableOpacity>
        )}
      </View>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20,   }}>No appointments found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancellation Reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason"
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
        <ScrollView contentContainerStyle={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reschedule</Text>
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
            <TextInput
              style={styles.modalInput}
              placeholder="Reschedule reason"
              multiline
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setRescheduleModalVisible(false)} />
              <Button title="Submit" onPress={submitReschedule} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Appointment Info</Text>
            {infoData && (
              <>
                <Text><Text style={{ fontWeight: 'bold' }}>📨 Message:</Text> {infoData.message || 'N/A'}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>📍 Location:</Text> {infoData.location || 'N/A'}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>📅 Created:</Text> {new Date(infoData.created_at).toLocaleString()}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>🔄 Updated:</Text> {new Date(infoData.updated_at).toLocaleString()}</Text>
              </>
            )}
            <View style={[styles.modalButtons, { marginTop: 10 }]}>
              <Button title="Close" onPress={() => setInfoModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f2f6ff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#1e3a8a' },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 14,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dateText: { fontWeight: 'bold', color: '#1d4ed8', fontSize: 16 },
  text: { marginBottom: 2, color: '#374151' },
  status: { marginTop: 6, fontWeight: 'bold', fontSize: 14 },
  pending: { color: '#f59e0b' },
  accepted: { color: '#10b981' },
  actions: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  cancelBtn: { backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 },
  rescheduleBtn: { backgroundColor: '#fbbf24', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalInput: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 12, textAlignVertical: 'top', minHeight: 60 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  selector: { padding: 12, backgroundColor: '#e2e8f0', borderRadius: 6, marginBottom: 10 },
});
