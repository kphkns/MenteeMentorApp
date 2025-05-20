import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Platform,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const SERVER_URL = 'http://192.168.134.136:5000'; // Replace with your IP

const CustomCheckbox = ({ checked, onToggle, color }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={[
      styles.checkboxBase,
      {
        borderColor: color,
        backgroundColor: checked ? color : 'transparent',
      },
    ]}
    activeOpacity={0.8}
  >
    {checked && <Text style={[styles.checkboxTick, { color: '#fff' }]}>✓</Text>}
  </TouchableOpacity>
);

export default function StudentBasicListScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Modal state
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoData, setInfoData] = useState(null);

  const primaryColor = isDark ? '#4F8EF7' : '#3366FF';
  const bgColor = isDark ? '#121212' : '#F5F7FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const textColor = isDark ? '#EEE' : '#222';
  const subTextColor = isDark ? '#AAA' : '#666';

  useEffect(() => {
    fetchDropdowns();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchCoursesByDepartment(selectedDept);
    } else {
      setCourses([]);
      setSelectedCourse(null);
    }
  }, [selectedDept]);

  useEffect(() => {
    setSearch('');
    fetchStudents();
  }, [selectedBatch, selectedDept, selectedCourse]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((s) =>
        s.Name.toLowerCase().includes(search.toLowerCase()) ||
        s.Email.toLowerCase().includes(search.toLowerCase()) ||
        s.Roll_no.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [search, students]);

  const fetchDropdowns = async () => {
    try {
      const [batchRes, deptRes] = await Promise.all([
        axios.get(`${SERVER_URL}/admin/batchess`),
        axios.get(`${SERVER_URL}/admin/departmentss`),
      ]);
      setBatches(batchRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dropdown data');
    }
  };

  const fetchCoursesByDepartment = async (deptId) => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/coursess`, {
        params: { dept: deptId },
      });
      setCourses(res.data);
      setSelectedCourse(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to load courses');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedDept) params.dept = selectedDept;
      if (selectedCourse) params.course = selectedCourse;

      const res = await axios.get(`${SERVER_URL}/admin/studentss`, { params });
      setStudents(res.data);
      setFilteredStudents(res.data);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.Student_id));
    }
    setSelectAll(!selectAll);
  };

  const updateStatus = async (newStatus) => {
    if (selectedIds.length === 0) {
      Alert.alert('No Selection', 'Please select at least one student.');
      return;
    }

    try {
      await axios.put(`${SERVER_URL}/admin/update-status`, {
        studentIds: selectedIds,
        status: newStatus,
      });
      Alert.alert('Success', 'Status updated successfully.');
      fetchStudents();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const openInfoModal = (student) => {
    setInfoData(student);
    setInfoModalVisible(true);
  };

  const closeInfoModal = () => {
    setInfoModalVisible(false);
    setInfoData(null);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: cardBg, shadowColor: primaryColor }]}>
      <View style={styles.checkboxRow}>
        <CustomCheckbox
          checked={selectedIds.includes(item.Student_id)}
          onToggle={() => toggleSelect(item.Student_id)}
          color={primaryColor}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.name, { color: textColor, flex: 1 }]} numberOfLines={1}>
              {item.Name}
            </Text>
            <TouchableOpacity onPress={() => openInfoModal(item)} style={{ paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 18, color: primaryColor }}>ⓘ</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subText, { color: subTextColor }]}>Roll No: {item.Roll_no}</Text>
          <Text style={[styles.subText, { color: subTextColor }]} numberOfLines={1}>
            {item.Email}
          </Text>
          <Text
            style={[
              styles.status,
              { color: item.status === 1 ? '#28a745' : '#dc3545' },
            ]}
          >
            {item.status === 1 ? '🟢 Active' : '🔴 Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <RNPickerSelect
          onValueChange={setSelectedBatch}
          value={selectedBatch}
          placeholder={{ label: 'Select Batch', value: null }}
          items={batches.map((b) => ({ label: b.batch_name, value: b.Batch_id }))}
          style={pickerSelectStyle(cardBg, textColor)}
          useNativeAndroidPickerStyle={false}
        />
        <RNPickerSelect
          onValueChange={setSelectedDept}
          value={selectedDept}
          placeholder={{ label: 'Select Department', value: null }}
          items={departments.map((d) => ({ label: d.Dept_name, value: d.Dept_id }))}
          style={pickerSelectStyle(cardBg, textColor)}
          useNativeAndroidPickerStyle={false}
        />
        <RNPickerSelect
          onValueChange={setSelectedCourse}
          value={selectedCourse}
          placeholder={{ label: 'Select Course', value: null }}
          items={courses.map((c) => ({ label: c.Course_name, value: c.Course_ID }))}
          style={pickerSelectStyle(cardBg, textColor)}
          useNativeAndroidPickerStyle={false}
          disabled={courses.length === 0}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchWrapper, { backgroundColor: cardBg, shadowColor: primaryColor }]}>
        <TextInput
          placeholder="Search by name, email, or roll no"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: textColor }]}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Actions & Selected Count */}
      <View style={[styles.actionRow, { justifyContent: 'space-between' }]}>
        <View style={styles.checkboxRow}>
          <CustomCheckbox checked={selectAll} onToggle={toggleSelectAll} color={primaryColor} />
          <Text style={{ color: textColor, marginLeft: 6, fontWeight: '600' }}>Select All</Text>
        </View>
        <Text style={{ color: textColor, fontWeight: '600' }}>
          Selected {selectedIds.length}
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() => updateStatus(1)}
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>Set Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateStatus(0)}
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>Set Inactive</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Student List */}
      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.Student_id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />
          }
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 30, color: subTextColor, fontStyle: 'italic' }}>
              No students found.
            </Text>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Info Modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeInfoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Student Info</Text>
            {infoData && (
              <>
                <Text style={[styles.modalText, { color: textColor }]}>Batch: {infoData.Batch || infoData.Batch_id || infoData.Batch_ID || 'N/A'}</Text>
                <Text style={[styles.modalText, { color: textColor }]}>Dept_ID: {infoData.Dept_ID || infoData.Dept_id || infoData.Dept || 'N/A'}</Text>
                <Text style={[styles.modalText, { color: textColor }]}>Course_ID: {infoData.Course_ID || infoData.Course_id || infoData.Course || 'N/A'}</Text>
                <Text style={[styles.modalText, { color: textColor }]}>Faculty_id: {infoData.Faculty_id || infoData.Faculty || 'N/A'}</Text>
              </>
            )}
            <TouchableOpacity onPress={closeInfoModal} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pickerSelectStyle = (bgColor, textColor) => ({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: textColor,
    backgroundColor: bgColor,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: textColor,
    backgroundColor: bgColor,
    marginBottom: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  searchWrapper: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    marginBottom: 10,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchInput: {
    fontSize: 16,
    height: 40,
  },
  item: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 16,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
   name: {
    fontSize: 18,
    fontWeight: '700',
  },
   subText: {
    fontSize: 14,
    marginTop: 4,
  },
  status: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 13,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBase: {
     width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxTick: {
    fontSize: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  subText: {
    fontSize: 13,
    marginTop: 3,
  },
  status: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeBtn: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#3366FF',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
