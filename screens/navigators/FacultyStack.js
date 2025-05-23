import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'MentorCard') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
          borderTopWidth: 0,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        headerStyle: {
          backgroundColor: "#f2f6ff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 20,
          color: "#111827",
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        headerTintColor: "#4F46E5",
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={FacultyHome} options={{ headerShown: false }} />
      <Tab.Screen name="Appointments" component={FacultyAppointment} options={{ title: 'Appointments' }} />
      <Tab.Screen name="MentorCard" component={ManageMentorcard} options={{ title: 'Mentor Card' }} />
      <Tab.Screen name="Profile" component={FacultyProfile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function FacultyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#f2f6ff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 20,
          color: "#111827",
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        headerTintColor: "#4F46E5",
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#F8FAFC",
        },
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
