// FacultyListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';

const SERVER_URL = 'http://192.168.225.136:5000'; // Replace with your server IP

export default function FacultyListScreen() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${SERVER_URL}/admin/faculty`)
      .then((res) => {
        setFaculties(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const renderFacultyItem = ({ item }) => (
    <View style={styles.facultyItem}>
      <Text style={styles.facultyText}>Name: {item.Name}</Text>
      <Text style={styles.facultyText}>Email: {item.Email}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={faculties}
          renderItem={renderFacultyItem}
          keyExtractor={(item) => item.Faculty_id.toString()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  facultyItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  facultyText: {
    fontSize: 16,
    color: '#212529',
  },
});
