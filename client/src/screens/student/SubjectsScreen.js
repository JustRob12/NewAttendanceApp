import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const SubjectsScreen = () => {
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchKeyCode, setSearchKeyCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch enrolled subjects when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchEnrolledSubjects();
      return () => {
        // Clean up if needed
      };
    }, [])
  );
  
  // Fetch enrolled subjects
  const fetchEnrolledSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const subjects = await api.student.getEnrolledSubjects(token);
      setEnrolledSubjects(subjects);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching enrolled subjects:', err);
      setError(err.message || 'Failed to load enrolled subjects');
      setLoading(false);
    }
  };
  
  // Search for a subject by key code
  const searchSubject = async () => {
    if (!searchKeyCode.trim()) {
      Alert.alert('Input Required', 'Please enter a subject key code');
      return;
    }
    
    try {
      setLoadingSearch(true);
      setSearchResult(null);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoadingSearch(false);
        return;
      }
      
      const result = await api.student.searchSubjectByKey(token, searchKeyCode.trim());
      setSearchResult(result);
      setLoadingSearch(false);
    } catch (err) {
      console.error('Error searching for subject:', err);
      
      if (err.message === 'No subject found with this key code') {
        Alert.alert('Not Found', 'No subject found with this key code. Please check and try again.');
      } else {
        setError(err.message || 'Failed to search for subject');
      }
      
      setSearchResult(null);
      setLoadingSearch(false);
    }
  };
  
  // Enroll in a subject
  const enrollInSubject = async (subjectId) => {
    try {
      setLoadingSearch(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        setLoadingSearch(false);
        return;
      }
      
      await api.student.enrollInSubject(token, subjectId);
      
      // Clear search and refresh enrolled subjects
      setSearchKeyCode('');
      setSearchResult(null);
      await fetchEnrolledSubjects();
      
      Alert.alert('Success', 'You have successfully enrolled in this subject');
      setLoadingSearch(false);
    } catch (err) {
      console.error('Error enrolling in subject:', err);
      Alert.alert('Error', err.message || 'Failed to enroll in subject');
      setLoadingSearch(false);
    }
  };
  
  // Render each enrolled subject
  const renderSubjectItem = ({ item }) => (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectCode}>{item.subjectCode}</Text>
        <Text style={styles.enrollDate}>
          Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.subjectDescription}>{item.description}</Text>
      
      <View style={styles.subjectDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.schedule}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.teacher}</Text>
        </View>
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>Enroll in a New Subject</Text>
        
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Subject Key Code"
            value={searchKeyCode}
            onChangeText={setSearchKeyCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={searchSubject}
            disabled={loadingSearch}
          >
            {loadingSearch ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {searchResult && (
          <View style={styles.searchResultCard}>
            <Text style={styles.resultSubjectCode}>{searchResult.subjectCode}</Text>
            <Text style={styles.resultDescription}>{searchResult.description}</Text>
            
            <View style={styles.resultDetails}>
              <View style={styles.resultDetailItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.resultDetailText}>{searchResult.schedule}</Text>
              </View>
              
              <View style={styles.resultDetailItem}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.resultDetailText}>{searchResult.teacher}</Text>
              </View>
            </View>
            
            {searchResult.isEnrolled ? (
              <View style={styles.alreadyEnrolledBadge}>
                <Text style={styles.alreadyEnrolledText}>Already Enrolled</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.enrollButton} 
                onPress={() => enrollInSubject(searchResult.id)}
                disabled={loadingSearch}
              >
                {loadingSearch ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.enrollButtonText}>Enroll Now</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.enrolledContainer}>
        <Text style={styles.title}>My Enrolled Subjects</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Loading subjects...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchEnrolledSubjects}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : enrolledSubjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>You haven't enrolled in any subjects yet</Text>
            <Text style={styles.emptySubText}>
              Use the search above to find and enroll in subjects
            </Text>
          </View>
        ) : (
          <FlatList
            data={enrolledSubjects}
            renderItem={renderSubjectItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResultCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultSubjectCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resultDescription: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
    marginBottom: 12,
  },
  resultDetails: {
    marginBottom: 16,
  },
  resultDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  enrollButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alreadyEnrolledBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  alreadyEnrolledText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  enrolledContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subjectCard: {
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
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  enrollDate: {
    fontSize: 12,
    color: '#888',
  },
  subjectDescription: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12,
  },
  subjectDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default SubjectsScreen; 