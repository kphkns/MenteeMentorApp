import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const API_URL = 'http://192.168.65.136:5000';

export default function AppointmentHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    return appointments.filter(app => {
      const isHistory = ['cancelled', 'completed'].includes(app.status);
      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      const matchesDate = selectedDate
        ? new Date(app.date).toDateString() === new Date(selectedDate).toDateString()
        : true;
      return isHistory && matchesStatus && matchesDate;
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.date}>{new Date(item.date).toDateString()}</Text>
      <Text>⏰ Time: {item.time}</Text>
      <Text>📍 Location: {item.location}</Text>
      <Text>Status: <Text style={{ fontWeight: 'bold' }}>{item.status}</Text></Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕓 Appointment History</Text>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={filterStatus}
          style={styles.picker}
          onValueChange={setFilterStatus}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Cancelled" value="cancelled" />
          <Picker.Item label="Completed" value="completed" />
        </Picker>

        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text>{selectedDate ? new Date(selectedDate).toDateString() : 'Filter by Date'}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={date => { setSelectedDate(date); setShowDatePicker(false); }}
          onCancel={() => setShowDatePicker(false)}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={filterAppointments()}
          keyExtractor={item => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No history records found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  picker: {
    width: 150,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  dateBtn: {
    backgroundColor: '#e2e8f0',
    padding: 10,
    borderRadius: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  date: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
