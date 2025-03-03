const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Get teacher profile
exports.getProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const query = `
      SELECT t.id, t.first_name, t.middle_name, t.last_name, t.faculty_id, t.username, 
             t.email, t.phone,
             pt.image_url as profile_image
      FROM teachers t
      LEFT JOIN profile_teacher pt ON t.id = pt.teacher_id
      WHERE t.id = ?
    `;
    
    db.execute(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const teacher = results[0];
      
      // Construct full URL for profile image if it exists
      let profileImageUrl = null;
      if (teacher.profile_image) {
        profileImageUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${path.basename(teacher.profile_image)}`;
      }
      
      res.json({
        id: teacher.id,
        firstName: teacher.first_name,
        middleName: teacher.middle_name,
        lastName: teacher.last_name,
        facultyId: teacher.faculty_id,
        username: teacher.username,
        email: teacher.email,
        phone: teacher.phone,
        profileImage: profileImageUrl
      });
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const teacherId = req.user.id;
    const imagePath = req.file.path;
    const relativeImagePath = path.relative(path.join(__dirname, '..'), imagePath).replace(/\\/g, '/');
    
    // Check if teacher already has a profile picture
    const checkQuery = 'SELECT id, image_url FROM profile_teacher WHERE teacher_id = ?';
    
    db.execute(checkQuery, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking profile picture', error: err.message });
      }
      
      // If teacher already has a profile picture, update it
      if (results.length > 0) {
        const oldProfilePic = results[0].image_url;
        const oldFilePath = path.join(__dirname, '..', oldProfilePic);
        
        // Delete old file if it exists
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        
        const updateQuery = 'UPDATE profile_teacher SET image_url = ? WHERE teacher_id = ?';
        
        db.execute(updateQuery, [relativeImagePath, teacherId], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating profile picture', error: err.message });
          }
          
          const imageUrl = `${req.protocol}://${req.get('host')}/${relativeImagePath}`;
          
          res.status(200).json({
            message: 'Profile picture updated successfully',
            imageUrl: imageUrl
          });
        });
      } else {
        // Insert new profile picture record
        const insertQuery = 'INSERT INTO profile_teacher (teacher_id, image_url) VALUES (?, ?)';
        
        db.execute(insertQuery, [teacherId, relativeImagePath], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error uploading profile picture', error: err.message });
          }
          
          const imageUrl = `${req.protocol}://${req.get('host')}/${relativeImagePath}`;
          
          res.status(201).json({
            message: 'Profile picture uploaded successfully',
            imageUrl: imageUrl
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get current profile picture info
    const query = 'SELECT id, image_url FROM profile_teacher WHERE teacher_id = ?';
    
    db.execute(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error getting profile picture', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'No profile picture found' });
      }
      
      const profilePicture = results[0];
      const filePath = path.join(__dirname, '..', profilePicture.image_url);
      
      // Delete file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete record from database
      const deleteQuery = 'DELETE FROM profile_teacher WHERE id = ?';
      
      db.execute(deleteQuery, [profilePicture.id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting profile picture record', error: err.message });
        }
        
        res.json({ message: 'Profile picture deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    res.status(500).json({ message: 'Failed to delete profile picture', error: error.message });
  }
};

// Get teacher's classes
exports.getClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const query = `
      SELECT c.id, c.name, c.schedule, 
             (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) as student_count
      FROM classes c
      WHERE c.teacher_id = ?
    `;
    
    db.execute(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching classes', error: err.message });
      }
      
      const classes = results.map(cls => ({
        id: cls.id,
        name: cls.name,
        schedule: cls.schedule,
        studentCount: cls.student_count
      }));
      
      res.json(classes);
    });
  } catch (error) {
    console.error('Error in getClasses:', error);
    res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
  }
};

// Create a new class
exports.createClass = async (req, res) => {
  try {
    const { name, schedule } = req.body;
    const teacherId = req.user.id;
    
    if (!name || !schedule) {
      return res.status(400).json({ message: 'Class name and schedule are required' });
    }
    
    const query = 'INSERT INTO classes (name, schedule, teacher_id) VALUES (?, ?, ?)';
    
    db.execute(query, [name, schedule, teacherId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating class', error: err.message });
      }
      
      res.status(201).json({
        message: 'Class created successfully',
        classId: result.insertId
      });
    });
  } catch (error) {
    console.error('Error in createClass:', error);
    res.status(500).json({ message: 'Failed to create class', error: error.message });
  }
};

// Get students in a class
exports.getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    
    // First verify that this class belongs to the teacher
    const verifyQuery = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [classId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying class', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This class does not belong to you' });
      }
      
      // Get students in the class
      const query = `
        SELECT s.id, s.first_name, s.middle_name, s.last_name, s.student_id, s.course
        FROM students s
        JOIN class_students cs ON s.id = cs.student_id
        WHERE cs.class_id = ?
        ORDER BY s.last_name, s.first_name
      `;
      
      db.execute(query, [classId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching students', error: err.message });
        }
        
        const students = results.map(student => ({
          id: student.id,
          firstName: student.first_name,
          middleName: student.middle_name,
          lastName: student.last_name,
          studentId: student.student_id,
          course: student.course
        }));
        
        res.json(students);
      });
    });
  } catch (error) {
    console.error('Error in getClassStudents:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
};

// Record attendance for a class
exports.recordAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, attendanceRecords } = req.body;
    const teacherId = req.user.id;
    
    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Date and attendance records are required' });
    }
    
    // First verify that this class belongs to the teacher
    const verifyQuery = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [classId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying class', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This class does not belong to you' });
      }
      
      // Start a transaction
      db.beginTransaction(err => {
        if (err) {
          return res.status(500).json({ message: 'Error starting transaction', error: err.message });
        }
        
        const query = 'INSERT INTO attendance (student_id, teacher_id, class_id, date, status, notes) VALUES (?, ?, ?, ?, ?, ?)';
        
        // Process each attendance record
        const promises = attendanceRecords.map(record => {
          return new Promise((resolve, reject) => {
            db.execute(
              query,
              [record.studentId, teacherId, classId, date, record.status, record.notes || null],
              (err, result) => {
                if (err) {
                  return reject(err);
                }
                resolve(result);
              }
            );
          });
        });
        
        Promise.all(promises)
          .then(() => {
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Error committing transaction', error: err.message });
                });
              }
              
              res.status(201).json({ message: 'Attendance recorded successfully' });
            });
          })
          .catch(error => {
            db.rollback(() => {
              res.status(500).json({ message: 'Error recording attendance', error: error.message });
            });
          });
      });
    });
  } catch (error) {
    console.error('Error in recordAttendance:', error);
    res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
};

// Record attendance for a subject (single student)
exports.recordSubjectAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const subjectId = req.params.subjectId;
    const { studentId, date, status, notes } = req.body;
    
    // Validate input
    if (!studentId || !date || !status) {
      return res.status(400).json({ message: 'Student ID, date, and status are required' });
    }
    
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "present", "absent", or "late"' });
    }
    
    // Check if the subject belongs to the teacher
    const checkSubjectQuery = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
    db.execute(checkSubjectQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Subject not found or not owned by this teacher' });
      }
      
      // Check if a record already exists for this student on this date
      const checkExistingQuery = 'SELECT id FROM subject_attendance WHERE subject_id = ? AND student_id = ? AND date = ?';
      db.execute(checkExistingQuery, [subjectId, studentId, date], (checkErr, checkResults) => {
        if (checkErr) {
          return res.status(500).json({ message: 'Error checking existing records', error: checkErr.message });
        }
        
        if (checkResults.length > 0) {
          // Update existing record
          const updateQuery = 'UPDATE subject_attendance SET status = ?, notes = ? WHERE id = ?';
          db.execute(updateQuery, [status, notes || null, checkResults[0].id], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating attendance', error: updateErr.message });
            }
            
            res.status(200).json({ 
              message: 'Attendance updated successfully',
              attendanceId: checkResults[0].id
            });
          });
        } else {
          // Insert new record
          const insertQuery = 'INSERT INTO subject_attendance (student_id, teacher_id, subject_id, date, status, notes) VALUES (?, ?, ?, ?, ?, ?)';
          db.execute(insertQuery, [studentId, teacherId, subjectId, date, status, notes || null], (insertErr, insertResult) => {
            if (insertErr) {
              return res.status(500).json({ message: 'Error recording attendance', error: insertErr.message });
            }
            
            res.status(201).json({ 
              message: 'Attendance recorded successfully',
              attendanceId: insertResult.insertId
            });
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in recordSubjectAttendance:', error);
    res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
};

// Get teacher's subjects
exports.getSubjects = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const query = `
      SELECT s.id, s.subject_code, s.description, s.schedule, s.key_code,
             (SELECT COUNT(*) FROM subject_enrollments WHERE subject_id = s.id) as student_count
      FROM subjects s
      WHERE s.teacher_id = ?
      ORDER BY s.subject_code
    `;
    
    db.execute(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching subjects', error: err.message });
      }
      
      const subjects = results.map(subject => ({
        id: subject.id,
        subjectCode: subject.subject_code,
        description: subject.description,
        schedule: subject.schedule,
        keyCode: subject.key_code,
        studentCount: subject.student_count
      }));
      
      res.json(subjects);
    });
  } catch (error) {
    console.error('Error in getSubjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects', error: error.message });
  }
};

// Create a new subject
exports.createSubject = async (req, res) => {
  try {
    const { subjectCode, description, schedule } = req.body;
    const teacherId = req.user.id;
    
    if (!subjectCode || !description || !schedule) {
      return res.status(400).json({ message: 'Subject code, description, and schedule are required' });
    }
    
    const query = 'INSERT INTO subjects (subject_code, description, schedule, teacher_id) VALUES (?, ?, ?, ?)';
    
    db.execute(query, [subjectCode, description, schedule, teacherId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating subject', error: err.message });
      }
      
      res.status(201).json({
        message: 'Subject created successfully',
        subjectId: result.insertId
      });
    });
  } catch (error) {
    console.error('Error in createSubject:', error);
    res.status(500).json({ message: 'Failed to create subject', error: error.message });
  }
};

// Get students in a subject
exports.getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user.id;
    
    // First verify that this subject belongs to the teacher
    const verifyQuery = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying subject', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This subject does not belong to you' });
      }
      
      // Get students in the subject
      const query = `
        SELECT s.id, s.first_name, s.middle_name, s.last_name, s.student_id, s.course, se.enrolled_at
        FROM students s
        JOIN subject_enrollments se ON s.id = se.student_id
        WHERE se.subject_id = ?
        ORDER BY s.last_name, s.first_name
      `;
      
      db.execute(query, [subjectId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching students', error: err.message });
        }
        
        const students = results.map(student => ({
          id: student.id,
          firstName: student.first_name,
          middleName: student.middle_name,
          lastName: student.last_name,
          studentId: student.student_id,
          course: student.course,
          enrolledAt: student.enrolled_at
        }));
        
        res.json(students);
      });
    });
  } catch (error) {
    console.error('Error in getSubjectStudents:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
};

// Update a subject
exports.updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { subjectCode, description, schedule } = req.body;
    const teacherId = req.user.id;
    
    if (!subjectCode && !description && !schedule) {
      return res.status(400).json({ message: 'At least one field to update is required' });
    }
    
    // First verify that this subject belongs to the teacher
    const verifyQuery = 'SELECT * FROM subjects WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying subject', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This subject does not belong to you' });
      }
      
      const subject = results[0];
      
      // Use existing values if not provided
      const updatedSubjectCode = subjectCode || subject.subject_code;
      const updatedDescription = description || subject.description;
      const updatedSchedule = schedule || subject.schedule;
      
      // Update the subject
      const query = `
        UPDATE subjects 
        SET subject_code = ?, description = ?, schedule = ? 
        WHERE id = ? AND teacher_id = ?
      `;
      
      db.execute(
        query, 
        [updatedSubjectCode, updatedDescription, updatedSchedule, subjectId, teacherId], 
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating subject', error: err.message });
          }
          
          res.json({
            message: 'Subject updated successfully',
            subject: {
              id: parseInt(subjectId),
              subjectCode: updatedSubjectCode,
              description: updatedDescription,
              schedule: updatedSchedule
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error in updateSubject:', error);
    res.status(500).json({ message: 'Failed to update subject', error: error.message });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user.id;
    
    // First verify that this subject belongs to the teacher
    const verifyQuery = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying subject', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This subject does not belong to you' });
      }
      
      // First delete related records from subject_students
      db.execute('DELETE FROM subject_students WHERE subject_id = ?', [subjectId], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting subject students', error: err.message });
        }
        
        // Then delete the subject
        db.execute('DELETE FROM subjects WHERE id = ? AND teacher_id = ?', [subjectId, teacherId], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error deleting subject', error: err.message });
          }
          
          res.json({ message: 'Subject deleted successfully' });
        });
      });
    });
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    res.status(500).json({ message: 'Failed to delete subject', error: error.message });
  }
};

// Generate or regenerate key code for a subject
exports.generateSubjectKey = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user.id;
    
    // First verify that this subject belongs to the teacher
    const verifyQuery = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying subject', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This subject does not belong to you' });
      }
      
      // Generate a random alphanumeric key code (6 characters)
      const generateRandomKey = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };
      
      const keyCode = generateRandomKey();
      
      // Update the subject with the new key code
      const query = 'UPDATE subjects SET key_code = ? WHERE id = ?';
      
      db.execute(query, [keyCode, subjectId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error generating key code', error: err.message });
        }
        
        res.json({
          message: 'Subject key code generated successfully',
          keyCode: keyCode
        });
      });
    });
  } catch (error) {
    console.error('Error in generateSubjectKey:', error);
    res.status(500).json({ message: 'Failed to generate key code', error: error.message });
  }
};

// Update teacher profile
exports.updateProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { email, phone } = req.body;
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Update the teacher profile
    const query = `
      UPDATE teachers 
      SET 
        email = ?,
        phone = ?
      WHERE id = ?
    `;
    
    db.execute(query, [email, phone, teacherId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating profile', error: err.message });
      }
      
      res.json({
        message: 'Profile updated successfully',
        updates: {
          email,
          phone
        }
      });
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Get attendance records for a subject
exports.getSubjectAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId } = req.params;
    const { date } = req.query;
    
    // First verify that this subject belongs to the teacher
    const verifyQuery = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
    
    db.execute(verifyQuery, [subjectId, teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verifying subject', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: This subject does not belong to you' });
      }
      
      // Build the query based on whether a date is provided
      let query = `
        SELECT sa.id, sa.student_id, sa.date, sa.status, sa.notes, sa.created_at,
               s.first_name, s.middle_name, s.last_name, s.student_id as student_number
        FROM subject_attendance sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.subject_id = ? AND sa.teacher_id = ?
      `;
      
      const queryParams = [subjectId, teacherId];
      
      if (date) {
        query += ' AND sa.date = ?';
        queryParams.push(date);
      }
      
      query += ' ORDER BY sa.date DESC, s.last_name, s.first_name';
      
      db.execute(query, queryParams, (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching attendance records', error: err.message });
        }
        
        const attendanceRecords = results.map(record => ({
          id: record.id,
          studentId: record.student_id,
          studentName: `${record.first_name} ${record.middle_name ? record.middle_name + ' ' : ''}${record.last_name}`,
          studentNumber: record.student_number,
          date: record.date,
          status: record.status,
          notes: record.notes,
          createdAt: record.created_at
        }));
        
        res.json(attendanceRecords);
      });
    });
  } catch (error) {
    console.error('Error in getSubjectAttendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records', error: error.message });
  }
}; 