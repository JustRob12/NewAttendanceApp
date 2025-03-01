const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register a new user (student or teacher)
exports.register = async (req, res) => {
  const { firstName, middleName, lastName, userType, username, password, facultyId, studentId, course } = req.body;
  
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let query;
    let params;
    
    if (userType === 'teacher') {
      query = 'INSERT INTO teachers (first_name, middle_name, last_name, faculty_id, username, password) VALUES (?, ?, ?, ?, ?, ?)';
      params = [firstName, middleName, lastName, facultyId, username, hashedPassword];
    } else {
      query = 'INSERT INTO students (first_name, middle_name, last_name, student_id, course, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
      params = [firstName, middleName, lastName, studentId, course, username, hashedPassword];
    }
    
    db.execute(query, params, (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ message: 'Registration failed', error: err.message });
      }
      
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login a user
exports.login = async (req, res) => {
  const { username, password, userType } = req.body;
  
  let table = userType === 'teacher' ? 'teachers' : 'students';
  
  try {
    const query = `SELECT * FROM ${table} WHERE username = ?`;
    
    db.execute(query, [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const user = results[0];
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { id: user.id, userType: userType },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          userType
        }
      });
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
}; 