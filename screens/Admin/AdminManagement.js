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
  }
  
];

export default function AdminManagement({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (admin) => {
    navigation.navigate(admin.name); // 👈 Navigate by screen name
  };

  const renderAdmin = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <View style={styles.iconWrapper}>
        {item.icon}
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filteredAdmins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdmin}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e6f3ff' },
  container: { padding: 20 },
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
  },
  itemContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
});
