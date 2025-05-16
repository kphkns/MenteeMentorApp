import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.65.136:5000';

export default function FacultyHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/faculty/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.dateText}>
        📅 {new Date(item.date).toDateString()} ⏰ {formatTime(item.time)}
      </Text>
      <Text>👨‍🎓 Student: {item.student_name}</Text>
      <Text>Status: <Text style={{ fontWeight: 'bold' }}>{item.status}</Text></Text>
      {item.status === 'cancelled' && (
        <>
          <Text>❌ Cancelled By: {item.cancelled_by}</Text>
          <Text>📝 Reason: {item.cancel_reason}</Text>
        </>
      )}
      {item.status === 'completed' && (
        <Text>✅ Completed Appointment</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📜 Appointment History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No history available.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 10, elevation: 2 },
  dateText: { fontWeight: '700', marginBottom: 6, color: '#1e40af' },
  empty: { textAlign: 'center', marginTop: 20, color: '#64748b' },
});
