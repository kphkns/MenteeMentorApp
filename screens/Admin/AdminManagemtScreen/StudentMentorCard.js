import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function StudentDetailsScreen({ route }) {
  const { student } = route.params;
  const [mentorCard, setMentorCard] = useState(null);
  const [monitoringSessions, setMonitoringSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const enableAutoRotation = async () => {
      await ScreenOrientation.unlockAsync();
    };

    enableAutoRotation();
    fetchMentorCard();
    fetchMonitoringSessions();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  const fetchMentorCard = async () => {
    try {
      const response = await fetch(`http://192.168.158.136:5000/mentor-card/${student.Student_id}`);
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

  const fetchMonitoringSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch(
        `http://192.168.158.136:5000/mentor-card/monitoring-session/${student.Student_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sortedSessions = data.sort((a, b) =>
        new Date(b.date_of_monitoring) - new Date(a.date_of_monitoring)
      );
      setMonitoringSessions(sortedSessions);
    } catch (error) {
      console.log('Fetch monitoring sessions:', error.message);
      setMonitoringSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Download mentor card as JSON
  const handleDownload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + `mentor_card_${student.Roll_no}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(mentorCard, null, 2));
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to download mentor card.');
    }
  };

  const renderSemesterHeader = () => (
    <View style={styles.semesterHeader}>
      <Text style={styles.semesterHeaderLabel}>Semester</Text>
      <View style={styles.semesterHeaderRow}>
        {[...Array(10)].map((_, i) => (
          <Text key={i} style={styles.semesterHeaderValue}>S{i + 1}</Text>
        ))}
      </View>
    </View>
  );

  const renderSemesterData = (label, keyPrefix, iconName) => (
    <View style={styles.semesterRow}>
      <View style={styles.semesterLabelContainer}>
        <MaterialIcons name={iconName} size={18} color="#6366f1" style={styles.semesterIcon} />
        <Text style={styles.semesterLabel}>{label}</Text>
      </View>
      <View style={styles.semesterValuesContainer}>
        {[...Array(10)].map((_, i) => {
          const key = `${keyPrefix}${i + 1}`;
          return (
            <Text key={i} style={styles.semesterValue}>{mentorCard?.[key] || '-'}</Text>
          );
        })}
      </View>
    </View>
  );

  const renderMonitoringSession = (session) => (
    <View key={session.m_id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>
          {new Date(session.date_of_monitoring).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      <Text style={styles.sessionTitle}>Discussion Points</Text>
      <Text style={styles.sessionContent}>{session.high_points}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (!mentorCard) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>No mentor card data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMentorCard}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#818cf8']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.headerTitle}>{student.Name}</Text>
          <Text style={styles.headerSubtitle}>{student.Roll_no} • {student.Course_name}</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={activeTab === 'personal' ? '#6366f1' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
              Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'academic' && styles.activeTab]}
            onPress={() => setActiveTab('academic')}
          >
            <Ionicons
              name="school-outline"
              size={20}
              color={activeTab === 'academic' ? '#6366f1' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'academic' && styles.activeTabText]}>
              Academic
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => setActiveTab('sessions')}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={activeTab === 'sessions' ? '#6366f1' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
              Sessions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'personal' ? (
          <View style={styles.personalDetailsContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Student Information</Text>
              </View>
              <DetailRow
                icon="pricetag-outline"
                label="Roll Number"
                value={student.Roll_no}
              />
              <DetailRow
                icon="school"
                label="Program"
                value={student.Course_name}
              />
              <DetailRow
                icon="people"
                label="Mentor"
                value={student.Faculty_name}
              />
              <DetailRow
                icon="calendar"
                label="Batch"
                value={student.batch_name}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="call-outline" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Contact Information</Text>
              </View>
              <DetailRow
                icon="phone-portrait"
                label="Phone"
                value={student.mobile_no}
              />
              <DetailRow
                icon="mail"
                label="Email"
                value={student.Email}
              />
              <DetailRow
                icon="location"
                label="Address"
                value={mentorCard.present_address}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people-outline" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Family Information</Text>
              </View>
              <DetailRow
                icon="person"
                label="Parents' Name"
                value={mentorCard.name_of_pareents}
              />
              <DetailRow
                icon="call"
                label="Parents' Phone"
                value={mentorCard.mobile_no_of_parents}
              />
              <DetailRow
                icon="mail"
                label="Parents' Email"
                value={mentorCard.email_of_parents}
              />
              <DetailRow
                icon="person"
                label="Guardian Name"
                value={mentorCard.name_of_localgurdian}
              />
              <DetailRow
                icon="call"
                label="Guardian Phone"
                value={mentorCard.moble_no_of_localgurdent}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="medical-outline" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Additional Information</Text>
              </View>
              <DetailRow
                icon="alert-circle"
                label="Health Issues"
                value={mentorCard.any_helthissue}
              />
            </View>
          </View>
        ) : activeTab === 'academic' ? (
          <View style={styles.academicContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart-outline" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Academic Progress</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {renderSemesterHeader()}
                  {renderSemesterData('SGPA', 'sgpa_sem', 'trending-up')}
                  {renderSemesterData('CGPA', 'cgpa_sem', 'trending-up')}
                  {renderSemesterData('Co-Curricular', 'co_curricular_sem', 'emoji-events')}
                  {renderSemesterData('Difficulties', 'difficulty_faced_sem', 'military-tech')}
                  {renderSemesterData('Disciplinary', 'disciplinary_action_sem', 'error-outline')}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            {sessionsLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loadingIndicator} />
            ) : monitoringSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>No monitoring sessions found</Text>
              </View>
            ) : (
              monitoringSessions.map(renderMonitoringSession)
            )}
          </View>
        )}

        {/* Download Button */}
        {/* <TouchableOpacity
          style={styles.saveButton}
          onPress={handleDownload}
        >
          <Feather name="download" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Download Mentor Card</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconContainer}>
      <Ionicons name={icon} size={18} color="#6366f1" />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={2}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 30,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },
  semesterHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  semesterHeaderLabel: {
    width: 140,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  semesterHeaderRow: {
    flexDirection: 'row',
  },
  semesterHeaderValue: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  semesterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  semesterLabelContainer: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
  },
  semesterIcon: {
    marginRight: 8,
  },
  semesterLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  semesterValuesContainer: {
    flexDirection: 'row',
  },
  semesterValue: {
    width: 60,
    height: 36,
    textAlign: 'center',
    paddingVertical: 8,
    color: '#1e293b',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  sessionContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  facultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  facultyText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 40,
  },
});
