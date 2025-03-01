import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';

const MySubjectsScreen = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Fetch subjects when the component mounts
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Function to fetch the teacher's subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }
      
      const data = await api.teacher.getSubjects(token);
      setSubjects(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Failed to load subjects');
      setLoading(false);
    }
  };

  // Function to handle adding a new subject
  const handleAddSubject = async () => {
    // Validate inputs
    if (!subjectCode.trim()) {
      Alert.alert('Error', 'Subject Code is required');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    
    if (!schedule.trim()) {
      Alert.alert('Error', 'Schedule is required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        setSubmitting(false);
        return;
      }
      
      // Create the subject data object
      const subjectData = {
        subjectCode,
        description,
        schedule
      };
      
      // Call the API to create the subject
      await api.teacher.createSubject(token, subjectData);
      
      // Reset form fields
      setSubjectCode('');
      setDescription('');
      setSchedule('');
      
      // Close the modal
      setModalVisible(false);
      
      // Refresh the subjects list
      fetchSubjects();
      
      // Show success message
      Alert.alert('Success', 'Subject added successfully');
    } catch (err) {
      console.error('Error adding subject:', err);
      Alert.alert('Error', err.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle editing a subject
  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setSubjectCode(subject.subjectCode);
    setDescription(subject.description);
    setSchedule(subject.schedule);
    setEditModalVisible(true);
  };

  // Function to save edited subject
  const handleUpdateSubject = async () => {
    // Validate inputs
    if (!subjectCode.trim()) {
      Alert.alert('Error', 'Subject Code is required');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    
    if (!schedule.trim()) {
      Alert.alert('Error', 'Schedule is required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        setSubmitting(false);
        return;
      }
      
      // Create the subject data object
      const subjectData = {
        subjectCode,
        description,
        schedule
      };
      
      // Call the API to update the subject
      await api.teacher.updateSubject(token, selectedSubject.id, subjectData);
      
      // Reset form fields
      setSubjectCode('');
      setDescription('');
      setSchedule('');
      setSelectedSubject(null);
      
      // Close the modal
      setEditModalVisible(false);
      
      // Refresh the subjects list
      fetchSubjects();
      
      // Show success message
      Alert.alert('Success', 'Subject updated successfully');
    } catch (err) {
      console.error('Error updating subject:', err);
      Alert.alert('Error', err.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle deleting a subject
  const handleDeleteSubject = (subject) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${subject.subjectCode}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                Alert.alert('Error', 'Authentication token not found');
                return;
              }
              
              // Call the API to delete the subject
              await api.teacher.deleteSubject(token, subject.id);
              
              // Refresh the subjects list
              fetchSubjects();
              
              // Show success message
              Alert.alert('Success', 'Subject deleted successfully');
            } catch (err) {
              console.error('Error deleting subject:', err);
              Alert.alert('Error', err.message || 'Failed to delete subject');
            }
          }
        }
      ]
    );
  };

  // Function to generate a key code for a subject
  const handleGenerateKey = async (subject) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      // Show confirmation if a key already exists
      if (subject.keyCode) {
        Alert.alert(
          'Regenerate Key',
          'This will replace the existing key. Students using the old key will no longer be able to access this subject. Continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Regenerate',
              onPress: async () => {
                try {
                  // Call the API to generate a key
                  await api.teacher.generateSubjectKey(token, subject.id);
                  
                  // Refresh the subjects list
                  fetchSubjects();
                  
                  // Show success message
                  Alert.alert('Success', 'Key code regenerated successfully');
                } catch (err) {
                  console.error('Error generating key:', err);
                  Alert.alert('Error', err.message || 'Failed to generate key');
                }
              }
            }
          ]
        );
      } else {
        // Call the API to generate a key
        await api.teacher.generateSubjectKey(token, subject.id);
        
        // Refresh the subjects list
        fetchSubjects();
        
        // Show success message
        Alert.alert('Success', 'Key code generated successfully');
      }
    } catch (err) {
      console.error('Error generating key:', err);
      Alert.alert('Error', err.message || 'Failed to generate key');
    }
  };

  // Render a subject item
  const renderSubjectItem = (subject) => (
    <View key={subject.id} style={styles.subjectItem}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
        <Text style={styles.studentCount}>{subject.studentCount} students</Text>
      </View>
      <Text style={styles.subjectDescription}>{subject.description}</Text>
      <View style={styles.scheduleContainer}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.scheduleText}>{subject.schedule}</Text>
      </View>
      
      {/* Display key code if it exists */}
      {subject.keyCode ? (
        <View style={styles.keyCodeContainer}>
          <View style={styles.keyCodeHeader}>
            <Ionicons name="key-outline" size={16} color="#666" />
            <Text style={styles.keyCodeLabel}>Access Key:</Text>
          </View>
          <View style={styles.keyCodeValue}>
            <Text style={styles.keyCode}>{subject.keyCode}</Text>
            <TouchableOpacity 
              style={styles.regenerateButton}
              onPress={() => handleGenerateKey(subject)}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.regenerateButtonText}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.generateKeyContainer}>
          <TouchableOpacity 
            style={styles.generateKeyButton}
            onPress={() => handleGenerateKey(subject)}
          >
            <Ionicons name="key-outline" size={16} color="#fff" />
            <Text style={styles.generateKeyText}>Generate Access Key</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditSubject(subject)}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSubject(subject)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Subjects</Text>
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubjects}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          {subjects.length > 0 ? (
            subjects.map(renderSubjectItem)
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No subjects assigned yet</Text>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Add Subject Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Add Subject Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Subject Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS101"
              value={subjectCode}
              onChangeText={setSubjectCode}
              maxLength={10}
            />
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Computer Science"
              value={description}
              onChangeText={setDescription}
            />
            
            <Text style={styles.inputLabel}>Schedule</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MF, 1PM - 2PM"
              value={schedule}
              onChangeText={setSchedule}
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleAddSubject}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Adding...' : 'Add Subject'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Edit Subject Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Subject</Text>
              <TouchableOpacity onPress={() => {
                setEditModalVisible(false);
                setSelectedSubject(null);
                setSubjectCode('');
                setDescription('');
                setSchedule('');
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Subject Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS101"
              value={subjectCode}
              onChangeText={setSubjectCode}
              maxLength={10}
            />
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Computer Science"
              value={description}
              onChangeText={setDescription}
            />
            
            <Text style={styles.inputLabel}>Schedule</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MF, 1PM - 2PM"
              value={schedule}
              onChangeText={setSchedule}
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleUpdateSubject}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Updating...' : 'Update Subject'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#a0c4e8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#4a90e2',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  keyCodeContainer: {
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  keyCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  keyCodeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyCode: {
    fontSize: 22,
    fontFamily: 'monospace',
    letterSpacing: 2,
    color: '#333',
    fontWeight: 'bold',
  },
  regenerateButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  generateKeyContainer: {
    marginBottom: 12,
  },
  generateKeyButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateKeyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MySubjectsScreen; 