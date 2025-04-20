// StudentProfile.js
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

const SERVER_URL = "http://192.168.225.136:5000";

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
        fetchProfile(); // Refresh data
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

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            source={
              profile.photo
                ? { uri: `${SERVER_URL}/uploads/${profile.photo}` }
                : require("../../assets/default-profile.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.name}>{profile.Name}</Text>
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
          value={profile.Email || "N/A"}
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
          label="ENROLLMENT YEAR"
          value={profile.Batch || "N/A"}
          icon={<Ionicons name="calendar-outline" size={18} color="#333" />}
        />
        <InfoItem
          label="DEPARTMENT"
          value={profile.Department || "N/A"}
          icon={<FontAwesome5 name="building" size={18} color="#333" />}
        />
        <InfoItem
          label="PROGRAMME"
          value={profile.Course || "N/A"}
          icon={<Ionicons name="school-outline" size={18} color="#333" />}
        />
        <InfoItem
          label="ROLL NO."
          value={profile.Roll_no || "N/A"}
          icon={<Ionicons name="barcode-outline" size={18} color="#333" />}
        />
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      {/* <MenuItem
        icon={<Ionicons name="person-outline" size={22} color="#000" />}
        label="Change Password"
        onPress={() => navigation.navigate("ProfileDetails")}
      /> */}
      <MenuItem icon={<MaterialCommunityIcons name="key-change" size={22} color="#000" />} label="Change Password" onPress={() => navigation.navigate("ChangePassword")} />
      {/*  <MenuItem icon={<FontAwesome5 name="university" size={20} color="#000" />} label="Bank Account" onPress={() => navigation.navigate('BankAccount')} />
      <MenuItem icon={<Ionicons name="phone-portrait-outline" size={22} color="#000" />} label="Device & Credentials" onPress={() => navigation.navigate('DeviceCredentials')} />
      <MenuItem icon={<MaterialCommunityIcons name="delete-outline" size={22} color="red" />} label="Delete My Account" color="red" onPress={() => navigation.navigate('DeleteAccount')} /> */}

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
    color: "#555",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 30,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 15,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#d9534f",
    marginTop: 30,
  },
  logoutText: {
    fontSize: 16,
    color: "white",
    marginLeft: 10,
  },
  versionText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});
