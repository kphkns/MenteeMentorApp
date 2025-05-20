import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput,
  TouchableOpacity, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.134.136:5000';

export default function AdminProfile({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState('');
  const [isEditingMobile, setIsEditingMobile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${SERVER_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile);
      setMobile(res.data.profile.mobile_no || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append('photo', {
        uri: result.assets[0].uri,
        name: 'admin.jpg',
        type: 'image/jpeg',
      });

      const token = await AsyncStorage.getItem('authToken');
      try {
        await axios.post(`${SERVER_URL}/admin/upload-photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        fetchProfile();
      } catch (err) {
        Alert.alert('Error', 'Could not upload photo');
      }
    }
  };

  const updateMobile = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      const response = await axios.put(`${SERVER_URL}/admin/update-mobile`, {
        mobile_no: mobile,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      Alert.alert('Success', response.data.message);
      setIsEditingMobile(false);
      fetchProfile();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update mobile number');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            navigation.replace('Login');
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.imageWrapper}>
          <Image
            source={
              profile.photo
                ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
                : require('../../assets/default-profile.png')
            }
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraIcon} onPress={handleImagePick}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View>
          <Text style={styles.name}>{profile.Name}</Text>
          <Text style={styles.login}>
            Last Login: {profile.Last_login ? new Date(profile.Last_login).toDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoItem
          label="EMAIL"
          value={profile.Email || 'N/A'}
          icon={<Ionicons name="mail-outline" size={18} color="#333" />}
        />

        <View style={styles.infoItem}>
          <View style={styles.iconWrapper}>
            <Ionicons name="call-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>CONTACT</Text>
            {isEditingMobile ? (
              <>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                />
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <TouchableOpacity onPress={updateMobile}>
                    <Text style={styles.linkText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setIsEditingMobile(false);
                    setMobile(profile.mobile_no || '');
                  }}>
                    <Text style={[styles.linkText, { color: 'red' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.infoValue}>{mobile || 'Not Provided'}</Text>
                <TouchableOpacity onPress={() => setIsEditingMobile(true)}>
                  <Text style={styles.linkText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      <MenuItem
        icon={<MaterialCommunityIcons name="key-change" size={22} color="#000" />}
        label="Change Password"
        onPress={() => navigation.navigate('AdminChangePassword')}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Admin Panel v1.0</Text>
    </ScrollView>
  );
}

const InfoItem = ({ label, value, icon }) => (
  <View style={styles.infoItem}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({ icon, label, color = "#000", onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    {icon}
    <Text style={[styles.menuLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: '#f0f6ff',
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0056b3",
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  login: {
    color: '#d9e6ff',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
    borderRadius: 18,
    marginRight: 18,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 2,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 30,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#d9534f',
    marginTop: 30,
  },
  logoutText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});
