import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert, ScrollView,
  TouchableOpacity, StyleSheet, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';

export default function StudentAppointmentScreen({ navigation }) {
  const [studentId, setStudentId] = useState(null);
  const [facultyId, setFacultyId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('30');
  const [meetingMode, setMeetingMode] = useState('online');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);

  const API_URL = 'http://192.168.65.136:5000';

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/appointments/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentId(res.data.studentId);
      setFacultyId(res.data.facultyId);

      const appointments = await axios.get(`${API_URL}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const hasActive = appointments.data.some(app =>
        ['pending', 'accepted'].includes(app.status)
      );
      setHasActiveAppointment(hasActive);
    })();
  }, []);

  const handleDateChange = (selected) => {
    setDate(selected);
    setShowDatePicker(false);
  };

  const handleTimeChange = (selected) => {
    const newDate = new Date(date);
    newDate.setHours(selected.getHours(), selected.getMinutes());
    setDate(newDate);
    setShowTimePicker(false);
  };

  const formatTime12Hour = (dateObj) => {
    return dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const onBookAppointment = async () => {
    const now = new Date();
    if (date < now) {
      Alert.alert('Invalid Time', 'You cannot select a past date or time.');
      return;
    }

    if (hasActiveAppointment) {
      Alert.alert('Limit Reached', 'You already have an active appointment. Please cancel or wait until it is completed.');
      return;
    }

    if (!facultyId || !duration || (meetingMode === 'online' && !location)) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');

      const formattedDate = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}:00`;

      const payload = {
        faculty_id: facultyId,
        date: formattedDate,
        time: formattedTime,
        duration: parseInt(duration),
        meeting_mode: meetingMode,
        location: meetingMode === 'online' ? location : 'Office Room',
        message,
      };

      await axios.post(`${API_URL}/api/appointments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('✅ Success', 'Appointment booked!');
      navigation.goBack();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Booking failed. Please try again.';

      if (status === 409) {
        Alert.alert('⏰ Slot Unavailable', message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>📅 Book an Appointment</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toDateString()}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          minimumDate={new Date()}
          date={date}
          onConfirm={handleDateChange}
          onCancel={() => setShowDatePicker(false)}
        />

        <Text style={styles.label}>Select Time</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
          <Text>{formatTime12Hour(date)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          date={date}
          onConfirm={handleTimeChange}
          onCancel={() => setShowTimePicker(false)}
        />

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 30"
        />

        <Text style={styles.label}>Meeting Mode</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={meetingMode} onValueChange={setMeetingMode} mode="dropdown">
            <Picker.Item label="Online" value="online" />
            <Picker.Item label="Offline (Office Room)" value="offline" />
          </Picker>
        </View>

        {meetingMode === 'online' && (
          <>
            <Text style={styles.label}>Zoom/Meet Link</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter video call link"
            />
          </>
        )}

        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={styles.textarea}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Add any details for the mentor..."
        />

        <TouchableOpacity style={styles.button} onPress={onBookAppointment}>
          <Text style={styles.buttonText}>📌 Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#f1f5f9',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  label: {
    marginTop: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  selector: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  button: {
    backgroundColor: '#2563eb',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
