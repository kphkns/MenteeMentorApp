import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.158.136:5000';

export default function FacultyHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'completed', 'cancelled', 'failed'

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, activeFilter]);

  const fetchHistory = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/faculty/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterHistory = () => {
    if (activeFilter === 'all') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.status === activeFilter));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderStatusBadge = (status) => {
    const statusConfig = {
      cancelled: { color: '#EF4444', icon: 'close-circle', label: 'Cancelled' },
      completed: { color: '#10B981', icon: 'checkmark-circle', label: 'Completed' },
      failed: { color: '#F59E0B', icon: 'alert-circle', label: 'Failed' }
    };
    const config = statusConfig[status] || { color: '#3B82F6', icon: 'time', label: 'Pending' };

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => openModal(item)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.timeText}>{formatTime(item.time)}</Text>
          </View>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.studentRow}>
        <Ionicons name="person" size={16} color="#4F46E5" />
        <Text style={styles.studentText}>{item.student_name}</Text>
      </View>

      {item.status === 'cancelled' && (
        <View style={styles.statusDetailContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="person-remove" size={16} color="#EF4444" />
            <Text style={styles.detailText}>Cancelled by: {item.cancelled_by}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#EF4444" />
            <Text style={styles.detailText}>Reason: {item.cancel_reason || 'Not specified'}</Text>
          </View>
        </View>
      )}

      {item.status === 'completed' && (
        <View style={styles.statusDetailContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done" size={16} color="#10B981" />
            <Text style={[styles.detailText, { color: '#10B981' }]}>Successfully completed</Text>
          </View>
        </View>
      )}

      {item.status === 'failed' && (
        <View style={styles.statusDetailContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={[styles.detailText, { color: '#F59E0B' }]}>Appointment failed</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === 'all' && styles.activeFilterButtonText
          ]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'completed' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('completed')}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === 'completed' && styles.activeFilterButtonText
          ]}>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'cancelled' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('cancelled')}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === 'cancelled' && styles.activeFilterButtonText
          ]}>
            Cancelled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'failed' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('failed')}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === 'failed' && styles.activeFilterButtonText
          ]}>
            Failed
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.appointment_id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No {activeFilter !== 'all' ? activeFilter : ''} appointments found</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'all' 
                  ? 'Your completed and cancelled appointments will appear here'
                  : `No ${activeFilter} appointments in your history`}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Appointment Details</Text>
            {selectedItem && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={18} color="#4F46E5" />
                  <Text style={styles.modalText}>
                    {formatDate(selectedItem.date)} at {formatTime(selectedItem.time)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="person" size={18} color="#4F46E5" />
                  <Text style={styles.modalText}>{selectedItem.student_name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="timer" size={18} color="#4F46E5" />
                  <Text style={styles.modalText}>{selectedItem.duration} minutes</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons
                    name={selectedItem.meeting_mode === 'online' ? 'videocam' : 'business'}
                    size={18}
                    color="#4F46E5"
                  />
                  <Text style={styles.modalText}>
                    {selectedItem.meeting_mode === 'online' ? 'Virtual' : 'In-Person'} • {selectedItem.location}
                  </Text>
                </View>
                {selectedItem.message && (
                  <View style={styles.modalRow}>
                    <Ionicons name="document-text" size={18} color="#4F46E5" />
                    <Text style={styles.modalText}>{selectedItem.message}</Text>
                  </View>
                )}
                {selectedItem.status === 'cancelled' && (
                  <>
                    <View style={styles.modalRow}>
                      <Ionicons name="person-remove" size={18} color="#EF4444" />
                      <Text style={[styles.modalText, { color: '#EF4444' }]}>
                        Cancelled by: {selectedItem.cancelled_by}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Ionicons name="document-text" size={18} color="#EF4444" />
                      <Text style={[styles.modalText, { color: '#EF4444' }]}>
                        Reason: {selectedItem.cancel_reason || 'Not specified'}
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={18} color="#4F46E5" />
                  <Text style={styles.modalText}>
                    Created: {new Date(selectedItem.created_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="refresh" size={18} color="#4F46E5" />
                  <Text style={styles.modalText}>
                    Updated: {new Date(selectedItem.updated_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text style={styles.closeButtonText}>Close Details</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f2f6ff',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#f2f6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 8,
  },
  statusDetailContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginLeft: 10,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
