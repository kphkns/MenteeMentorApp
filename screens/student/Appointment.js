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
    name: 'Book Appointment',
    icon: <Ionicons name="calendar-outline" size={28} color="#007bff" />
  },
  {
    id: '2',
    name: 'Appointments Status',
    icon: <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#6f42c1" />
  },
  {
    id: '3',
    name: 'Appointment History',
    icon: <MaterialCommunityIcons name="history" size={28} color="#20c997" />
  }
];

export default function AcademicThings({ navigation }) {
  const handleSelect = (item) => {
    switch (item.id) {
      case '1':
        navigation.navigate('StudentAppointments');
        break;
      case '2':
        navigation.navigate('StudentAppointmentslist');
        break;
      case '3':
        navigation.navigate('AppointmentHistory');
        break;
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
      <View style={{ flex: 1 }}>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Academic Services</Text>
        <Text style={styles.subtitle}>Manage appointments with your mentor</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
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
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
