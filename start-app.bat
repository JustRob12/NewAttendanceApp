@echo off
echo Starting Attendance Application...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo.
echo Starting React Native Client...
start cmd /k "cd client && npm start"

echo.
echo Attendance Application Started!
echo.
echo Backend: http://192.168.1.9:5000
echo.
echo Use the Expo app on your phone to scan the QR code from the client terminal.
echo Make sure your phone is on the same WiFi network as this computer.
echo. 