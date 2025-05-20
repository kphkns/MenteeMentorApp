// StudentStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Appointments") iconName = "calendar-outline";
          else if (route.name === "Academic") iconName = "school-outline";
          else if (route.name === "Profile") iconName = "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "black",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#f2f6ff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerTintColor: "black",
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={StudentHome} />
      <Tab.Screen name="Appointments" component={BookAppointment} />
      <Tab.Screen name="Academic" component={AcademicThings} />
      <Tab.Screen name="Profile" component={StudentProfile} />
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
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerTintColor: "black",
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
        options={{ presentation: "modal", headerTitle: "Change Password" }}
      />
      <Stack.Screen name="StudentAppointments" component={StudentAppointments} />
      <Stack.Screen name="StudentAppointmentslist" component={StudentAppointmentslist} />
      <Stack.Screen name="StudentMentorcard" component={StudentMentorcard} />
      <Stack.Screen name="AppointmentHistory" component={AppointmentHistoryScreen} />
    </Stack.Navigator>
  );
}
