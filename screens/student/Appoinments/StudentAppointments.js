import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert, TouchableOpacity,
  StyleSheet, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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

  const API_URL = 'http://192.168.84.136:5000';

  useEffect(() => {
    const init = async () => {
      try {
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
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch user data or appointments.');
      }
    };

    init();
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
      hour12: true,
    });
  };

  const onBookAppointment = async () => {
    const now = new Date();

    if (!facultyId || !studentId) {
      Alert.alert('Error', 'Student or faculty not found.');
      return;
    }

    if (date < now) {
      Alert.alert('Invalid Time', 'You cannot select a past date or time.');
      return;
    }

    if (!duration || isNaN(duration) || parseInt(duration) <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration.');
      return;
    }

    if (hasActiveAppointment) {
      Alert.alert(
        'Limit Reached',
        'You already have an active appointment. Please cancel or wait until it is completed.'
      );
      return;
    }

    if (meetingMode === 'online' && !location.trim()) {
      Alert.alert('Missing Link', 'Please provide an online meeting link.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toTimeString().split(' ')[0];

      const payload = {
        faculty_id: facultyId,
        date: formattedDate,
        time: formattedTime,
        duration: parseInt(duration),
        meeting_mode: meetingMode,
        location: meetingMode === 'online' ? location : 'Office Room',
        message: message.trim(),
      };

      await axios.post(`${API_URL}/api/appointments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('✅ Success', 'Appointment booked!');
      navigation.goBack();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';

      if (status === 409) {
        Alert.alert('⏰ Slot Unavailable', msg);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>📅 Book Appointment</Text>
      <View style={styles.card}>
        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.selectorText}>{date.toDateString()}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          minimumDate={new Date()}
          date={date}
          onConfirm={handleDateChange}
          onCancel={() => setShowDatePicker(false)}
        />

        {/* Time */}
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.selectorText}>{formatTime12Hour(date)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          date={date}
          onConfirm={handleTimeChange}
          onCancel={() => setShowTimePicker(false)}
        />

        {/* Duration */}
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 30"
        />

        {/* Meeting Mode */}
        <Text style={styles.label}>Meeting Mode</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={meetingMode} onValueChange={setMeetingMode}>
            <Picker.Item label="Online" value="online" />
            <Picker.Item label="Offline (Office Room)" value="offline" />
          </Picker>
        </View>

        {/* Location */}
        {meetingMode === 'online' && (
          <>
            <Text style={styles.label}>Zoom/Meet Link</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter meeting link"
            />
          </>
        )}

        {/* Message */}
        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={styles.textarea}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Write a note for the mentor..."
        />

        <TouchableOpacity style={styles.button} onPress={onBookAppointment}>
          <Text style={styles.buttonText}>📌 Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f6ff',
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 16,
    fontSize: 16,
  },
  selector: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  selectorText: {
    fontSize: 16,
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 10,
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  textarea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    borderRadius: 10,
    textAlignVertical: 'top',
    minHeight: 100,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
