import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [highPoints, setHighPoints] = useState('');
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);

  // Theme colors
  const colors = {
    primary: '#6366f1',
    secondary: '#818cf8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    background: '#f8faff',
    card: '#ffffff',
    text: '#1a1d2e',
    subtitle: '#6b7280',
    border: '#e5e7eb',
    placeholder: '#9ca3af',
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
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
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const confirmAccept = (id) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Confirmation', 'Accept this appointment?', [
      { 
        text: 'No',
        onPress: () => Haptics.selectionAsync(),
        style: 'cancel' 
      },
      { 
        text: 'Yes', 
        onPress: () => updateStatus(id, 'accepted'),
        style: 'default'
      }
    ]);
  };

  const openCancelModal = (appointment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAppointment(appointment);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCancelModalVisible(false);
      fetchAppointments();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', `Failed to update appointment to ${status}`);
    }
  };

  const markAsCompleted = async (appointment) => {
    try {
      // Parse the date and time from the appointment object
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.time.split(':');
      
      // Set the time components (handles timezone issues)
      appointmentDate.setHours(parseInt(hours, 10));
      appointmentDate.setMinutes(parseInt(minutes, 10));
      appointmentDate.setSeconds(0);
      
      // Calculate end time
      const endDateTime = new Date(appointmentDate.getTime() + appointment.duration * 60000);
      const now = new Date();

      if (now < endDateTime) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        const options = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        
        Alert.alert(
          'Too Early', 
          `You can only mark this as completed after ${endDateTime.toLocaleString('en-US', options)}`
        );
        return;
      }

      // Store the appointment and show the high points modal
      setAppointmentToComplete(appointment);
      setHighPoints('');
      setCompleteModalVisible(true);

    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to mark appointment as completed';
      Alert.alert('Error', errorMessage);
    }
  };

  const submitCompletion = async () => {
    if (!highPoints.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Validation', 'Please enter key points from the session');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.patch(
        `${API_URL}/api/faculty/appointments/${appointmentToComplete.appointment_id}/complete`,
        { high_points: highPoints },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCompleteModalVisible(false);
        fetchAppointments();
      } else {
        throw new Error('Failed to mark as completed');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to complete appointment';
      Alert.alert('Error', errorMessage);
    }
  };

  const markAsFailed = (appointment) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Confirm',
      'Mark this appointment as failed (student did not come)?',
      [
        { 
          text: 'No',
          onPress: () => Haptics.selectionAsync(),
          style: 'cancel' 
        },
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchAppointments();
            } catch (err) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              const message = err.response?.data?.message || 'Failed to mark as failed';
              Alert.alert('Error', message);
            }
          } 
        }
      ]
    );
  };

  const openReschedule = (appointment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Validation', 'Please enter a reason for rescheduling.');
      return;
    }

    // Combine date and time properly
    const year = rescheduleDate.getFullYear();
    const month = String(rescheduleDate.getMonth() + 1).padStart(2, '0');
    const day = String(rescheduleDate.getDate()).padStart(2, '0');
    
    const hours = String(rescheduleTime.getHours()).padStart(2, '0');
    const minutes = String(rescheduleTime.getMinutes()).padStart(2, '0');

    const newDate = `${year}-${month}-${day}`;
    const newTime = `${hours}:${minutes}:00`;

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/api/faculty/appointments/${selectedAppointment.appointment_id}/reschedule`,
        {
          date: newDate,
          time: newTime,
          reschedule_reason: rescheduleReason
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRescheduleModalVisible(false);
      fetchAppointments();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return colors.warning;
      case 'accepted': return colors.success;
      case 'completed': return colors.primary;
      case 'cancelled': return colors.danger;
      default: return colors.subtitle;
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status) }]}>
      <View style={styles.cardHeader}>
        <MaterialIcons 
          name="event" 
          size={20} 
          color={colors.primary} 
          style={styles.cardIcon}
        />
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
        <View style={styles.timeBadge}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#fff" />
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="user" size={16} color={colors.subtitle} />
          <Text style={styles.infoText}>{item.student_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons 
            name={item.meeting_mode === 'online' ? 'video-outline' : 'map-marker-outline'} 
            size={16} 
            color={colors.subtitle} 
          />
          <Text style={styles.infoText}>
            {item.meeting_mode === 'online' ? 'Virtual Meeting' : item.location}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="hourglass-bottom" size={16} color={colors.subtitle} />
          <Text style={styles.infoText}>{item.duration} minutes</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => confirmAccept(item.appointment_id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => openReschedule(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Reschedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => openCancelModal(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => markAsCompleted(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.failButton]}
            onPress={() => markAsFailed(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>No Show</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointment Requests</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="calendar" size={40} color={colors.subtitle} />
              <Text style={styles.emptyText}>No appointments scheduled</Text>
              <Text style={styles.emptySubtext}>You'll see new requests here</Text>
            </View>
          }
        />
      )}

      {/* Cancel Modal */}
      <Modal 
        visible={cancelModalVisible} 
        transparent 
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline Appointment</Text>
              <Text style={styles.modalSubtitle}>Please provide a reason for declining</Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for declining..."
              placeholderTextColor={colors.placeholder}
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCancelModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={submitCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal 
        visible={rescheduleModalVisible} 
        transparent 
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <Text style={styles.modalSubtitle}>Select new date and time</Text>
            </View>
            
            <Text style={styles.inputLabel}>New Date</Text>
            <TouchableOpacity 
              style={styles.dateTimeSelector}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Feather name="calendar" size={18} color={colors.primary} />
              <Text style={styles.dateTimeText}>
                {rescheduleDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={rescheduleDate}
              onConfirm={(d) => { 
                Haptics.selectionAsync();
                setRescheduleDate(d); 
                setShowDatePicker(false); 
              }}
              onCancel={() => {
                Haptics.selectionAsync();
                setShowDatePicker(false);
              }}
              buttonTextColorIOS={colors.primary}
            />

            <Text style={styles.inputLabel}>New Time</Text>
            <TouchableOpacity 
              style={styles.dateTimeSelector}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Feather name="clock" size={18} color={colors.primary} />
              <Text style={styles.dateTimeText}>
                {rescheduleTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Text>
            </TouchableOpacity>
            
            <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              date={rescheduleTime}
              onConfirm={(t) => { 
                Haptics.selectionAsync();
                setRescheduleTime(t); 
                setShowTimePicker(false); 
              }}
              onCancel={() => {
                Haptics.selectionAsync();
                setShowTimePicker(false);
              }}
              buttonTextColorIOS={colors.primary}
            />

            <Text style={styles.inputLabel}>Reason for Rescheduling</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Explain why you need to reschedule..."
              placeholderTextColor={colors.placeholder}
              multiline
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setRescheduleModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={submitReschedule}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Appointment Modal */}
      <Modal 
        visible={completeModalVisible} 
        transparent 
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Summary</Text>
              <Text style={styles.modalSubtitle}>Please enter key points from your meeting</Text>
            </View>
            
            <TextInput
              style={[styles.modalInput, { height: 150 }]}
              placeholder="Key discussion points, outcomes, action items..."
              placeholderTextColor={colors.placeholder}
              multiline
              value={highPoints}
              onChangeText={setHighPoints}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCompleteModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={submitCompletion}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1d2e',
  },
  refreshButton: {
    padding: 8,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1d2e',
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  cardBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rescheduleButton: {
    backgroundColor: '#f59e0b',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  completeButton: {
    backgroundColor: '#6366f1',
    flex: 1,
    marginRight: 6,
  },
  failButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    marginLeft: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1d2e',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1a1d2e',
    marginLeft: 10,
    flex: 1,
  },
  modalInput: {
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1d2e',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  submitModalButton: {
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});