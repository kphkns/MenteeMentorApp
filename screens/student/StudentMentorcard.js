import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SERVER_URL = "http://192.168.84.136:5000";

export default function StudentMentorCardScreen() {
  const [mentorCard, setMentorCard] = useState(null);
  const [monitoringSessions, setMonitoringSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
   const fetchData = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    
    // Fetch mentor card
    const cardRes = await axios.get(`${SERVER_URL}/api/student-mentor-card`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!cardRes.data) {
      throw new Error("No mentor card data received");
    }
    setMentorCard(cardRes.data);
    
    // Fetch monitoring sessions
    setSessionsLoading(true);
    const sessionsRes = await axios.get(
      `${SERVER_URL}/api/student-monitoring-sessions`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Sessions data is already sorted by the backend
    setMonitoringSessions(sessionsRes.data || []);
    
  } catch (error) {
    let errorMessage = "Could not fetch data";
    
    if (error.response) {
      errorMessage = error.response.data.message || 
                   `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "No response from server. Check your connection.";
    } else {
      errorMessage = error.message;
    }
    
    Alert.alert("Error", errorMessage);
  } finally {
    setLoading(false);
    setSessionsLoading(false);
  }
};

    fetchData();
  }, []);

  const handleDownload = async () => {
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              padding: 24px;
              background-color: #fff;
            }
            h1 {
              color: #6366f1;
              font-size: 24px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            h2 {
              color: #334155;
              font-size: 18px;
              margin-top: 30px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .label {
              font-weight: 600;
              color: #475569;
            }
            .row {
              margin-bottom: 10px;
              font-size: 14px;
            }
            .part-a-box {
              border: 1px solid #e2e8f0;
              padding: 20px;
              background-color: #f8fafc;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .part-b-box {
              padding: 10px 12px;
              overflow: hidden;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              max-width: 800px;
              font-size: 12px;
              margin: auto;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              text-align: center;
              word-wrap: break-word;
            }
            th {
              background-color: #6366f1;
              color: white;
              font-weight: 600;
            }
            .metric-cell {
              width: 160px;
              white-space: nowrap;
              text-align: left;
              padding-left: 8px;
              font-weight: 600;
              vertical-align: middle;
              background-color: #f1f5f9;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
          </style>
        </head>
        <body>
          <h1>Student Mentoring Record Card</h1>
          <h2>Part A: Personal Details</h2>
          <div class="part-a-box">
            ${renderHTMLDetails(mentorCard)}
          </div>
          <h2>Part B: Academic Progress</h2>
          <div class="part-b-box">
            ${renderHTMLTable(mentorCard)}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `${FileSystem.documentDirectory}MentorCard_${mentorCard.Roll_no}.pdf`;
    await FileSystem.moveAsync({ from: uri, to: fileName });
    await Sharing.shareAsync(fileName);
  };

  const renderHTMLDetails = (data) => {
    const fields = [
      ["Name of the Student", data.student_name],
      ["Roll No. of Student", data.Roll_no],
      ["Programme of Study", data.course_name],
      ["Name of Mentor", data.faculty_name],
      ["Phone", data.mobile_no],
      ["Email", data.Email],
      ["Local Guardian Name", data.name_of_localgurdian],
      ["Local Guardian Contact", data.moble_no_of_localgurdent],
      ["Parents' Name", data.name_of_pareents],
      ["Parents' Mobile", data.mobile_no_of_parents],
      ["Parents' Email", data.email_of_parents],
      ["Present Address", data.present_address],
      ["Health/Other Issues", data.any_helthissue],
    ];
    return fields
      .map(
        ([label, value]) =>
          `<div class="row"><span class="label">${label}:</span> ${value || "N/A"}</div>`
      )
      .join("");
  };

  const renderHTMLTable = (data) => {
    const keys = [
      "sgpa",
      "cgpa",
      "co_curricular",
      "difficulty_faced",
      "disciplinary_action",
    ];
    const rows = keys
      .map(
        (key) =>
          `<tr><td class="metric-cell">${key.replace(/_/g, " ").toUpperCase()}</td>` +
          [...Array(10)]
            .map((_, i) => `<td>${data[`${key}_sem${i + 1}`] || "—"}</td>`)
            .join("") +
          `</tr>`
      )
      .join("");
    return `
      <table>
        <tr>
          <th class="metric-cell">Semester</th>
          ${[...Array(10)].map((_, i) => `<th>Sem ${i + 1}</th>`).join("")}
        </tr>
        ${rows}
      </table>
    `;
  };

  const renderSessionCard = (session) => (
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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading mentor card...</Text>
      </View>
    );
  }

  if (!mentorCard) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Mentor card not available</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#818cf8']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Student Mentor Card</Text>
        <Text style={styles.headerSubtitle}>{mentorCard.student_name}</Text>
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
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeTab === 'personal' ? (
          <View style={styles.personalDetailsContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Student Information</Text>
              <DetailRow icon="person" label="Name" value={mentorCard.student_name} />
              <DetailRow icon="pricetag-outline" label="Roll No" value={mentorCard.Roll_no} />
              <DetailRow icon="school" label="Course" value={mentorCard.course_name} />
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Contact Details</Text>
              <DetailRow icon="call" label="Phone" value={mentorCard.mobile_no} />
              <DetailRow icon="mail" label="Email" value={mentorCard.Email} />
              <DetailRow icon="location" label="Address" value={mentorCard.present_address} />
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Family Information</Text>
              <DetailRow icon="people" label="Parents' Name" value={mentorCard.name_of_pareents} />
              <DetailRow icon="call" label="Parents' Phone" value={mentorCard.mobile_no_of_parents} />
              <DetailRow icon="mail" label="Parents' Email" value={mentorCard.email_of_parents} />
              <DetailRow icon="person" label="Guardian Name" value={mentorCard.name_of_localgurdian} />
              <DetailRow icon="call" label="Guardian Phone" value={mentorCard.moble_no_of_localgurdent} />
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <DetailRow icon="medical" label="Health Issues" value={mentorCard.any_helthissue || 'None'} />
              <DetailRow icon="person" label="Mentor" value={mentorCard.faculty_name} />
            </View>
          </View>
        ) : activeTab === 'academic' ? (
          <View style={styles.academicContainer}>
            <Text style={styles.academicTitle}>Academic Progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Metric</Text>
                  {[...Array(10)].map((_, i) => (
                    <Text key={`semHead${i}`} style={styles.tableHeaderCell}>
                      Sem {i + 1}
                    </Text>
                  ))}
                </View>
                {["sgpa", "cgpa", "co_curricular", "difficulty_faced", "disciplinary_action"].map((key) => (
                  <View key={key} style={styles.tableRow}>
                    <Text style={styles.tableMetricCell}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </Text>
                    {[...Array(10)].map((_, i) => (
                      <Text key={`${key}_sem${i}`} style={styles.tableValueCell}>
                        {mentorCard[`${key}_sem${i + 1}`] || "—"}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
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
              monitoringSessions.map(renderSessionCard)
            )}
          </View>
        )}

        {/* Download Button */}
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Feather name="download" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={18} color="#6366f1" />
    </View>
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value || "N/A"}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginTop: 16,
    marginBottom: 8,
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  personalDetailsContainer: {
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  academicContainer: {
    marginTop: 8,
  },
  academicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderCell: {
    width: 80,
    paddingVertical: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableMetricCell: {
    width: 120,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  tableValueCell: {
    width: 80,
    paddingVertical: 12,
    textAlign: 'center',
    color: '#475569',
    backgroundColor: '#fff',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
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
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
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