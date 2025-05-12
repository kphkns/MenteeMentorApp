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

export default function FacultyProfile({ navigation }) {
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
      if (!token) {
        throw new Error("No auth token found");
      }

      const res = await axios.get(`${SERVER_URL}/faculty/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        setProfile(res.data.profile);
        setMobile(res.data.profile.mobile_no || "");
      } else {
        console.error(`Error fetching profile: ${res.statusText}`);
        throw new Error("Failed to fetch profile data.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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
        console.error("Error uploading photo:", err);
        Alert.alert("Error", "Photo upload failed.");
      }
    }
  };

  const updateMobile = async () => {
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
      console.error("Error updating mobile:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to update mobile.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure?", [
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
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            source={
              profile?.photo
                ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
                : require("../../assets/default-profile.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.name}>{profile.Name}</Text>
          {/* Display Last Login Date */}
          <Text style={styles.login}>
            Last Login:{" "}
            {profile.Last_login
              ? new Date(profile.Last_login).toDateString()
              : "N/A"}
          </Text>
        </View>
      </View>

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
                />
                <TouchableOpacity onPress={updateMobile}>
                  <Text style={{ color: "#007bff", marginTop: 5 }}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.infoValue}>{mobile || "Not Provided"}</Text>
                <TouchableOpacity onPress={() => setIsEditingMobile(true)}>
                  <Text style={{ color: "#007bff", marginTop: 5 }}>Edit</Text>
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

      <Text style={styles.sectionTitle}>Settings</Text>

      <MenuItem
        icon={<MaterialCommunityIcons name="key-change" size={22} color="#000" />}
        label="Change Password"
        onPress={() => navigation.navigate("ChangePassword")}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
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
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    {icon}
    <Text style={[styles.menuLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: "#e6f3ff",
    flexGrow: 1,
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
    color: "#ff0000",
    fontWeight: "bold",
  },
  headerCard: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  login: {
    color: "#d9e6ff",
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
    borderRadius: 20,
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginTop: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  logoutBtn: {
    backgroundColor: "#ff4d4d",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  logoutText: {
    fontSize: 16,
    color: "white",
    marginLeft: 10,
  },
  versionText: {
    textAlign: "center",
    marginTop: 30,
    color: "#333",
  },
});
