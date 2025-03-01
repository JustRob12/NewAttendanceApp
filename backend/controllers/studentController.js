const db = require('../config/db');

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const query = 'SELECT id, first_name, middle_name, last_name, student_id, course, username FROM students WHERE id = ?';
    
    db.execute(query, [studentId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      const student = results[0];
      
      res.json({
        id: student.id,
        firstName: student.first_name,
        middleName: student.middle_name,
        lastName: student.last_name,
        studentId: student.student_id,
        course: student.course,
        username: student.username
      });
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
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