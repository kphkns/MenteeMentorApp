import React from 'react';
import {
  View, Text, FlatList,
  TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons
} from '@expo/vector-icons';

const academicItems = [
  {
    id: '1',
    name: 'Appoinment Requests',
    icon: <Ionicons name="calendar-outline" size={26} color="#007bff" />
  },
  {
    id: '2',
    name: 'Appointment History',
    icon: <MaterialCommunityIcons name="history" size={26} color="#7b61ff" />
  },
  // {
  //   id: '3',
  //   name: 'Appointment History',
  //   icon: <MaterialCommunityIcons name="history" size={24} color="#ff8c00" />
  // }
];

export default function AcademicThings({ navigation }) {
  const handleSelect = (item) => {
    switch (item.id) {
      case '1':
        navigation.navigate('FacultyAppointlist');
        break;
      case '2':
        navigation.navigate('FacultyHistoryScreen');
        break;
      // case '3':
      //   navigation.navigate('AppointmentHistory');
      //   break;
      default:
        console.log(`Unhandled item: ${item.name}`);
    }
  };

  const renderItem = ({ item }) => (
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
        <Text style={styles.title}>Faculty Appointments</Text>
        <Text style={styles.subtitle}>Book and track your appointments</Text>
      </View>
      <FlatList
        data={academicItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#e6f0ff',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
