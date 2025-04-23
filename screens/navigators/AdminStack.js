// navigators/AdminStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import AdminHome from '../Admin/AdminHome';
import AdminProfile from '../Admin/AdminProfile';
import AdminChangePassword from '../Admin/AdminChangePassword'; // ✅ Import change password screen.
import AdminManagement from '../Admin/AdminManagement';
import DepartmentScreen from '../Admin/AdminManagemtScreen/DepartmentScreen';
import ProgrammeScreen from '../Admin/AdminManagemtScreen/ProgrammeScreen';
import FacultyScreen from '../Admin/AdminManagemtScreen/FacultyScreen';
import BatchsScreen from '../Admin/AdminManagemtScreen/BatchsScreen';
import StudentsScreen from '../Admin/AdminManagemtScreen/StudentsScreen';
import FacultyListScreen from '../Admin/AdminManagemtScreen/FacultyListScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
           else if (route.name === 'Management') iconName = 'construct';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
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
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AdminChangePassword" component={AdminChangePassword} options={{ title: 'Change Password' }} />
      <Stack.Screen name="DEPARTMENT" component={DepartmentScreen} />
      <Stack.Screen name="PROGRAMME" component={ProgrammeScreen} />
      <Stack.Screen name="FACULTY" component={FacultyScreen} />
      <Stack.Screen name="BATCHS" component={BatchsScreen} />
      <Stack.Screen name="STUDENTS" component={StudentsScreen} />
      <Stack.Screen name="FacultyListScreen" component={FacultyListScreen} options={{ title: 'FacultyListScreen' }} />
    </Stack.Navigator>
  );
}
