import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

// Import your screens
import StudentHome from '../student/StudentHome';
import StudentAppointments from '../student/Appoinments/StudentAppointments';
import StudentProfile from '../student/StudentProfile';
import ChangePassword from '../student/ChangePassword';
import AcademicThings from '../student/AcadamicThings';
import StudentMentorcard from '../student/StudentMentorcard';
import BookAppointment from '../student/Appointment';
import StudentAppointmentslist from '../student/Appoinments/StudentAppointmentslist';
import AppointmentHistoryScreen from '../student/Appoinments/AppointmentHistory';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Appointments") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Academic") {
            return <MaterialCommunityIcons 
              name={focused ? "book-education" : "book-education-outline"} 
              size={size} 
              color={color} 
            />;
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          shadowColor: "#000",
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
      <Tab.Screen 
        name="Home" 
        component={StudentHome} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Appointments" 
        component={BookAppointment} 
        options={{ title: 'My Appointments' }} 
      />
      <Tab.Screen 
        name="Academic" 
        component={AcademicThings} 
        options={{ title: 'Academic Services' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={StudentProfile} 
        options={{ title: 'My Profile' }} 
      />
    </Tab.Navigator>
  );
}

export default function StudentStack() {
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
        name="StudentTabs"
        component={StudentTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{ 
          presentation: "modal", 
          title: "Change Password",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
        }}
      />
      <Stack.Screen 
        name="StudentAppointments" 
        component={StudentAppointments} 
        options={{ title: 'New Appointment' }} 
      />
      <Stack.Screen 
        name="StudentAppointmentslist" 
        component={StudentAppointmentslist} 
        options={{ title: 'Appointments' }} 
      />
      <Stack.Screen 
        name="StudentMentorcard" 
        component={StudentMentorcard} 
        options={{ title: 'Mentor Profile' }} 
      />
      <Stack.Screen 
        name="AppointmentHistory" 
        component={AppointmentHistoryScreen} 
        options={{ title: 'Appointment History' }} 
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
});