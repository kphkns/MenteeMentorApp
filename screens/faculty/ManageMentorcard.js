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
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FacultyStudentsScreen() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigation = useNavigation();
  const scrollY = new Animated.Value(0);

  // Helper to sort students by Name (case-insensitive)
  const sortStudentsByName = (arr) =>
    arr.slice().sort((a, b) =>
      a.Name.toLowerCase().localeCompare(b.Name.toLowerCase())
    );

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://192.168.158.136:5000/students/by-faculty', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const sorted = sortStudentsByName(data);
        setStudents(sorted);
        setFilteredStudents(sorted);
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
      // Sort filtered results as well
      setFilteredStudents(sortStudentsByName(filtered));
    }
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('StudentDetailsScreen', { student: item })}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            item.photo
              ? { uri: `http://192.168.158.136:5000/uploads/${item.photo}` }
              : require('../../assets/default-profile.png')
          }
          style={styles.avatar}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)']}
          style={styles.avatarOverlay}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>{item.Name}</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="fingerprint" size={16} color="#6366f1" style={styles.icon} />
          <Text style={styles.subInfo}>{item.Roll_no}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="class" size={16} color="#6366f1" style={styles.icon} />
          <Text style={styles.subInfo}>{item.Email}</Text>
        </View>
         
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#c7d2fe" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#6366f1', '#818cf8']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Animated.View style={{ opacity: headerOpacity }}>
            <Text style={styles.title}>My Students</Text>
            <Text style={styles.subtitle}>Manage and connect with your students</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View> */}

      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={searchFocused ? "#6366f1" : "#94a3b8"} 
            style={styles.searchIcon} 
          />
          <TextInput
            placeholder="Search students..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading students...</Text>
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
              <Ionicons name="people-outline" size={60} color="#c7d2fe" />
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
    
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchBarFocused: {
    borderColor: '#6366f1',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  avatarOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  subInfo: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  arrowContainer: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyWrapper: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
});
