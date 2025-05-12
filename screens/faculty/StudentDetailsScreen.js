import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function MentorCardScreen({ route }) {
  const {
    student = {},
    mentorCard = {},
  } = route.params || {};

  const renderSemesterHeader = () => (
    <View style={styles.semesterRow}>
      <Text style={styles.semesterLabel}></Text>
      {[...Array(10)].map((_, i) => (
        <Text key={i} style={styles.semesterValue}>{`S${i + 1}`}</Text>
      ))}
    </View>
  );

  const renderSemesterData = (label, keyPrefix) => (
    <View style={styles.semesterRow}>
      <Text style={styles.semesterLabel}>{label}</Text>
      {[...Array(10)].map((_, i) => (
        <Text key={i} style={styles.semesterValue}>
          {mentorCard?.[`${keyPrefix}${i + 1}`] ?? '-'}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Student Mentoring Record Card</Text>
        <Text style={styles.subtitle}>(To be retained by the Mentor)</Text>
        <Image
          source={
            student.photo
              ? { uri: `http://192.168.65.136:5000/uploads/${student.photo}` }
              : require('../../assets/default-profile.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.photoNote}>Paste Passport Size Photo</Text>
      </View>

      {/* Part A: Personal Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Part A: Personal Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{student.Name ?? '-'}</Text>
          <Text style={styles.label}>Roll No:</Text>
          <Text style={styles.value}>{student.Roll_no ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Programme:</Text>
          <Text style={styles.value}>{student.Course_name ?? '-'}</Text>
          <Text style={styles.label}>Mentor:</Text>
          <Text style={styles.value}>{student.MentorName ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Batch:</Text>
          <Text style={styles.value}>{student.Batch ?? '-'}</Text>
          <Text style={styles.label}>Mobile No:</Text>
          <Text style={styles.value}>{student.mobile_no ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{student.Email ?? '-'}</Text>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{student.Address ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Health Issues:</Text>
          <Text style={styles.value}>{mentorCard.any_helthissue ?? '-'}</Text>
          <Text style={styles.label}>Parents' Mobile:</Text>
          <Text style={styles.value}>{mentorCard.mobile_no_of_parents ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Local Guardian's Mobile:</Text>
          <Text style={styles.value}>{mentorCard.moble_no_of_localgurdent ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Parents' Name:</Text>
          <Text style={styles.value}>{mentorCard.name_of_pareents ?? '-'}</Text>
          <Text style={styles.label}>Local Guardian:</Text>
          <Text style={styles.value}>{mentorCard.name_of_localgurdian ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Present Address:</Text>
          <Text style={styles.value}>{mentorCard.present_address ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Parents' Email:</Text>
          <Text style={styles.value}>{mentorCard.email_of_parents ?? '-'}</Text>
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
  header: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  subtitle: { fontSize: 14, fontStyle: 'italic', color: '#7f8c8d' },
  avatar: {
    position: 'absolute', top: 0, right: 0,
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff',
    elevation: 3,
  },
  photoNote: {
    fontSize: 12, color: '#7f8c8d',
    position: 'absolute', top: 65, right: 0,
  },
  card: {
    borderWidth: 1, borderColor: '#dcdde1', borderRadius: 12,
    padding: 18, backgroundColor: '#fff', marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#34495e',
    borderBottomWidth: 1, borderColor: '#bdc3c7',
    marginBottom: 10, paddingBottom: 5,
  },
  row: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderBottomWidth: 0.5, borderColor: '#ecf0f1',
    paddingVertical: 8,
  },
  label: { width: '45%', fontWeight: '600', color: '#2c3e50', paddingHorizontal: 5, fontSize: 14 },
  value: { width: '50%', color: '#2d3436', paddingHorizontal: 5, fontSize: 14 },
  semesterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  semesterLabel: { width: 100, fontWeight: '600', color: '#2c3e50', fontSize: 13 },
  semesterValue: {
    width: 28, textAlign: 'center', color: '#2d3436',
    borderWidth: 1, borderColor: '#dfe6e9', marginHorizontal: 1,
    fontSize: 12, paddingVertical: 3, backgroundColor: '#f1f2f6', borderRadius: 4,
  },
});
