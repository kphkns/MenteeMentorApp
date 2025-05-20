// navigators/AdminStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
import SessionManagement from '../Admin/AdminManagemtScreen/SessionManagement'

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Management') iconName = 'settings-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'black',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 8,
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
          fontSize: 18,
          fontWeight: 'bold',
        },
        headerTintColor: 'black',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={AdminHome} />
      <Tab.Screen name="Management" component={AdminManagement} />
      <Tab.Screen name="Profile" component={AdminProfile} />
    </Tab.Navigator>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f2f6ff',
          elevation: 0, // Android shadow
          shadowOpacity: 0, // iOS shadow
          borderBottomWidth: 0, // Removes bottom border
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: 'black',
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
      <Stack.Screen name="SESSION MANAGEMENT" component={SessionManagement} options={{ title: 'SessionManagement' }} />
    </Stack.Navigator>
  );
}
