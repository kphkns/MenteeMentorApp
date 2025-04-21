import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

export default function AdminManagement() {
  const [search, setSearch] = useState('');
  const [admins, setAdmins] = useState([
    { id: '1', name: 'Ravi Kumar', email: 'ravi@college.edu' },
    { id: '2', name: 'Anita Sharma', email: 'anita@college.edu' },
    { id: '3', name: 'Sunil Mehta', email: 'sunil@college.edu' },
  ]);

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (admin) => {
    Alert.alert('Edit', `Edit admin: ${admin.name}`);
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => setAdmins(prev => prev.filter(admin => admin.id !== id))
      }
    ]);
  };

  const renderAdmin = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
          <FontAwesome name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
          <Ionicons name="trash-bin-outline" size={22} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Management</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search admin..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredAdmins}
        keyExtractor={(item) => item.id}
        renderItem={renderAdmin}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    color: '#007bff',
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  iconBtn: {
    marginLeft: 15,
  },
});
