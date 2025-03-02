import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [uploading, setUploading] = useState(false);

  // Function to retry loading the profile
  const retryLoading = () => {
    setLoading(true);
    setError(null);
    fetchStudentProfile();
  };

  const fetchStudentProfile = async () => {
    try {
      // Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      const userType = await AsyncStorage.getItem('userType');
      const userId = await AsyncStorage.getItem('userId');
      
      setDebugInfo(`Token: ${token ? 'Found' : 'Not found'}, UserType: ${userType || 'Not found'}, UserId: ${userId || 'Not found'}`);
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      if (userType !== 'student') {
        setError('This profile is only accessible to students.');
        setLoading(false);
        return;
      }

      // Fetch student profile using the API service
      console.log('Fetching student profile with token:', token);
      const studentData = await api.student.getProfile(token);
      console.log('Student data received:', studentData);
      
      setStudent(studentData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError(err.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  // Request permission for accessing the image library
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
        return false;
      }
      return true;
    }
    return true;
  };

  // Select and upload profile picture
  const handleSelectProfilePicture = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Upload the selected image
  const uploadProfilePicture = async (imageUri) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        setUploading(false);
        return;
      }

      // Create form data for image upload
      const formData = new FormData();
      const fileExtension = imageUri.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExtension}`;
      
      formData.append('profilePicture', {
        uri: imageUri,
        name: fileName,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
      });

      // Upload the image
      await api.student.uploadProfilePicture(token, formData);
      
      // Refresh the profile to show the new image
      fetchStudentProfile();
      
      Alert.alert('Success', 'Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!student?.profileImage) return;
    
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              const token = await AsyncStorage.getItem('userToken');
              
              if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please log in again.');
                setUploading(false);
                return;
              }

              await api.student.deleteProfilePicture(token);
              
              // Refresh the profile
              fetchStudentProfile();
              
              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error) {
              console.error('Error deleting profile picture:', error);
              Alert.alert('Error', error.message || 'Failed to delete profile picture');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (uploading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Updating profile picture...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Student Profile</Text>
      
      {student ? (
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            {student.profileImage ? (
              <View style={styles.profileImageContainer}>
                <Image 
                  source={{ uri: `http://192.168.1.9:5000/uploads/student_profile_pictures/${student.profileImage}` }}
                  style={styles.profileImage}
                />
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={handleSelectProfilePicture}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={handleDeleteProfilePicture}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.profileAvatar}
                onPress={handleSelectProfilePicture}
              >
                <Text style={styles.avatarText}>
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </Text>
                <View style={styles.addPhotoButton}>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            <Text style={styles.profileName}>
              {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
            </Text>
            <Text style={styles.profileId}>Student ID: {student.studentId}</Text>
            <Text style={styles.profileCourse}>Course: {student.course}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username:</Text>
              <Text style={styles.infoValue}>{student.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name:</Text>
              <Text style={styles.infoValue}>
                {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student ID:</Text>
              <Text style={styles.infoValue}>{student.studentId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Course:</Text>
              <Text style={styles.infoValue}>{student.course}</Text>
            </View>
          </View>
          
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={24} color="#4a90e2" />
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={24} color="#4a90e2" />
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#4caf50" />
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Profile data not available</Text>
        </View>
      )}
    </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4caf50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4a90e2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  profileId: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileCourse: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  statsSection: {
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default ProfileScreen; 