const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const upload = require('../utils/uploadConfig');

// Apply authentication middleware to all routes
router.use(auth.authenticateToken, auth.isTeacher);

// Teacher profile routes
router.get('/profile', teacherController.getProfile);
router.post('/profile/update', teacherController.updateProfile);
router.post('/profile/upload-picture', upload.single('profilePicture'), teacherController.uploadProfilePicture);
router.delete('/profile/delete-picture', teacherController.deleteProfilePicture);

// Classes routes
router.get('/classes', teacherController.getClasses);
router.post('/classes', teacherController.createClass);
router.get('/classes/:classId/students', teacherController.getClassStudents);
router.post('/classes/:classId/attendance', teacherController.recordAttendance);

// Subjects routes
router.get('/subjects', teacherController.getSubjects);
router.post('/subjects', teacherController.createSubject);
router.get('/subjects/:subjectId/students', teacherController.getSubjectStudents);
router.put('/subjects/:subjectId', teacherController.updateSubject);
router.delete('/subjects/:subjectId', teacherController.deleteSubject);
router.post('/subjects/:subjectId/generate-key', teacherController.generateSubjectKey);

module.exports = router; 