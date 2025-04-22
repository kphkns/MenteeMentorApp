import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DepartmentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Department Management</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});
