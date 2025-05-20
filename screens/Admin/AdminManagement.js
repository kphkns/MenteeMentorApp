import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons,
  FontAwesome5, Feather
} from '@expo/vector-icons';

const admins = [
  {
    id: '1',
    name: 'DEPARTMENT',
    icon: <Ionicons name="business-outline" size={24} color="#0057ff" />
  },
  {
    id: '2',
    name: 'PROGRAMME',
    icon: <MaterialCommunityIcons name="file-document-outline" size={24} color="#7b61ff" />
  },
  {
    id: '4',
    name: 'BATCHS',
    icon: <MaterialCommunityIcons name="calendar-range" size={24} color="#00bf72" />
  },
  {
    id: '3',
    name: 'FACULTY',
    icon: <MaterialCommunityIcons name="account-tie-outline" size={24} color="#ff6f3c" />
  },
  {
    id: '5',
    name: 'STUDENTS',
    icon: <FontAwesome5 name="user-graduate" size={22} color="#e33fb1" />
  },

   {
    id: '6',
    name: 'SESSION MANAGEMENT',
    icon: <FontAwesome5 name="user-graduate" size={22} color="#e33fb1" />
  }
];

export default function AdminManagement({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (admin) => {
    navigation.navigate(admin.name); // Make sure screen names match these exactly
  };

  const renderAdmin = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleSelect(item)}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrapper}>{item.icon}</View>
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Management</Text>
        <Text style={styles.subtitle}>Manage academic sections</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search modules..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filteredAdmins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdmin}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f6ff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#003366',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  container: {
    paddingHorizontal: 20,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#e6f0ff',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
});
