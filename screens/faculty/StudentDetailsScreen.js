import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity
} from 'react-native';

export default function StudentDetailsScreen({ route }) {
  const { student } = route.params; // Destructure the student data passed from the previous screen
  const [mentorCard, setMentorCard] = useState(null); // State to hold mentor card data
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [isEditing, setIsEditing] = useState(false); // State to toggle between view and edit mode

  // Function to fetch the mentor card data
  const fetchMentorCard = async () => {
    try {
      const response = await fetch(`http://192.168.65.136:5000/mentor-card/${student.Student_id}`);
      const data = await response.json();
      if (response.ok) {
        setMentorCard(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch mentor card.');
      }
    } catch (error) {
      console.error('Error fetching mentor card:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorCard(); // Fetch mentor card data when the component is mounted
  }, []);

  // Function to handle changes in editable fields
  const handleInputChange = (key, value) => {
    setMentorCard({ ...mentorCard, [key]: value });
  };

  // List of editable fields that can be modified by the user
  const editableFields = [
    'name_of_localgurdian', 'moble_no_of_localgurdent', 'mobile_no_of_parents',
    'name_of_pareents', 'present_address', 'email_of_parents', 'any_helthissue',
    ...Array.from({ length: 10 }, (_, i) => `sgpa_sem${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `cgpa_sem${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `co_curricular_sem${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `difficulty_faced_sem${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `disciplinary_action_sem${i + 1}`)
  ];

  // Renders the semester header row
  const renderSemesterHeader = () => (
    <View style={styles.semesterRow}>
      <Text style={styles.semesterLabel}></Text>
      {[...Array(10)].map((_, i) => (
        <Text key={i} style={styles.semesterValue}>S{i + 1}</Text>
      ))}
    </View>
  );

  // Renders data for each semester
  const renderSemesterData = (label, keyPrefix) => (
    <View style={styles.semesterRow}>
      <Text style={styles.semesterLabel}>{label}</Text>
      {[...Array(10)].map((_, i) => {
        const key = `${keyPrefix}${i + 1}`;
        return isEditing ? (
          <TextInput
            key={i}
            style={styles.semesterInput}
            value={mentorCard?.[key] ?? ''}
            onChangeText={(value) => handleInputChange(key, value)}
          />
        ) : (
          <Text key={i} style={styles.semesterValue}>{mentorCard?.[key] ?? '-'}</Text>
        );
      })}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 30 }} />;
  if (!mentorCard) return <Text style={{ textAlign: 'center', marginTop: 30 }}>No mentor card data available.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Student Mentoring Record Card</Text>
          <Text style={styles.subtitle}>(To be retained by the Mentor)</Text>
        </View>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Text style={{ color: 'white' }}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Part A: Personal Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Part A: Personal Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{student.Name || '-'}</Text>
          <Text style={styles.label}>Roll No:</Text>
          <Text style={styles.value}>{student.Roll_no || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Course:</Text>
          <Text style={styles.value}>{student.Course_name || '-'}</Text>
          <Text style={styles.label}>Mentor:</Text>
          <Text style={styles.value}>{student.MentorName || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Batch:</Text>
          <Text style={styles.value}>{student.batch_name || '-'}</Text>
          <Text style={styles.label}>Mobile:</Text>
          <Text style={styles.value}>{student.mobile_no || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{student.Email || '-'}</Text>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{student.Address || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Health Issues:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.any_helthissue}
              onChangeText={(value) => handleInputChange('any_helthissue', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.any_helthissue || '-'}</Text>
          )}
          <Text style={styles.label}>Parents' Mobile:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.mobile_no_of_parents}
              onChangeText={(value) => handleInputChange('mobile_no_of_parents', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.mobile_no_of_parents || '-'}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Local Guardian:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.name_of_localgurdian}
              onChangeText={(value) => handleInputChange('name_of_localgurdian', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.name_of_localgurdian || '-'}</Text>
          )}
          <Text style={styles.label}>Guardian Mobile:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.moble_no_of_localgurdent}
              onChangeText={(value) => handleInputChange('moble_no_of_localgurdent', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.moble_no_of_localgurdent || '-'}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Parents' Name:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.name_of_pareents}
              onChangeText={(value) => handleInputChange('name_of_pareents', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.name_of_pareents || '-'}</Text>
          )}
          <Text style={styles.label}>Parents' Email:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mentorCard.email_of_parents}
              onChangeText={(value) => handleInputChange('email_of_parents', value)}
            />
          ) : (
            <Text style={styles.value}>{mentorCard.email_of_parents || '-'}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Present Address:</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, { width: '90%' }]}
              value={mentorCard.present_address}
              onChangeText={(value) => handleInputChange('present_address', value)}
            />
          ) : (
            <Text style={[styles.value, { width: '90%' }]}>{mentorCard.present_address || '-'}</Text>
          )}
        </View>
      </View>

      {/* Part B: Progress */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Part B: Progress</Text>
        {renderSemesterHeader()}
        {renderSemesterData('SGPA', 'sgpa_sem')}
        {renderSemesterData('CGPA', 'cgpa_sem')}
        {renderSemesterData('Co-Curricular', 'co_curricular_sem')}
        {renderSemesterData('Difficulties', 'difficulty_faced_sem')}
        {renderSemesterData('Disciplinary', 'disciplinary_action_sem')}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f4f4f8' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  subtitle: { fontSize: 12, fontStyle: 'italic', color: '#7f8c8d' },
  editBtn: { backgroundColor: '#3498db', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  card: {
    borderWidth: 1, borderColor: '#dcdde1', borderRadius: 12,
    padding: 18, backgroundColor: '#fff', marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: '#34495e',
    borderBottomWidth: 1, borderColor: '#bdc3c7', marginBottom: 10, paddingBottom: 5,
  },
  row: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderBottomWidth: 0.5, borderColor: '#ecf0f1', paddingVertical: 8,
  },
  label: { width: '45%', fontWeight: '600', color: '#2c3e50', paddingHorizontal: 5, fontSize: 14 },
  value: { width: '50%', color: '#2d3436', paddingHorizontal: 5, fontSize: 14 },
  input: {
    width: '50%', borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, color: '#2d3436', fontSize: 14
},
semesterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
semesterLabel: { width: '25%', fontWeight: '500', fontSize: 14 },
semesterValue: { width: '7.5%', textAlign: 'center', fontSize: 14, color: '#2d3436' },
semesterInput: { width: '7.5%', borderWidth: 1, borderColor: '#bdc3c7', padding: 6, fontSize: 14, color: '#2d3436' },
});
