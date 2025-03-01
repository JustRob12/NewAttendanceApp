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
  Platform,
  TextInput,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  // Function to retry loading the profile
  const retryLoading = () => {
    setLoading(true);
    setError(null);
    fetchTeacherProfile();
  };

  const fetchTeacherProfile = async () => {
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

      if (userType !== 'teacher') {
        setError('This profile is only accessible to teachers.');
        setLoading(false);
        return;
      }

      // Fetch teacher profile using the API service
      console.log('Fetching teacher profile with token:', token);
      const teacherData = await api.teacher.getProfile(token);
      console.log('Teacher data received:', teacherData);
      
      setTeacher(teacherData);
      setEmail(teacherData.email || '');
      setPhone(teacherData.phone || '');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher profile:', err);
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

      if (!result.cancelled && result.assets && result.assets.length > 0) {
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
      const response = await api.teacher.uploadProfilePicture(token, formData);
      
      // Refresh the profile to show the new image
      fetchTeacherProfile();
      
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
    if (!teacher?.profileImage) return;
    
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

              await api.teacher.deleteProfilePicture(token);
              
              // Refresh the profile
              fetchTeacherProfile();
              
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

  // Handle edit profile button click
  const handleEditProfile = () => {
    setEmail(teacher.email || '');
    setPhone(teacher.phone || '');
    setEditModalVisible(true);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address or leave it blank.');
        return;
      }

      setUpdating(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        setUpdating(false);
        return;
      }

      const profileData = {
        email: email.trim() || null,
        phone: phone.trim() || null
      };

      await api.teacher.updateProfile(token, profileData);
      
      // Close the modal and refresh the profile
      setEditModalVisible(false);
      fetchTeacherProfile();
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchTeacherProfile();
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Teacher Profile</Text>
      
      {teacher ? (
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            {uploading ? (
              <View style={styles.profileAvatar}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : teacher.profileImage ? (
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: teacher.profileImage }}
                  style={styles.profileImage}
                />
                <View style={styles.avatarActionsRow}>
                  <TouchableOpacity 
                    style={styles.avatarAction}
                    onPress={handleSelectProfilePicture}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.avatarActionText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.avatarAction, styles.avatarActionDelete]}
                    onPress={handleDeleteProfilePicture}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.avatarActionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileContainer}>
                <TouchableOpacity 
                  style={styles.profileAvatar}
                  onPress={handleSelectProfilePicture}
                >
                  <Text style={styles.avatarText}>
                    {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.avatarAction, styles.addPhotoButton]}
                  onPress={handleSelectProfilePicture}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.avatarActionText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.profileName}>
              {teacher.firstName} {teacher.middleName ? `${teacher.middleName} ` : ''}{teacher.lastName}
            </Text>
            <Text style={styles.profileId}>Faculty ID: {teacher.facultyId}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username:</Text>
              <Text style={styles.infoValue}>{teacher.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{teacher.email || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{teacher.phone || 'Not provided'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Profile data not available</Text>
        </View>
      )}
      
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, updating && styles.disabledButton]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              <Text style={styles.submitButtonText}>
                {updating ? 'Updating...' : 'Update Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  profileContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  avatarActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarAction: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  avatarActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  avatarActionDelete: {
    backgroundColor: '#e53935',
  },
  addPhotoButton: {
    marginTop: 5,
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
  infoSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
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
  debugText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
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
});

export default ProfileScreen; 