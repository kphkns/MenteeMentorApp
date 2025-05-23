import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert, ScrollView, 
  TouchableOpacity, StyleSheet, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          {/* <Ionicons name="chevron-back" size={24} color="#4A6FA5" /> */}
        </TouchableOpacity>
      <Text style={styles.heading}>Schedule Appointment</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <Text style={styles.selectorText}>{date.toDateString()}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Time</Text>
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.selectorText}>{formatTime12Hour(date)}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="timer" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Meeting Mode</Text>
          <View style={[styles.inputContainer, styles.pickerContainer]}>
            <Ionicons 
              name={meetingMode === 'online' ? "videocam" : "business"} 
              size={20} 
              color="#6B7280" 
            />
            <Picker 
              selectedValue={meetingMode} 
              onValueChange={setMeetingMode}
              style={styles.picker}
              dropdownIconColor="#6B7280"
            >
              <Picker.Item label="Online Meeting" value="online" />
              <Picker.Item label="In-Person (Office)" value="offline" />
            </Picker>
          </View>
        </View>

        {meetingMode === 'online' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Meeting Link</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="link" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="https://zoom.us/j/123456"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Message</Text>
          <View style={styles.textareaContainer}>
            <TextInput
              style={styles.textarea}
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Any special requests or information for your mentor..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={onBookAppointment}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Confirm Appointment</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        minimumDate={new Date()}
        date={date}
        onConfirm={handleDateChange}
        onCancel={() => setShowDatePicker(false)}
        accentColor="#4A6FA5"
        buttonTextColorIOS="#4A6FA5"
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={date}
        onConfirm={handleTimeChange}
        onCancel={() => setShowTimePicker(false)}
        accentColor="#4A6FA5"
        buttonTextColorIOS="#4A6FA5"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f2f6ff',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 65,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  pickerContainer: {
    paddingHorizontal: 0,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  textareaContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textarea: {
    height: 100,
    padding: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A6FA5',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});