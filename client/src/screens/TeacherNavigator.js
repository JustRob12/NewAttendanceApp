import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './teacher/HomeScreen';
import MySubjectsScreen from './teacher/MySubjectsScreen';
import SubjectAttendanceScreen from './teacher/SubjectAttendanceScreen';
import ReportsScreen from './teacher/ReportsScreen';
import ProfileScreen from './teacher/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const TeacherTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Subjects') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a90e2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Subjects" component={SubjectsStackNavigator} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Stack Navigator for Subjects-related screens
const SubjectsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MySubjects" 
        component={MySubjectsScreen} 
        options={{ title: 'My Subjects' }}
      />
      <Stack.Screen 
        name="SubjectAttendance" 
        component={SubjectAttendanceScreen} 
        options={{ title: 'Attendance' }}
      />
    </Stack.Navigator>
  );
};

// Main Teacher Navigator
const TeacherNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
    </Stack.Navigator>
  );
};

export default TeacherNavigator; 