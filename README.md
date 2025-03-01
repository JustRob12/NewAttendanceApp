# Attendance App

A mobile application for managing student attendance, with separate interfaces for students and teachers.

## Project Structure

```
attendance-app/
├── backend/       # Express server with MySQL database
├── client/        # React Native mobile app
└── start-app.bat  # Script to start both client and server
```

## Prerequisites

- Node.js and npm
- MySQL server
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

## Setup Instructions

### Database Setup

1. Install MySQL Workbench if you haven't already.
2. Open MySQL Workbench and connect to your local MySQL server.
3. Run the `backend/database.sql` script to create the database and tables.

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`) and update with your settings:
   ```
   PORT=5000
   HOST=0.0.0.0
   IP_ADDRESS=your_computer_ip_address
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=attendance_app
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the server:
   ```
   npm start
   ```

### Client Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the API URL in `src/api/api.js` with your computer's IP address:
   ```javascript
   const API_URL = 'http://your_computer_ip_address:5000/api';
   ```

4. Start the Expo development server:
   ```
   npm start
   ```

5. Use the Expo Go app on your mobile device to scan the QR code displayed in the terminal or browser.

## Running the Application

For convenience, you can use the `start-app.bat` script (Windows) to start both the client and server at once:

```
start-app.bat
```

## Features

- User authentication (login/register) for both students and teachers
- Student features:
  - View classes
  - View attendance records
- Teacher features:
  - Create classes
  - Manage student enrollment
  - Take attendance

## Technologies Used

- **Backend**: Node.js, Express, MySQL, JWT authentication
- **Frontend**: React Native, Expo