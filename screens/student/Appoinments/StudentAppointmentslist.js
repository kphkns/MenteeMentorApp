import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const API_URL = "http://192.168.158.136:5000";
const IST_OFFSET = 330; // IST offset in minutes

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export default function StudentAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoData, setInfoData] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = res.data.filter(
        (app) => app.status === "pending" || app.status === "accepted"
      );
      setAppointments(filtered);
    } catch {
      Alert.alert("Error", "Unable to load appointments.");
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
    if (appointment.status === "pending") {
      Alert.alert(
        "Confirm",
        "Do you want to delete this pending appointment?",
        [
          { text: "No" },
          {
            text: "Yes",
            onPress: async () => {
              try {
                const token = await AsyncStorage.getItem("authToken");
                await axios.delete(
                  `${API_URL}/api/appointments/${appointment.appointment_id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                Alert.alert("Deleted", "Appointment deleted successfully.");
                fetchAppointments();
              } catch {
                Alert.alert("Error", "Failed to delete appointment.");
              }
            },
          },
        ]
      );
    } else if (appointment.status === "accepted") {
      setSelectedAppointment(appointment);
      setCancelReason("");
      setCancelModalVisible(true);
    }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Validation", "Please enter a cancellation reason.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
      await axios.patch(
        `${API_URL}/api/appointments/${selectedAppointment.appointment_id}/cancel`,
        { cancel_reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Cancelled", "Appointment cancelled successfully.");
      setCancelModalVisible(false);
      fetchAppointments();
    } catch {
      Alert.alert("Error", "Failed to cancel appointment.");
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleData(appointment);
    const date = new Date(appointment.date);
    const [h, m] = appointment.time.split(":");
    date.setHours(parseInt(h), parseInt(m));
    setRescheduleDate(date);
    setRescheduleTime(date);
    setRescheduleReason("");
    setRescheduleModalVisible(true);
  };

  // ----------- Robust Past Date/Time Prevention -----------
  const submitReschedule = async () => {
    if (!rescheduleReason.trim()) {
      Alert.alert("Validation", "Please enter a reason for rescheduling.");
      return;
    }

    // Combine date and time for validation
    const selectedDateTime = new Date(rescheduleDate);
    selectedDateTime.setHours(rescheduleTime.getHours());
    selectedDateTime.setMinutes(rescheduleTime.getMinutes());
    const now = new Date();

    if (selectedDateTime <= now) {
      Alert.alert("Invalid Time", "You cannot select a past date or time.");
      return;
    }

    const newDateStr =
      selectedDateTime.getFullYear() +
      "-" +
      String(selectedDateTime.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(selectedDateTime.getDate()).padStart(2, "0");

    const newTimeStr =
      selectedDateTime.getHours().toString().padStart(2, "0") +
      ":" +
      selectedDateTime.getMinutes().toString().padStart(2, "0");

    if (
      rescheduleData.date === newDateStr &&
      rescheduleData.time === newTimeStr
    ) {
      Alert.alert(
        "No Changes",
        "Date or time must be different to reschedule."
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
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
      Alert.alert("Success", "Appointment rescheduled.");
      setRescheduleModalVisible(false);
      fetchAppointments();
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to reschedule."
      );
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(":");
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const showInfo = (appointment) => {
    setInfoData(appointment);
    setInfoModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              item.status === "pending"
                ? styles.pendingStatus
                : styles.acceptedStatus,
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => showInfo(item)}
          style={styles.infoButton}
        >
          <Feather name="info" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={18} color="#4F46E5" />
          <Text style={styles.detailText}>{item.faculty_name}</Text>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text style={styles.timeText}>
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.timeBlock}>
            <Ionicons name="time" size={16} color="#64748B" />
            <Text style={styles.timeText}>{formatTime(item.time)}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Ionicons name="timer" size={16} color="#64748B" />
            <Text style={styles.timeText}>{item.duration} min</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name={item.meeting_mode === "online" ? "videocam" : "business"}
            size={16}
            color="#64748B"
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.meeting_mode === "online" ? "Virtual Meeting" : "Office"} •{" "}
            {item.location}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => cancelAppointment(item)}
        >
          <Text style={styles.actionButtonText}>Cancel</Text>
        </TouchableOpacity>

        {item.status === "pending" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => openRescheduleModal(item)}
          >
            <Text style={styles.actionButtonText}>Reschedule</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSubtitle}>
          Manage your scheduled meetings
        </Text>
      </View> */}

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.appointment_id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No appointments scheduled</Text>
            <Text style={styles.emptySubtext}>
              Your upcoming appointments will appear here
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Appointment</Text>
            <Text style={styles.modalDescription}>
              Please let us know why you're cancelling this appointment
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for cancellation..."
              placeholderTextColor="#94A3B8"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={submitCancel}
              >
                <Text style={styles.primaryButtonText}>
                  Confirm Cancellation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModalVisible} transparent animationType="fade">
        <ScrollView
          contentContainerStyle={styles.modalOverlay}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalDescription}>
              Select new date and time for your appointment
            </Text>

            <View style={styles.rescheduleFields}>
              <Text style={styles.fieldLabel}>New Date</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#4F46E5" />
                <Text style={styles.dateTimeText}>
                  {rescheduleDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>New Time</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#4F46E5" />
                <Text style={styles.dateTimeText}>
                  {rescheduleTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Reason for Rescheduling</Text>
              <TextInput
                style={[styles.modalInput, styles.rescheduleInput]}
                placeholder="Briefly explain why you're rescheduling..."
                placeholderTextColor="#94A3B8"
                multiline
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={submitReschedule}
              >
                <Text style={styles.primaryButtonText}>Confirm Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Appointment Details</Text>

            {infoData && (
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={18} color="#4F46E5" />
                  <Text style={styles.infoText}>
                    {infoData.message || "No additional message provided"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#4F46E5" />
                  <Text style={styles.infoText}>
                    {infoData.meeting_mode === "online"
                      ? "Virtual"
                      : "In-Person"}{" "}
                    • {infoData.location}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color="#4F46E5" />
                  <Text style={styles.infoText}>
                    Created: {new Date(infoData.created_at).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="refresh" size={18} color="#4F46E5" />
                  <Text style={styles.infoText}>
                    Updated: {new Date(infoData.updated_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.primaryButton,
                { marginTop: 16 },
              ]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={rescheduleDate}
        minimumDate={new Date()} // Prevent selecting past dates
        onConfirm={(date) => {
          setRescheduleDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        accentColor="#4F46E5"
        buttonTextColorIOS="#4F46E5"
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={rescheduleTime}
        onConfirm={(time) => {
          // Combine with selected date to validate against current time
          const selectedDateTime = new Date(rescheduleDate);
          selectedDateTime.setHours(time.getHours());
          selectedDateTime.setMinutes(time.getMinutes());

          if (selectedDateTime <= new Date()) {
            Alert.alert("Invalid Time", "You cannot select a past time.");
            return;
          }

          setRescheduleTime(time);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
        accentColor="#4F46E5"
        buttonTextColorIOS="#4F46E5"
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={rescheduleTime}
        onConfirm={(time) => {
          const newTime = new Date(time);
          const selectedDate = new Date(rescheduleDate);
          selectedDate.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
          const now = new Date();
          if (isSameDay(selectedDate, now) && selectedDate <= now) {
            Alert.alert("Invalid Time", "Cannot select a past time for today.");
            return;
          }
          setRescheduleTime(selectedDate);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
        accentColor="#4F46E5"
        buttonTextColorIOS="#4F46E5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6ff",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#f2f6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pendingStatus: {
    color: "#F59E0B",
  },
  acceptedStatus: {
    color: "#10B981",
  },
  infoButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    flexShrink: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#FEE2E2",
    marginRight: 8,
  },
  rescheduleButton: {
    backgroundColor: "#E0E7FF",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#DC2626",
  },
  rescheduleButtonText: {
    color: "#4F46E5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  rescheduleInput: {
    minHeight: 80,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  dateTimeText: {
    fontSize: 14,
    color: "#1E293B",
    marginLeft: 10,
  },
  rescheduleFields: {
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#4F46E5",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#64748B",
    fontWeight: "600",
  },
  infoContent: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#64748B",
    marginLeft: 10,
    lineHeight: 20,
  },
});
