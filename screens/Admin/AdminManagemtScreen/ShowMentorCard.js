import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import axios from "axios";
import RNPickerSelect from "react-native-picker-select";

const SERVER_URL = "http://192.168.216.136:5000";

const colors = {
  primary: "#6C63FF",
  secondary: "#4D8AF0",
  background: "#f2f6ff",
  card: "#FFFFFF",
  textPrimary: "#2D3748",
  textSecondary: "#718096",
  accent: "#FF6584",
  success: "#48BB78",
  warning: "#ED8936",
  divider: "#E2E8F0",
};

export default function StudentListScreen({ navigation }) {
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterBatch, setFilterBatch] = useState(null);
  const [filterDept, setFilterDept] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, students, filterBatch, filterDept]);

  const applyFilters = () => {
    let filtered = [...students];
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (s) =>
          s.Name.toLowerCase().includes(search.toLowerCase()) ||
          s.Email.toLowerCase().includes(search.toLowerCase()) ||
          s.Roll_no.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterBatch) {
      filtered = filtered.filter((s) => s.Batch === filterBatch);
    }
    if (filterDept) {
      filtered = filtered.filter((s) => s.Dept_ID === filterDept);
    }
    setFilteredStudents(filtered);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/admin/students`);
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [batchRes, deptRes] = await Promise.all([
        axios.get(`${SERVER_URL}/admin/batches`),
        axios.get(`${SERVER_URL}/admin/departments`),
      ]);
      setBatches(batchRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch dropdown data");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const handleStudentPress = (student) => {
    navigation.navigate("StudentMentorCard", { student });
  };

  const clearAllFilters = () => {
    setFilterBatch(null);
    setFilterDept(null);
    setSearch("");
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => handleStudentPress(item)}
      style={({ pressed }) => [
        styles.itemContainer,
        pressed && styles.itemPressed,
      ]}
    >
      <View style={styles.itemContent}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: stringToColor(item.Name) },
          ]}
        >
          <Text style={styles.avatarText}>
            {item.Name?.charAt(0)?.toUpperCase() || "S"}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.Name}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="fingerprint"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.itemSubInfo}> {item.Roll_no}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="email"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.itemSubInfo}> {item.Email}</Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>
            {filteredStudents.length} students found
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            Alert.alert("Add Student", "Add student functionality")
          }
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search students..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBarFixed}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <RNPickerSelect
                placeholder={{ label: "Batch", value: null }}
                value={filterBatch}
                onValueChange={(value) => setFilterBatch(value)}
                items={batches.map((batch) => ({
                  label: batch.batch_name,
                  value: batch.Batch_id,
                }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color={colors.primary}
                  />
                )}
              />
            </View>
            <View style={styles.filterItem}>
              <RNPickerSelect
                placeholder={{ label: "Department", value: null }}
                value={filterDept}
                onValueChange={(value) => setFilterDept(value)}
                items={departments.map((dept) => ({
                  label: dept.Dept_name,
                  value: dept.Dept_id,
                }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            {(filterBatch || filterDept) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFiltersText}>Reset</Text>
                <MaterialIcons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          
        </ScrollView>
      </View>

      {/* Student List */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading students...</Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="school" size={60} color={colors.divider} />
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.Student_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        )}
      </View>
    </View>
  );
}

// Helper function to generate consistent colors from strings
const stringToColor = (str) => {
  if (!str) return "#6C63FF";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterBarFixed: {
    width: '100%',
    minHeight: 60,
    backgroundColor: colors.background,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    paddingRight: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
  },
  filterItem: {
    minWidth: 120,
    maxWidth: 180,
    marginRight: 12,
    justifyContent: 'center',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 8,
    height: 44,
  },
  clearFiltersText: {
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 4,
    fontSize: 15,
  },
  itemContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemPressed: {
    opacity: 0.9,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 2,
  },
  itemSubInfo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mentorCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  mentorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mentorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mentorProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mentorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mentorAvatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
  },
  mentorName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  mentorPosition: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  mentorDetails: {
    marginBottom: 24,
  },
  studentInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noMentorContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noMentorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  noMentorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderRadius: 12,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 16,
    paddingRight: 30,
    minHeight: 44,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 0,
    borderRadius: 12,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 16,
    paddingRight: 30,
    minHeight: 44,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  iconContainer: {
    top: 14,
    right: 12,
  },
});

const pickerStyle = {
  ...pickerSelectStyles,
  viewContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 0,
    minHeight: 44,
    justifyContent: "center",
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.divider,
  },
};