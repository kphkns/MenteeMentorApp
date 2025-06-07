import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";

const SERVER_URL = "http://192.168.15.136:5000";

export default function StudentProfile({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");
  const [isEditingMobile, setIsEditingMobile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await axios.get(`${SERVER_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.profile);
      setMobile(res.data.profile.mobile_no || "");
    } catch (error) {
      Alert.alert("Error", "Failed to fetch profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera roll is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append("photo", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      const token = await AsyncStorage.getItem("authToken");
      try {
        await axios.post(`${SERVER_URL}/student/upload-photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        fetchProfile();
      } catch (err) {
        Alert.alert("Error", "Could not upload photo");
      }
    }
  };

  const updateMobile = async () => {
    const token = await AsyncStorage.getItem("authToken");
    try {
      const response = await axios.put(
        `${SERVER_URL}/student/update-mobile`,
        {
          mobile_no: mobile,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", response.data.message);
      setIsEditingMobile(false);
      fetchProfile();
    } catch (err) {
      console.log("Mobile Update Error:", err.response?.data || err.message);
      if (err.response?.data?.message) {
        Alert.alert("Error", err.response.data.message);
      } else {
        Alert.alert("Error", "Could not update mobile number");
      }
    }
  };

  const cancelEditMobile = () => {
    setMobile(profile.mobile_no || "");
    setIsEditingMobile(false);
  };

  const handleLogout = async () => {
    Alert.alert("Logout Confirmation", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.removeItem("authToken");
          navigation.replace("Login");
        },
        style: "destructive",
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Profile Picture */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                profile?.photo
                  ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
                  : require("../../assets/default-profile.png")
              }
              style={styles.avatar}
            />
            <View style={styles.cameraIconWrapper}>
              <Feather name="camera" size={18} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>{profile.Name}</Text>
        <Text style={styles.login}>
          Last Login:{" "}
          {profile.Last_login
            ? new Date(profile.Last_login).toLocaleDateString()
            : "N/A"}
        </Text>
      </View>

      {/* Profile Information Card */}
      <View style={styles.infoCard}>
        <InfoItem
          label="Email"
          value={profile.Email || "Not provided"}
          icon={<Ionicons name="mail-outline" size={20} color="#6C63FF" />}
        />
        
        <View style={styles.divider} />
        
        <View style={styles.infoItem}>
          <View style={styles.iconWrapper}>
            <Ionicons name="call-outline" size={20} color="#6C63FF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Contact</Text>
            {isEditingMobile ? (
              <View style={styles.editMobileContainer}>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={15}
                  autoFocus
                  placeholder="Enter mobile number"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={updateMobile}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelEditMobile}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.mobileView}>
                <Text style={styles.infoValue}>
                  {mobile || "Not provided"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingMobile(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <InfoItem
          label="Enrollment Year"
          value={profile.Batch || "N/A"}
          icon={<Ionicons name="calendar-outline" size={20} color="#6C63FF" />}
        />
        
        <View style={styles.divider} />
        
        <InfoItem
          label="Department"
          value={profile.Department || "N/A"}
          icon={<FontAwesome5 name="building" size={18} color="#6C63FF" />}
        />
        
        <View style={styles.divider} />
        
        <InfoItem
          label="Programme"
          value={profile.Course || "N/A"}
          icon={<Ionicons name="school-outline" size={20} color="#6C63FF" />}
        />
        
        <View style={styles.divider} />
        
        <InfoItem
          label="Roll No."
          value={profile.Roll_no || "N/A"}
          icon={<Ionicons name="barcode-outline" size={20} color="#6C63FF" />}
        />
      </View>

      {/* Settings Section */}
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingsCard}>
        <MenuItem
          icon={<MaterialCommunityIcons name="key-change" size={24} color="#6C63FF" />}
          label="Change Password"
          onPress={() => navigation.navigate("ChangePassword")}
        />
        
        <View style={styles.divider} />
        
        <MenuItem
          icon={<Ionicons name="notifications-outline" size={24} color="#6C63FF" />}
          label="Notification Settings"
          onPress={() => navigation.navigate("NotificationSettings")}
        />
        
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <Text style={styles.versionText}>Version 2.0.1</Text>
    </ScrollView>
  );
}

const InfoItem = ({ label, value, icon }) => (
  <View style={styles.infoItem}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    {icon}
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#f2f6ff",
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "#E9ECEF",
  },
  cameraIconWrapper: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  name: {
    color: "#2B2D42",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  login: {
    color: "#8D99AE",
    fontSize: 14,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  settingsCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    borderRadius: 12,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8D99AE",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#2B2D42",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF2F4",
    marginVertical: 4,
  },
  input: {
    height: 48,
    borderColor: "#E9ECEF",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#2B2D42",
    backgroundColor: "#F8F9FA",
    marginTop: 8,
    marginBottom: 12,
  },
  editMobileContainer: {
    flex: 1,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saveBtn: {
    backgroundColor: "#6C63FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 10,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: "#E9ECEF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: "#8D99AE",
    fontWeight: "600",
    fontSize: 14,
  },
  mobileView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editText: {
    color: "#6C63FF",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2D42",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2B2D42",
    flex: 1,
    marginLeft: 12,
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE3E3",
    backgroundColor: "#FFF5F5",
    marginBottom: 24,
  },
  logoutText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  versionText: {
    textAlign: "center",
    fontSize: 13,
    color: "#8D99AE",
    fontWeight: "500",
  },
});