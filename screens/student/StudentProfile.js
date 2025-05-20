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
} from "@expo/vector-icons";

const SERVER_URL = "http://192.168.65.136:5000";

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
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={handleImagePick} activeOpacity={0.7}>
          <Image
            source={
              profile?.photo
                ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
                : require("../../assets/default-profile.png")
            }
            style={styles.avatar}
          />
          <View style={styles.cameraIconWrapper}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.name}>{profile.Name}</Text>
          <Text style={styles.login}>
            Last Login:{" "}
            {profile.Last_login
              ? new Date(profile.Last_login).toLocaleDateString()
              : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoItem
          label="EMAIL"
          value={profile.Email || "N/A"}
          icon={<Ionicons name="mail-outline" size={18} color="#fff" />}
        />
        <View style={[styles.infoItem, { alignItems: "flex-start" }]}>
          <View style={[styles.iconWrapper, { backgroundColor: "#007bff" }]}>
            <Ionicons name="call-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>CONTACT</Text>
            {isEditingMobile ? (
              <View style={styles.editMobileRow}>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={15}
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.saveBtn, { marginRight: 10 }]}
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
                  {mobile || "Not Provided"}
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
        <InfoItem
          label="ENROLLMENT YEAR"
          value={profile.Batch || "N/A"}
          icon={<Ionicons name="calendar-outline" size={18} color="#fff" />}
        />
        <InfoItem
          label="DEPARTMENT"
          value={profile.Department || "N/A"}
          icon={<FontAwesome5 name="building" size={18} color="#fff" />}
        />
        <InfoItem
          label="PROGRAMME"
          value={profile.Course || "N/A"}
          icon={<Ionicons name="school-outline" size={18} color="#fff" />}
        />
        <InfoItem
          label="ROLL NO."
          value={profile.Roll_no || "N/A"}
          icon={<Ionicons name="barcode-outline" size={18} color="#fff" />}
        />
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      <MenuItem
        icon={<MaterialCommunityIcons name="key-change" size={22} color="#000" />}
        label="Change Password"
        onPress={() => navigation.navigate("ChangePassword")}
      />

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 2.0</Text>
    </ScrollView>
  );
}

const InfoItem = ({ label, value, icon }) => (
  <View style={styles.infoItem}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    {icon}
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6f3ff",
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: "#f2f6ff",
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: "#0066cc",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 5,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  cameraIconWrapper: {
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
    color: "#cbdcff",
    fontSize: 14,
    marginTop: 3,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    color: "#555",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 17,
    color: "#222",
    fontWeight: "500",
  },
  input: {
    height: 44,
    borderColor: "#007bff",
    borderWidth: 1.8,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#f9faff",
  },
  editMobileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  editButtons: {
    flexDirection: "row",
    marginLeft: 12,
  },
  saveBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 14,
  },
  mobileView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  editText: {
    color: "#007bff",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 35,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 13,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: "500",
    marginLeft: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 12,
    marginTop: 25,
    justifyContent: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 10,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    color: "#888",
    marginTop: 25,
  },
});
