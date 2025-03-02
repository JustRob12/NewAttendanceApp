import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  Image,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const QRCodeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const navigation = useNavigation();

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
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      if (userType !== 'student') {
        setError('QR code generation is only available for students.');
        setLoading(false);
        return;
      }

      // Fetch student profile
      const studentData = await api.student.getProfile(token);
      setStudent(studentData);
      
      // Generate QR code for attendance only if profile picture exists
      if (studentData && studentData.profileImage) {
        // Create a stable student data object for the QR code
        // Only include essential information without timestamp
        const studentQrData = {
          id: studentData.id,
          studentId: studentData.studentId,
          firstName: studentData.firstName,
          middleName: studentData.middleName,
          lastName: studentData.lastName,
          course: studentData.course
        };
        
        // Convert to JSON for QR code
        const qrContent = JSON.stringify(studentQrData);
        
        // Use QR Server API for image generation
        const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
        setQrCodeUrl(qrServerUrl);
      } else {
        // If no profile picture, clear the QR code
        setQrCodeUrl('');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError(err.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  // Navigate to profile screen to upload a picture
  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  // Effect to run when component mounts - only fetch once
  useEffect(() => {
    fetchStudentProfile();
  }, []);
  
  // Check for profile picture changes only
  useFocusEffect(
    React.useCallback(() => {
      // Only refetch if we don't have student data or we need to check for profile picture
      if (!student) {
        fetchStudentProfile();
      } else {
        // Just check if profile picture exists without regenerating QR
        (async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
              const studentData = await api.student.getProfile(token);
              
              // Only update student data and QR code if profile picture status changed
              const hadPicture = !!student.profileImage;
              const hasPictureNow = !!studentData.profileImage;
              
              if (hadPicture !== hasPictureNow) {
                setStudent(studentData);
                
                if (hasPictureNow) {
                  // Generate QR code with stable data
                  const studentQrData = {
                    id: studentData.id,
                    studentId: studentData.studentId,
                    firstName: studentData.firstName,
                    middleName: studentData.middleName,
                    lastName: studentData.lastName,
                    course: studentData.course
                  };
                  
                  const qrContent = JSON.stringify(studentQrData);
                  const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
                  setQrCodeUrl(qrServerUrl);
                } else {
                  setQrCodeUrl('');
                }
              }
            }
          } catch (err) {
            console.error('Error checking profile picture:', err);
          }
        })();
      }
      return () => {
        // Optional cleanup if needed
      };
    }, [student])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading QR code...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Attendance QR Code</Text>
        
        {student && student.profileImage ? (
          <View style={styles.qrContainer}>
            <View style={styles.profileInfo}>
              <Image 
                source={{ uri: `http://192.168.1.9:5000/uploads/student_profile_pictures/${student.profileImage}` }}
                style={styles.profileImage}
              />
              <Text style={styles.profileName}>
                {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
              </Text>
              <Text style={styles.profileId}>Student ID: {student.studentId}</Text>
              <Text style={styles.profileCourse}>Course: {student.course}</Text>
            </View>
            
            <View style={styles.qrWrapper}>
              {qrCodeUrl ? (
                <Image 
                  source={{ uri: qrCodeUrl }} 
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="large" color="#4a90e2" />
                  <Text style={styles.placeholderText}>Generating QR code...</Text>
                </View>
              )}
            </View>
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={24} color="#4a90e2" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Show this QR code to your teacher to record your attendance. This QR code contains your student information.
              </Text>
            </View>
            
            <View style={styles.dataContent}>
              <Text style={styles.dataTitle}>QR Code Contains:</Text>
              <Text style={styles.dataItem}>• Student ID: {student.studentId}</Text>
              <Text style={styles.dataItem}>• Name: {student.firstName} {student.lastName}</Text>
              <Text style={styles.dataItem}>• Course: {student.course}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noPictureContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#ccc" />
            <Text style={styles.noPictureTitle}>Profile Picture Required</Text>
            <Text style={styles.noPictureText}>
              To generate your attendance QR code, you need to upload a profile picture first.
            </Text>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={goToProfile}
            >
              <Text style={styles.uploadButtonText}>Go to Profile & Upload Picture</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#4a90e2',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  profileId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileCourse: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4a6582',
    lineHeight: 20,
  },
  dataContent: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dataItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 2,
  },
  noPictureContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPictureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  noPictureText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  uploadButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 15,
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
});

export default QRCodeScreen; 