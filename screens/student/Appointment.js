import React from 'react';
import {
  View, 
  Text, 
  FlatList,
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Platform
} from 'react-native';
import {
  Ionicons, 
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';

const academicItems = [
  {
    id: '1',
    name: 'Book Appointment',
    description: 'Schedule a new meeting with your mentor',
    icon: <MaterialCommunityIcons name="calendar-plus" size={26} color="#4F46E5" />,
    color: '#EEF2FF'
  },
  {
    id: '2',
    name: 'Appointments Status',
    description: 'View your pending and upcoming appointments',
    icon: <MaterialIcons name="pending-actions" size={26} color="#9333EA" />,
    color: '#F5F3FF'
  },
  {
    id: '3',
    name: 'Appointment History',
    description: 'Review your completed and cancelled meetings',
    icon: <MaterialCommunityIcons name="history" size={26} color="#10B981" />,
    color: '#ECFDF5'
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
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
        {item.icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={22} 
        color="#D1D5DB" 
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Academic Services</Text>
        <Text style={styles.subtitle}>Manage your mentorship appointments</Text>
      </View> */}
      
      <FlatList
        data={academicItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
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
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
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