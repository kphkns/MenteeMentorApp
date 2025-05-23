import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import AdminHome from '../Admin/AdminHome';
import AdminProfile from '../Admin/AdminProfile';
import AdminChangePassword from '../Admin/AdminChangePassword';
import AdminManagement from '../Admin/AdminManagement';

import DepartmentScreen from '../Admin/AdminManagemtScreen/DepartmentScreen';
import ProgrammeScreen from '../Admin/AdminManagemtScreen/ProgrammeScreen';
import FacultyScreen from '../Admin/AdminManagemtScreen/FacultyScreen';
import BatchsScreen from '../Admin/AdminManagemtScreen/BatchsScreen';
import StudentsScreen from '../Admin/AdminManagemtScreen/StudentsScreen';
import FacultyListScreen from '../Admin/AdminManagemtScreen/FacultyListScreen';
import StudentListScreen from '../Admin/AdminManagemtScreen/StudentListScreen';
import ExcelUploadScreen from '../Admin/AdminManagemtScreen/UploadExcelScreen';
import SessionManagement from '../Admin/AdminManagemtScreen/SessionManagement';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Management') iconName = focused ? 'settings' : 'settings-outline';
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
      <Tab.Screen name="Home" component={AdminHome} options={{ headerShown: false }} />
      <Tab.Screen name="Management" component={AdminManagement} options={{ title: 'Management' }} />
      <Tab.Screen name="Profile" component={AdminProfile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AdminStack() {
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
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AdminChangePassword" component={AdminChangePassword} options={{ title: 'Change Password' }} />
      <Stack.Screen name="DEPARTMENT" component={DepartmentScreen} options={{ title: 'Department Management' }} />
      <Stack.Screen name="PROGRAMME" component={ProgrammeScreen} options={{ title: 'Programme Management' }} />
      <Stack.Screen name="FACULTY" component={FacultyScreen} options={{ title: 'Faculty Management' }} />
      <Stack.Screen name="BATCHS" component={BatchsScreen} options={{ title: 'Batch Management' }} />
      <Stack.Screen name="STUDENTS" component={StudentsScreen} options={{ title: 'Student Management' }} />
      <Stack.Screen name="FacultyListScreen" component={FacultyListScreen} options={{ title: 'Faculty List' }} />
      <Stack.Screen name="StudentListScreen" component={StudentListScreen} options={{ title: 'Student List' }} />
      <Stack.Screen name="UploadExcelScreen" component={ExcelUploadScreen} options={{ title: 'Upload via Excel' }} />
      <Stack.Screen name="SESSION MANAGEMENT" component={SessionManagement} options={{ title: 'Session Management' }} />
    </Stack.Navigator>
  );
}
