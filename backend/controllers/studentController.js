const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/student_profile_pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `student-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    }
  }
}).single('profilePicture');

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // First, get the student data
    const studentQuery = 'SELECT id, first_name, middle_name, last_name, student_id, course, username FROM students WHERE id = ?';
    
    db.execute(studentQuery, [studentId], (err, studentResults) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
      }
      
      if (studentResults.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      const student = studentResults[0];
      
      // Next, get the profile picture if exists
      const profileQuery = 'SELECT image_url FROM profile_students WHERE student_id = ? ORDER BY created_at DESC LIMIT 1';
      
      db.execute(profileQuery, [studentId], (profileErr, profileResults) => {
        if (profileErr) {
          return res.status(500).json({ message: 'Error fetching profile picture', error: profileErr.message });
        }
        
        const profileImage = profileResults.length > 0 ? profileResults[0].image_url : null;
        
        res.json({
          id: student.id,
          firstName: student.first_name,
          middleName: student.middle_name,
          lastName: student.last_name,
          studentId: student.student_id,
          course: student.course,
          username: student.username,
          profileImage: profileImage
        });
      });
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const studentId = req.user.id;
      
      // Get current profile image if exists
      const getQuery = 'SELECT id, image_url FROM profile_students WHERE student_id = ? ORDER BY created_at DESC LIMIT 1';
      db.execute(getQuery, [studentId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (results.length > 0) {
          const oldImagePath = path.join(__dirname, '../uploads/student_profile_pictures', results[0].image_url);
          
          // Try to delete the old image file if it exists
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
            } catch (unlinkErr) {
              console.error('Error deleting old profile image:', unlinkErr);
            }
          }
          
          // Delete the old record
          const deleteQuery = 'DELETE FROM profile_students WHERE id = ?';
          db.execute(deleteQuery, [results[0].id], (deleteErr) => {
            if (deleteErr) {
              console.error('Error deleting old profile record:', deleteErr);
            }
          });
        }
        
        // Insert the new profile image record
        const insertQuery = 'INSERT INTO profile_students (student_id, image_url) VALUES (?, ?)';
        db.execute(insertQuery, [studentId, req.file.filename], (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ message: 'Error saving profile image', error: insertErr.message });
          }
          
          res.json({ 
            message: 'Profile picture uploaded successfully',
            filename: req.file.filename
          });
        });
      });
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
    }
  });
};

// Delete profile picture
exports.deleteProfilePicture = (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get current profile image
    const getQuery = 'SELECT id, image_url FROM profile_students WHERE student_id = ? ORDER BY created_at DESC LIMIT 1';
    db.execute(getQuery, [studentId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'No profile picture to delete' });
      }
      
      const profileRecord = results[0];
      const imagePath = path.join(__dirname, '../uploads/student_profile_pictures', profileRecord.image_url);
      
      // Delete the image file
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkErr) {
          console.error('Error deleting profile image file:', unlinkErr);
          return res.status(500).json({ message: 'Error deleting profile image file', error: unlinkErr.message });
        }
      }
      
      // Delete the database record
      const deleteQuery = 'DELETE FROM profile_students WHERE id = ?';
      db.execute(deleteQuery, [profileRecord.id], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ message: 'Error deleting profile record', error: deleteErr.message });
        }
        
        res.json({ message: 'Profile picture deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    res.status(500).json({ message: 'Failed to delete profile picture', error: error.message });
  }
};

// Get student's classes
exports.getClasses = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const query = `
      SELECT c.id, c.name, c.schedule, 
             t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM classes c
      JOIN class_students cs ON c.id = cs.class_id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE cs.student_id = ?
    `;
    
    db.execute(query, [studentId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching classes', error: err.message });
      }
      
      const classes = results.map(cls => ({
        id: cls.id,
        name: cls.name,
        schedule: cls.schedule,
        teacher: `${cls.teacher_first_name} ${cls.teacher_last_name}`
      }));
      
      res.json(classes);
    });
  } catch (error) {
    console.error('Error in getClasses:', error);
    res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
  }
};

// Get student's attendance records
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const classId = req.params.classId;
    
    let query;
    let params;
    
    if (classId) {
      // Get attendance for a specific class
      query = `
        SELECT a.id, a.date, a.status, a.notes, c.name as class_name
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.student_id = ? AND c.id = ?
        ORDER BY a.date DESC
      `;
      params = [studentId, classId];
    } else {
      // Get all attendance records
      query = `
        SELECT a.id, a.date, a.status, a.notes, c.name as class_name
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.student_id = ?
        ORDER BY a.date DESC
      `;
      params = [studentId];
    }
    
    db.execute(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching attendance', error: err.message });
      }
      
      const attendance = results.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        className: record.class_name
      }));
      
      res.json(attendance);
    });
  } catch (error) {
    console.error('Error in getAttendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
}; 