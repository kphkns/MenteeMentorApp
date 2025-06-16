import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import RNPickerSelect from "react-native-picker-select";

const SERVER_URL = "http://192.168.158.136:5000";

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

export default function StudentListScreen() {
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editFaculty, setEditFaculty] = useState("");
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterBatch, setFilterBatch] = useState(null);
  const [filterDept, setFilterDept] = useState(null);
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterFaculty, setFilterFaculty] = useState(null);

  // FIX: Remove selectedStudents from dependency array
  useEffect(() => {
    fetchStudents();
    fetchDropdownData();

    const backAction = () => {
      if (selectedStudents.length > 0) {
        setSelectedStudents([]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []); // <-- Only run once on mount

  useEffect(() => {
    applyFilters();
  }, [search, students, filterBatch, filterDept, filterCourse, filterFaculty]);

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
    if (filterCourse) {
      filtered = filtered.filter((s) => s.Course_ID === filterCourse);
    }
    if (filterFaculty) {
      filtered = filtered.filter((s) => s.Faculty_id === filterFaculty);
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
      const [batchRes, deptRes, courseRes, facultyRes] = await Promise.all([
        axios.get(`${SERVER_URL}/admin/batches`),
        axios.get(`${SERVER_URL}/admin/departments`),
        axios.get(`${SERVER_URL}/admin/courses`),
        axios.get(`${SERVER_URL}/admin/faculty`),
      ]);
      setBatches(batchRes.data);
      setDepartments(deptRes.data);
      setCourses(courseRes.data);
      setFaculties(facultyRes.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch dropdown data");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setEditName(student.Name);
    setEditEmail(student.Email);
    setEditRoll(student.Roll_no);
    setEditBatch(student.Batch || "");
    setEditDepartment(student.Dept_ID || "");
    setEditCourse(student.Course_ID || "");
    setEditFaculty(student.Faculty_id || "");
    setModalVisible(true);
  };

  const saveStudentChanges = async () => {
    try {
      await axios.put(
        `${SERVER_URL}/admin/students/${editStudent.Student_id}`,
        {
          Name: editName,
          Email: editEmail,
          Roll_no: editRoll,
          Batch: editBatch,
          Dept_ID: editDepartment,
          Course_ID: editCourse,
          Faculty_id: editFaculty,
          Password: editStudent.Password,
        }
      );
      setModalVisible(false);
      fetchStudents();
    } catch (err) {
      Alert.alert("Error", "Failed to update student");
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/admin/students/${id}`);
              fetchStudents();
            } catch {
              Alert.alert("Error", "Failed to delete student");
            }
          },
        },
      ]
    );
  };

  const handleMultipleDelete = () => {
    Alert.alert(
      "Delete Students",
      `Are you sure you want to delete ${selectedStudents.length} students?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                selectedStudents.map((id) =>
                  axios.delete(`${SERVER_URL}/admin/students/${id}`)
                )
              );
              setSelectedStudents([]);
              fetchStudents();
            } catch {
              Alert.alert("Error", "Failed to delete students");
            }
          },
        },
      ]
    );
  };

  const toggleSelect = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sid) => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const onLongPressItem = (id) => {
    toggleSelect(id);
  };

  const clearAllFilters = () => {
    setFilterBatch(null);
    setFilterDept(null);
    setFilterCourse(null);
    setFilterFaculty(null);
    setSearch("");
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedStudents.includes(item.Student_id);
    return (
      <Pressable
        onPress={() => {
          if (selectedStudents.length > 0) {
            toggleSelect(item.Student_id);
          }
        }}
        onLongPress={() => onLongPressItem(item.Student_id)}
        style={({ pressed }) => [
          styles.itemContainer,
          isSelected && styles.itemSelected,
          pressed && styles.itemPressed,
        ]}
      >
        <View style={styles.itemContent}>
          <View style={[
            styles.avatarCircle,
            { backgroundColor: stringToColor(item.Name) }
          ]}>
            <Text style={styles.avatarText}>
              {item.Name?.charAt(0)?.toUpperCase() || "S"}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.Name}</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <MaterialIcons name="fingerprint" size={14} color={colors.textSecondary} />
                <Text style={styles.itemSubInfo}> {item.Roll_no}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="email" size={14} color={colors.textSecondary} />
                <Text style={styles.itemSubInfo}> {item.Email}</Text>
              </View>
            </View>
          </View>
          {isSelected ? (
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={20} color="white" />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.editButton}
            >
              <Feather name="edit-2" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {/* <Text style={styles.title}>Student Management</Text> */}
          <Text style={styles.subtitle}>{filteredStudents.length} students found</Text>
        </View>
        {selectedStudents.length > 0 ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMultipleDelete}
          >
            <Ionicons name="trash" size={26} color={colors.accent} />
            {selectedStudents.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedStudents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert("Add Student", "Add student functionality")}
          >
            <Ionicons name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
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
                Icon={() => <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />}
              />
            </View>
            <View style={styles.filterItem}>
              <RNPickerSelect
                placeholder={{ label: "Department", value: null }}
                value={filterDept}
                onValueChange={(value) => {
                  setFilterDept(value);
                  setFilterCourse(null);
                  setFilterFaculty(null);
                }}
                items={departments.map((dept) => ({
                  label: dept.Dept_name,
                  value: dept.Dept_id,
                }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            <View style={styles.filterItem}>
              <RNPickerSelect
                placeholder={{ label: "Course", value: null }}
                value={filterCourse}
                onValueChange={(value) => setFilterCourse(value)}
                items={courses
                  .filter((c) => !filterDept || c.Dept_ID === filterDept)
                  .map((course) => ({
                    label: course.Course_name,
                    value: course.Course_ID,
                  }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            {(filterBatch || filterDept || filterCourse || filterFaculty) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFiltersText}>Reset</Text>
                <MaterialIcons name="close" size={16} color={colors.textSecondary} />
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
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.Student_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            extraData={selectedStudents}
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
      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackground}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Student</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="fingerprint" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={editRoll}
                  onChangeText={setEditRoll}
                  placeholder="Roll Number"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </View>
              <Text style={styles.sectionTitle}>Academic Information</Text>
              <RNPickerSelect
                placeholder={{ label: "Select Batch", value: null }}
                value={editBatch}
                onValueChange={setEditBatch}
                items={batches.map((batch) => ({
                  label: batch.batch_name,
                  value: batch.Batch_id,
                }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
                Icon={() => <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />}
              />
              <RNPickerSelect
                placeholder={{ label: "Select Department...", value: null }}
                value={editDepartment}
                onValueChange={(value) => {
                  setEditDepartment(value);
                  setEditCourse("");
                  setEditFaculty("");
                }}
                items={departments.map((dept) => ({
                  label: dept.Dept_name,
                  value: dept.Dept_id,
                }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
              <RNPickerSelect
                placeholder={{ label: "Select Course...", value: null }}
                value={editCourse}
                onValueChange={setEditCourse}
                items={courses
                  .filter((c) => c.Dept_ID === editDepartment)
                  .map((course) => ({
                    label: course.Course_name,
                    value: course.Course_ID,
                  }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
              <RNPickerSelect
                placeholder={{ label: "Select Faculty...", value: null }}
                value={editFaculty}
                onValueChange={setEditFaculty}
                items={faculties
                  .filter((f) => f.Dept_ID === editDepartment)
                  .map((faculty) => ({
                    label: faculty.Name,
                    value: faculty.Faculty_id,
                  }))}
                style={pickerStyle}
                useNativeAndroidPickerStyle={false}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveStudentChanges}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Helper function to generate consistent colors from strings
const stringToColor = (str) => {
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // --- Filter Bar Styles ---
  filterBarFixed: {
    width: '100%',
    minHeight: 60,
    backgroundColor: colors.background,
    paddingVertical: 4,
    marginBottom: 8,
    // Always keep at the top, do not use flex or alignItems here
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
  // --- End Filter Bar Styles ---
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
  itemSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
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
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
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
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 12,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.divider,
    marginRight: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
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
    minHeight: 44, // Ensures visible touch area
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
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.divider,
  },
};