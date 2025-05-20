import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const SERVER_URL = "http://192.168.65.136:5000";

export default function StudentMentorCardScreen() {
  const [mentorCard, setMentorCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentorCard = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const res = await axios.get(`${SERVER_URL}/api/student-mentor-card`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMentorCard(res.data);
      } catch (error) {
        Alert.alert("Error", "Could not fetch mentor card.");
      } finally {
        setLoading(false);
      }
    };

    fetchMentorCard();
  }, []);

  const handleDownload = async () => {
  const html = `
    <html>
      <head>
          <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          padding: 24px;
          background-color: #fff;
        }
        h1 {
          color: #007bff;
          font-size: 24px;
          margin-bottom: 10px;
        }
        h2 {
          color: #333;
          font-size: 20px;
          margin-top: 30px;
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
        }
        .row {
          margin-bottom: 10px;
          font-size: 14px;
        }
        .part-a-box {
          border: 1px solid #ccc;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
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
          font-size: 11px;
          margin: auto;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #666;
          padding: 6px;
          text-align: center;
          word-wrap: break-word;
        }
        th {
          background-color: #007bff;
          color: white;
        }
        .metric-cell {
          width: 160px;
          white-space: nowrap;
          text-align: left;
          padding-left: 8px;
          font-weight: bold;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        tr:hover {
          background-color: #e6f7ff;
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


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!mentorCard) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>Mentor card not available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.title}>Student Mentoring Record Card</Text>
        <Text style={styles.subtitle}>(To be retained by the Mentor)</Text>
      </View>

      {/* Part A */}
      <Text style={styles.sectionHeader}>Part A: Personal Details</Text>
      <View style={styles.partABox}>
        <View style={styles.infoGrid}>
          <LabelValue label="Name" value={mentorCard.student_name} />
          <LabelValue label="Roll No" value={mentorCard.Roll_no} />
          <LabelValue label="Course" value={mentorCard.course_name} />
          <LabelValue label="Mentor" value={mentorCard.faculty_name} />
          <LabelValue label="Phone" value={mentorCard.mobile_no} />
          <LabelValue label="Email" value={mentorCard.Email} />
          <LabelValue label="Guardian Name" value={mentorCard.name_of_localgurdian} />
          <LabelValue label="Guardian Phone" value={mentorCard.moble_no_of_localgurdent} />
          <LabelValue label="Parents' Name" value={mentorCard.name_of_pareents} />
          <LabelValue label="Parents' Phone" value={mentorCard.mobile_no_of_parents} />
          <LabelValue label="Parents' Email" value={mentorCard.email_of_parents} />
          <LabelValue label="Address" value={mentorCard.present_address} />
          <LabelValue label="Health Issues" value={mentorCard.any_helthissue} />
        </View>
      </View>

      {/* Part B */}
      <Text style={styles.sectionHeader}>Part B: Academic Progress</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.tableRow}>
            <Text style={styles.semLabel}>Semester</Text>
            {[...Array(10)].map((_, i) => (
              <Text key={`semHead${i}`} style={styles.semHeader}>
                Sem {i + 1}
              </Text>
            ))}
          </View>
          {["sgpa", "cgpa", "co_curricular", "difficulty_faced", "disciplinary_action"].map((key) => (
            <View key={key} style={styles.tableRow}>
              <Text style={styles.semLabel}>{key.replace(/_/g, " ").toUpperCase()}</Text>
              {[...Array(10)].map((_, i) => (
                <Text key={`${key}_sem${i}`} style={styles.semValue}>
                  {mentorCard[`${key}_sem${i + 1}`] || "—"}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={{ marginVertical: 20 }}>
        <Button title="Download PDF" onPress={handleDownload} color="#28a745" />
      </View>
    </ScrollView>
  );
}

const LabelValue = ({ label, value }) => (
  <View style={styles.labelValueRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f2f6ff",
  },
  headerBox: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007bff",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  partABox: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  labelValueRow: {
    width: "48%",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
semLabel: {
  width: 120,
  fontWeight: "600",
  color: "#333",
  paddingVertical: 6,
  paddingHorizontal: 4,
  backgroundColor: "#dee2e6",
  borderWidth: 1,
  borderColor: "#ccc",
  textAlign: "center",
},
semHeader: {
  width: 80,
  fontWeight: "700",
  textAlign: "center",
  backgroundColor: "#007bff",
  color: "#fff",
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "#007bff",
},
semValue: {
  width: 80,
  textAlign: "center",
  paddingVertical: 6,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ccc",
},

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
