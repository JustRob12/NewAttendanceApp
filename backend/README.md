# Attendance App Backend

This is the backend for the Attendance App, providing API endpoints for student and teacher registration, login, and attendance management.

## Project Structure

```
backend/
├── config/         # Database configuration
├── controllers/    # Controller functions for routes
├── middleware/     # Authentication middleware
├── routes/         # API routes
├── .env            # Environment variables
├── database.sql    # Database schema
├── package.json    # Dependencies
├── server.js       # Main server file
```

## Database Setup

1. Install MySQL Workbench if you haven't already.
2. Open MySQL Workbench and connect to your local MySQL server.
3. Run the `database.sql` script to create the database and tables:
   - You can copy and paste the contents of `database.sql` into a new query tab in MySQL Workbench and execute it.
   - Alternatively, you can run the script from the command line:
     ```
     mysql -u root -p < database.sql
     ```

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (or create a new `.env` file)
   - Update the values in `.env` with your database credentials

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

## Running on Mobile Devices

To run the app on your mobile device:

1. Make sure your computer and mobile device are on the same WiFi network.

2. Find your computer's IP address:
   - On Windows: Open Command Prompt and run `ipconfig`
   - On macOS: Open Terminal and run `ifconfig`
   - On Linux: Open Terminal and run `hostname -I`

3. Update your `.env` file with your IP address:
   ```
   IP_ADDRESS=your_computer_ip_address
   ```

4. Update the client API configuration in `client/src/api/api.js`:
   ```javascript
   const API_URL = 'http://your_computer_ip_address:5000/api';
   ```

5. Start the backend server:
   ```
   npm start
   ```

6. Start the Expo client:
   ```
   cd ../client
   npm start
   ```

7. Open the Expo app on your phone and scan the QR code displayed in the terminal or browser.

Alternatively, you can use the provided `start-app.bat` script (Windows) to start both the client and server at once.

## API Endpoints

### Authentication
- **POST** `/api/register` - Register a new user (student or teacher)
  - Body: `{ firstName, middleName, lastName, userType, username, password, facultyId, studentId, course }`

- **POST** `/api/login` - Login a user
  - Body: `{ username, password, userType }`

### Student Routes
- **GET** `/api/student/profile` - Get student profile
- **GET** `/api/student/classes` - Get student's classes
- **GET** `/api/student/attendance` - Get all attendance records
- **GET** `/api/student/attendance/:classId` - Get attendance records for a specific class

### Teacher Routes
- **GET** `/api/teacher/profile` - Get teacher profile
- **GET** `/api/teacher/classes` - Get teacher's classes
- **POST** `/api/teacher/classes` - Create a new class
- **GET** `/api/teacher/classes/:classId/students` - Get students in a class
- **POST** `/api/teacher/classes/:classId/attendance` - Record attendance for a class 