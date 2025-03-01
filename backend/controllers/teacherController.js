const db = require('../config/db');

// Get teacher profile
exports.getProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const query = 'SELECT id, first_name, middle_name, last_name, faculty_id, username FROM teachers WHERE id = ?';
    
    db.execute(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const teacher = results[0];
      
      res.json({
        id: teacher.id,
        firstName: teacher.first_name,
        middleName: teacher.middle_name,
        lastName: teacher.last_name,
        facultyId: teacher.faculty_id,
        username: teacher.username
      });
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
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

// Get teacher's subjects
exports.getSubjects = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const query = `
      SELECT s.id, s.subject_code, s.description, s.schedule, s.key_code,
             (SELECT COUNT(*) FROM subject_students WHERE subject_id = s.id) as student_count
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
        SELECT s.id, s.first_name, s.middle_name, s.last_name, s.student_id, s.course
        FROM students s
        JOIN subject_students ss ON s.id = ss.student_id
        WHERE ss.subject_id = ?
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
          course: student.course
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