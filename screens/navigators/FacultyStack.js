// navigators/FacultyStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import FacultyHome from '../faculty/FacultyHome';
import FacultyProfile from '../faculty/FacultyProfile';
import ManageMentorcard from '../faculty/ManageMentorcard';
import StudentDetailsScreen from '../faculty/StudentDetailsScreen';
import FacultyAppointment from '../faculty/FacultyAppoinment';
import FacultyAppointlist from '../faculty/FacultyAppointlist';
import FacultyHistoryScreen from '../faculty/FacultyHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function FacultyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Appointments') iconName = 'calendar-outline';
          else if (route.name === 'MentorCard') iconName = 'document-text-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'black',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#f2f6ff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: 'black',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={FacultyHome} />
      <Tab.Screen name="Appointments" component={FacultyAppointment} />
      <Tab.Screen name="MentorCard" component={ManageMentorcard} />
      <Tab.Screen name="Profile" component={FacultyProfile} />
    </Tab.Navigator>
  );
}

export default function FacultyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f2f6ff',
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: 'black',
      }}
    >
      <Stack.Screen
        name="FacultyTabs"
        component={FacultyTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StudentDetailsScreen"
        component={StudentDetailsScreen}
        options={{ title: 'Student Details' }}
      />
      <Stack.Screen
        name="FacultyAppointlist"
        component={FacultyAppointlist}
        options={{ title: 'Appointment List' }}
      />
      <Stack.Screen
        name="FacultyHistoryScreen"
        component={FacultyHistoryScreen}
        options={{ title: 'Appointment History' }}
      />
    </Stack.Navigator>
  );
}
