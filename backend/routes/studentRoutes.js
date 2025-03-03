const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, isStudent } = require('../middleware/auth');

// Apply authentication middleware to all student routes
router.use(authenticateToken);
router.use(isStudent);

// Get student profile
router.get('/profile', studentController.getProfile);

// Upload profile picture
router.post('/profile/upload-picture', studentController.uploadProfilePicture);

// Delete profile picture
router.delete('/profile/delete-picture', studentController.deleteProfilePicture);

// Get student's classes
router.get('/classes', studentController.getClasses);

// Get student's attendance records (all classes)
router.get('/attendance', studentController.getAttendance);

// Get student's attendance records for a specific class
router.get('/attendance/:classId', studentController.getAttendance);

// Subject management routes
router.get('/subjects', studentController.getEnrolledSubjects);
router.post('/subjects/search', studentController.searchSubjectByKey);
router.post('/subjects/enroll', studentController.enrollInSubject);

module.exports = router; 