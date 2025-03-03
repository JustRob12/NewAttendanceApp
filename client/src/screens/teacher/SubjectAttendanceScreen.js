import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';

const SubjectAttendanceScreen = ({ route, navigation }) => {
  const { subject } = route.params;
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingStatuses, setSavingStatuses] = useState({});
  
  // Fetch students enrolled in the subject and existing attendance
  useEffect(() => {
    if (selectedDate) {
      fetchStudents();
    }
  }, [selectedDate]);
  
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Fetch students
      const studentData = await api.teacher.getSubjectStudents(token, subject.id);
      setStudents(studentData);
      
      // Fetch existing attendance records for this date
      try {
        const attendanceData = await api.teacher.getSubjectAttendance(token, subject.id, selectedDate);
        
        // Create a map of student ID to attendance record
        const recordMap = {};
        attendanceData.forEach(record => {
          recordMap[record.studentId] = {
            status: record.status,
            notes: record.notes || '',
            saved: true
          };
        });
        
        setAttendanceRecords(recordMap);
      } catch (attErr) {
        console.error('Error fetching attendance records:', attErr);
        // Continue with empty records if we can't fetch existing ones
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
      setLoading(false);
    }
  };
  
  // Set attendance status for a student and save immediately
  const setAttendanceStatus = async (studentId, status) => {
    try {
      // Update UI state immediately
      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          status,
          saving: true
        }
      }));
      
      // Mark this student as saving
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: true
      }));
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        // Revert UI state
        setAttendanceRecords(prev => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId] || {}),
            saving: false
          }
        }));
        setSavingStatuses(prev => ({
          ...prev,
          [studentId]: false
        }));
        return;
      }
      
      // Save to server
      const notes = attendanceRecords[studentId]?.notes || '';
      
      await api.teacher.recordSubjectAttendance(token, subject.id, {
        studentId,
        date: selectedDate,
        status,
        notes
      });
      
      // Update state to reflect saved
      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          status,
          notes,
          saved: true,
          saving: false
        }
      }));
      
      // Mark as no longer saving
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: false
      }));
      
    } catch (err) {
      console.error('Error saving attendance status:', err);
      Alert.alert('Error', err.message || 'Failed to save attendance');
      
      // Revert UI state
      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          saving: false
        }
      }));
      
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: false
      }));
    }
  };
  
  // Set notes for a student
  const setStudentNotes = (studentId, notes) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        notes,
        saved: false
      }
    }));
  };
  
  // Save notes for a student
  const saveStudentNotes = async (studentId) => {
    try {
      // If no status is set yet, default to present
      const status = attendanceRecords[studentId]?.status || 'present';
      const notes = attendanceRecords[studentId]?.notes || '';
      
      // Mark as saving
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: true
      }));
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        setSavingStatuses(prev => ({
          ...prev,
          [studentId]: false
        }));
        return;
      }
      
      await api.teacher.recordSubjectAttendance(token, subject.id, {
        studentId,
        date: selectedDate,
        status,
        notes
      });
      
      // Update state to reflect saved
      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          status,
          notes,
          saved: true
        }
      }));
      
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: false
      }));
      
    } catch (err) {
      console.error('Error saving notes:', err);
      Alert.alert('Error', err.message || 'Failed to save notes');
      
      setSavingStatuses(prev => ({
        ...prev,
        [studentId]: false
      }));
    }
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  
  // Render each student item
  const renderStudentItem = ({ item }) => {
    const record = attendanceRecords[item.id] || { status: null, notes: '', saved: true };
    const isSaving = savingStatuses[item.id] || false;
    
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
          </Text>
          <Text style={styles.studentId}>ID: {item.studentId}</Text>
          <Text style={styles.studentCourse}>Course: {item.course}</Text>
          
          {/* Status indicator */}
          {record.saved && record.status && (
            <View style={[
              styles.savedIndicator,
              record.status === 'present' && styles.savedIndicatorPresent,
              record.status === 'late' && styles.savedIndicatorLate,
              record.status === 'absent' && styles.savedIndicatorAbsent
            ]}>
              <Text style={styles.savedIndicatorText}>
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.attendanceControls}>
          <Text style={styles.attendanceLabel}>
            Attendance:
            {isSaving && (
              <ActivityIndicator 
                size="small" 
                color="#4a90e2" 
                style={styles.savingIndicator}
              />
            )}
          </Text>
          
          <View style={styles.attendanceButtons}>
            <TouchableOpacity 
              style={[
                styles.statusButton,
                record.status === 'present' && styles.statusButtonActive
              ]}
              onPress={() => setAttendanceStatus(item.id, 'present')}
              disabled={isSaving}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={record.status === 'present' ? '#fff' : '#4caf50'} 
              />
              <Text style={[
                styles.statusText,
                record.status === 'present' && styles.statusTextActive
              ]}>Present</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.statusButton,
                record.status === 'late' && styles.statusButtonLate
              ]}
              onPress={() => setAttendanceStatus(item.id, 'late')}
              disabled={isSaving}
            >
              <Ionicons 
                name="time" 
                size={24} 
                color={record.status === 'late' ? '#fff' : '#ff9800'} 
              />
              <Text style={[
                styles.statusText,
                record.status === 'late' && styles.statusTextActive
              ]}>Late</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.statusButton,
                record.status === 'absent' && styles.statusButtonAbsent
              ]}
              onPress={() => setAttendanceStatus(item.id, 'absent')}
              disabled={isSaving}
            >
              <Ionicons 
                name="close-circle" 
                size={24} 
                color={record.status === 'absent' ? '#fff' : '#f44336'} 
              />
              <Text style={[
                styles.statusText,
                record.status === 'absent' && styles.statusTextActive
              ]}>Absent</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes (optional)"
              value={record.notes}
              onChangeText={(text) => setStudentNotes(item.id, text)}
              onEndEditing={() => saveStudentNotes(item.id)}
              multiline={true}
              disabled={isSaving}
            />
            {!record.saved && !isSaving && record.notes && (
              <TouchableOpacity 
                style={styles.saveNotesButton}
                onPress={() => saveStudentNotes(item.id)}
              >
                <Ionicons name="save-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subject Attendance</Text>
        <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
        <Text style={styles.subjectDescription}>{subject.description}</Text>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date:</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            value={selectedDate}
            onChangeText={handleDateChange}
          />
        </View>
      </View>
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No students enrolled in this subject</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.studentCountText}>
            {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
          </Text>
          
          <View style={styles.statusLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, styles.legendIndicatorPresent]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, styles.legendIndicatorLate]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, styles.legendIndicatorAbsent]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
          </View>
          
          <FlatList
            data={students}
            renderItem={renderStudentItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Attendance is saved automatically when you tap a status button.
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subjectCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a90e2',
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  studentCountText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  statusLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendIndicatorPresent: {
    backgroundColor: '#4caf50',
  },
  legendIndicatorLate: {
    backgroundColor: '#ff9800',
  },
  legendIndicatorAbsent: {
    backgroundColor: '#f44336',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentInfo: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    position: 'relative',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#666',
  },
  studentCourse: {
    fontSize: 14,
    color: '#666',
  },
  savedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  savedIndicatorPresent: {
    backgroundColor: '#4caf50',
  },
  savedIndicatorLate: {
    backgroundColor: '#ff9800',
  },
  savedIndicatorAbsent: {
    backgroundColor: '#f44336',
  },
  savedIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendanceControls: {
    marginTop: 8,
  },
  attendanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingIndicator: {
    marginLeft: 8,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  statusButtonLate: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  statusButtonAbsent: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  statusTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  notesContainer: {
    position: 'relative',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#fff',
    minHeight: 40,
    paddingRight: 40,
  },
  saveNotesButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#4a90e2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e8f4fd',
    borderTopWidth: 1,
    borderTopColor: '#d0e8f9',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default SubjectAttendanceScreen; 