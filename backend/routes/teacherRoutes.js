const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticateToken, auth.isTeacher);

// Teacher profile route
router.get('/profile', teacherController.getProfile);

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