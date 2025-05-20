import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function StudentDetailsScreen({ route }) {
  const { student } = route.params;
  const [mentorCard, setMentorCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const enableAutoRotation = async () => {
      await ScreenOrientation.unlockAsync();
    };

    enableAutoRotation();
    fetchMentorCard();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  const fetchMentorCard = async () => {
    try {
      const response = await fetch(`http://192.168.134.136:5000/mentor-card/${student.Student_id}`);
      const data = await response.json();

      if (response.ok) {
        const defaultFields = {};
        for (let i = 1; i <= 10; i++) {
          defaultFields[`sgpa_sem${i}`] = data[`sgpa_sem${i}`] ?? '';
          defaultFields[`cgpa_sem${i}`] = data[`cgpa_sem${i}`] ?? '';
          defaultFields[`co_curricular_sem${i}`] = data[`co_curricular_sem${i}`] ?? '';
          defaultFields[`difficulty_faced_sem${i}`] = data[`difficulty_faced_sem${i}`] ?? '';
          defaultFields[`disciplinary_action_sem${i}`] = data[`disciplinary_action_sem${i}`] ?? '';
        }
        setMentorCard({ ...defaultFields, ...data });
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

  const handleInputChange = (key, value) => {
    setMentorCard(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://192.168.134.136:5000/mentor-card/${student.Student_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mentorCard)
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Mentor card updated successfully.');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update mentor card.');
      }
    } catch (error) {
      console.error('Error updating mentor card:', error);
      Alert.alert('Error', 'Failed to update mentor card.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSemesterHeader = () => (
    <View style={styles.semesterRow}>
      <Text style={styles.semesterLabel}></Text>
      {[...Array(10)].map((_, i) => (
        <Text key={i} style={styles.semesterValue}>S{i + 1}</Text>
      ))}
    </View>
  );

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
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
  >
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid={true}
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Student Mentoring Record Card</Text>
          <Text style={styles.subtitle}>(To be retained by the Mentor)</Text>
        </View>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Text style={{ color: 'white' }}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {isEditing && (
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={isSaving}>
          <Text style={{ color: 'white' }}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Part A: Personal Details</Text>
          {/* Reuse your existing Personal Info UI here (unchanged) */}
          <View style={styles.row}>
            <Text style={styles.label}>Name of the Student:</Text>
            <Text style={styles.value}>{student.Name || '-'}</Text>
            <Text style={styles.label}>Roll No. of Student:</Text>
            <Text style={styles.value}>{student.Roll_no || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Programme of study:</Text>
            <Text style={styles.value}>{student.Course_name || '-'}</Text>
            <Text style={styles.label}>Name of mentor:</Text>
            <Text style={styles.value}>{student.MentorName || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Batch:</Text>
            <Text style={styles.value}>{student.batch_name || '-'}</Text>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{student.mobile_no || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.Email || '-'}</Text>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{student.Address || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Health/Other Issues:</Text>
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
            <Text style={styles.label}>Name of local guardian:</Text>
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
            <Text style={styles.label}>Name of parents(s):</Text>
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Part B: Progress</Text>
          {renderSemesterHeader()}
          {renderSemesterData('SGPA', 'sgpa_sem')}
          {renderSemesterData('CGPA', 'cgpa_sem')}
          {renderSemesterData('Co-Curricular', 'co_curricular_sem')}
          {renderSemesterData('Difficulties', 'difficulty_faced_sem')}
          {renderSemesterData('Disciplinary', 'disciplinary_action_sem')}
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f4f4f8' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  subtitle: { fontSize: 12, fontStyle: 'italic', color: '#7f8c8d' },
  editBtn: { backgroundColor: '#3498db', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  saveBtn: {
    backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 18,
    alignSelf: 'flex-end', borderRadius: 8, marginBottom: 10
  },
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
  semesterInput: {
    width: '7.5%', borderWidth: 1, borderColor: '#bdc3c7',
    padding: 6, fontSize: 14, color: '#2d3436', textAlign: 'center'
  },
  scrollContainer: {
  padding: 15,
  backgroundColor: '#f4f4f8',
  paddingBottom: 100, // Ensures space below the last field
},

});
