import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, SafeAreaView, Platform
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons,
  FontAwesome5, Feather
} from '@expo/vector-icons';

const admins = [
  {
    id: '1',
    name: 'DEPARTMENT',
    description: 'Manage academic departments and their details',
    icon: <Ionicons name="business-outline" size={24} color="#4F46E5" />,
    color: '#EEF2FF'
  },
  {
    id: '2',
    name: 'PROGRAMME',
    description: 'Configure and update programme information',
    icon: <MaterialCommunityIcons name="file-document-outline" size={24} color="#9333EA" />,
    color: '#F5F3FF'
  },
  {
    id: '4',
    name: 'BATCHS',
    description: 'Oversee and edit batch schedules',
    icon: <MaterialCommunityIcons name="calendar-range" size={24} color="#10B981" />,
    color: '#ECFDF5'
  },
  {
    id: '3',
    name: 'FACULTY',
    description: 'Add or update faculty member records',
    icon: <MaterialCommunityIcons name="account-tie-outline" size={24} color="#FF6F3C" />,
    color: '#FFF7ED'
  },
  {
    id: '5',
    name: 'STUDENTS',
    description: 'Manage student profiles and enrollment',
    icon: <FontAwesome5 name="user-graduate" size={22} color="#E33FB1" />,
    color: '#FDF2F8'
  },
  {
    id: '6',
    name: 'SESSION MANAGEMENT',
    description: 'Organize and control academic sessions',
    icon: <FontAwesome5 name="user-graduate" size={22} color="#2563EB" />,
    color: '#DBEAFE'
  }
];

export default function AdminManagement({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (admin) => {
    navigation.navigate(admin.name); // Ensure screen names match exactly
  };

  const renderAdmin = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleSelect(item)}
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
        {item.icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#D1D5DB" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Admin Management</Text>
        <Text style={styles.subtitle}>Manage academic sections</Text>
      </View> */}

      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search modules..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
        </View>

        <FlatList
          data={filteredAdmins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdmin}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: '#f2f6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  listContent: {
    paddingBottom: 24,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  itemDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  chevron: {
    marginLeft: 8,
  },
});
