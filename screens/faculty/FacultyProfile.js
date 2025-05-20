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

const SERVER_URL = "http://192.168.134.136:5000";

export default function FacultyProfile({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [updatingMobile, setUpdatingMobile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");

      const res = await axios.get(`${SERVER_URL}/faculty/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        setProfile(res.data.profile);
        setMobile(res.data.profile.mobile_no || "");
      } else {
        throw new Error("Failed to fetch profile data.");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Access to media library required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      const token = await AsyncStorage.getItem("authToken");
      try {
        const response = await axios.post(`${SERVER_URL}/faculty/upload-photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          fetchProfile();
        } else {
          Alert.alert("Error", "Photo upload failed.");
        }
      } catch (err) {
        Alert.alert("Error", "Photo upload failed.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const updateMobile = async () => {
    if (!mobile.trim()) {
      Alert.alert("Validation", "Mobile number cannot be empty.");
      return;
    }
    setUpdatingMobile(true);
    const token = await AsyncStorage.getItem("authToken");
    try {
      const res = await axios.put(
        `${SERVER_URL}/faculty/update-mobile`,
        { mobile_no: mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", res.data.message);
      setIsEditingMobile(false);
      fetchProfile();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update mobile.");
    } finally {
      setUpdatingMobile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("authToken");
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.headerCard}>
       <TouchableOpacity
  onPress={handleImagePick}
  activeOpacity={0.7}
  disabled={uploadingPhoto}
  style={styles.avatarWrapper}
>
  <Image
    source={
      profile.photo
        ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
        : require("../../assets/default-profile.png")
    }
    style={styles.avatar}
  />
  {uploadingPhoto ? (
    <View style={styles.photoUploadingOverlay}>
      <ActivityIndicator size="small" color="#fff" />
    </View>
  ) : (
    <View style={styles.cameraIconWrapper}>
      <Ionicons name="camera" size={18} color="#fff" />
    </View>
  )}
</TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.Name}</Text>
          <Text style={styles.login}>
            Last Login:{" "}
            {profile.Last_login
              ? new Date(profile.Last_login).toLocaleString()
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <InfoItem
          label="EMAIL"
          value={profile.Email}
          icon={<Ionicons name="mail-outline" size={18} color="#333" />}
        />
        <View style={styles.infoItem}>
          <View style={styles.iconWrapper}>
            <Ionicons name="call-outline" size={18} color="#333" />
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
                  placeholder="Enter mobile number"
                  editable={!updatingMobile}
                />
                <View style={styles.mobileButtonsRow}>
                  <TouchableOpacity
                    onPress={updateMobile}
                    disabled={
                      updatingMobile || !mobile.trim() || mobile === profile.mobile_no
                    }
                    style={[
                      styles.saveBtn,
                      (updatingMobile || !mobile.trim() || mobile === profile.mobile_no) && styles.disabledBtn,
                    ]}
                    activeOpacity={0.7}
                  >
                    {updatingMobile ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setMobile(profile.mobile_no || "");
                      setIsEditingMobile(false);
                    }}
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.infoValue}>
                  {mobile || "Not Provided"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingMobile(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editAction}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <InfoItem
          label="DEPARTMENT"
          value={profile.Dept_name}
          icon={<FontAwesome5 name="building" size={18} color="#333" />}
        />
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>Settings</Text>
      <MenuItem
        icon={<MaterialCommunityIcons name="key-change" size={22} color="#000" />}
        label="Change Password"
        onPress={() => navigation.navigate("ChangePassword")}
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
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
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({ icon, label, color = "#000", onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    {icon}
    <Text style={[styles.menuLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#f5f9ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ff3b30",
    fontWeight: "600",
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0066cc",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#cce6ff",
  },
  photoUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  login: {
    color: "#d0e6ff",
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: "#e0edff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#111",
    marginTop: 2,
     fontWeight: "bold",  // <-- ADD THIS LINE
  },
  input: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    fontSize: 16,
  },
  editAction: {
    color: "#007bff",
    marginTop: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  mobileButtonsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginRight: 10,
  },
  disabledBtn: {
    backgroundColor: "#aacbff",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 20,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
 menuLabel: {
  fontSize: 17,
  marginLeft: 16,
  color: "#333",
  fontWeight: "bold",  // <-- ADD THIS LINE
},

  logoutBtn: {
    marginTop: 30,
    flexDirection: "row",
    backgroundColor: "#ff3b30",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    elevation: 2,
  },
  logoutText: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 10,
    fontWeight: "700",
  },
  versionText: {
    marginTop: 30,
    textAlign: "center",
    color: "#999",
    fontSize: 13,
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

});
