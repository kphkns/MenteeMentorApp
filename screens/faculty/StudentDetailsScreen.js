import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function StudentDetailsScreen({ route }) {
  const { student } = route.params;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `http://192.168.65.136:5000/uploads/${student.photo}` }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{student.Name}</Text>
      <Text style={styles.info}>Roll No: {student.Roll_no}</Text>
      <Text style={styles.info}>Email: {student.Email}</Text>
      <Text style={styles.info}>Mobile: {student.mobile_no}</Text>
      <Text style={styles.info}>Batch: {student.Batch}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginTop: 5,
  },
});
