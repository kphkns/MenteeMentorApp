// FacultyComposeMessageScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function FacultyComposeMessageScreen() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`http://192.168.158.136:5000/api/faculty/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load students');
      console.error(error);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }
  };

  const handleSend = async () => {
    if (!selectedStudent || !subject || !body) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();

      formData.append('receiver_id', selectedStudent.Student_id);
      formData.append('receiver_role', 'student');
      formData.append('subject', subject);
      formData.append('body', body);
      if (linkUrl) formData.append('link_url', linkUrl);
      if (attachment) {
        formData.append('attachment', {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.mimeType || 'application/octet-stream',
        });
      }

      await axios.post('http://192.168.158.136:5000/api/messages/send', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Message sent!');
      setSubject('');
      setBody('');
      setAttachment(null);
      setLinkUrl('');
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compose Message</Text>

      <Text style={styles.label}>To (Student)</Text>
      {students.map(student => (
        <TouchableOpacity
          key={student.Student_id}
          style={[
            styles.studentOption,
            selectedStudent?.Student_id === student.Student_id && styles.selectedStudent
          ]}
          onPress={() => setSelectedStudent(student)}
        >
          <Text>{student.Name}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
        placeholder="Enter subject"
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={body}
        onChangeText={setBody}
        placeholder="Enter message"
        multiline
      />

      <Text style={styles.label}>Optional Link</Text>
      <TextInput
        style={styles.input}
        value={linkUrl}
        onChangeText={setLinkUrl}
        placeholder="https://example.com"
      />

      <TouchableOpacity style={styles.attachmentBtn} onPress={pickDocument}>
        <Text>{attachment ? `\uD83D\uDCCE ${attachment.name}` : 'Attach File or Image'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send Message</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 16, marginTop: 10, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8
  },
  studentOption: {
    padding: 10, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, marginBottom: 5
  },
  selectedStudent: {
    backgroundColor: '#e0f7fa', borderColor: '#00acc1'
  },
  attachmentBtn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 6,
    alignItems: 'center'
  },
  sendBtn: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});