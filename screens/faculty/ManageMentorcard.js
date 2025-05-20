import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FacultyStudentsScreen() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://192.168.65.136:5000/students/by-faculty', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStudents(data);
        setFilteredStudents(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch students.');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (s) =>
          s.Name.toLowerCase().includes(text.toLowerCase()) ||
          s.Roll_no.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => navigation.navigate('StudentDetailsScreen', { student: item })}
    >
      <Image
        source={
          item.photo
            ? { uri: `http://192.168.65.136:5000/uploads/${item.photo}` }
            : require('../../assets/default-profile.png')
        }
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.Name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={15} color="#666" style={styles.icon} />
          <Text style={styles.subInfo}>Roll No: {item.Roll_no}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={15} color="#666" style={styles.icon} />
          <Text style={styles.subInfo}>{item.Email}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward-outline" size={22} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Students</Text>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name or roll no"
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading students...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={
            filteredStudents.length === 0 ? styles.emptyContainer : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No students found.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007bff']}
              tintColor="#007bff"
            />
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 18,
    paddingBottom: 12,
    color: '#1e293b',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#eee',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  icon: {
    marginRight: 5,
  },
  subInfo: {
    fontSize: 13.5,
    color: '#555',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrapper: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  loaderWrapper: {
    marginTop: 60,
    alignItems: 'center',
  },
});
