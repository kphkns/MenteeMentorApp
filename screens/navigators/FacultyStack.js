// navigators/FacultyStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import FacultyHome from '../faculty/FacultyHome';
import FacultyProfile from '../faculty/FacultyProfile';
import ManageMentorcard from '../faculty/ManageMentorcard';
import StudentDetailsScreen from '../faculty/StudentDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Bottom Tabs
function FacultyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Card') iconName = 'construct';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={FacultyHome} />
      <Tab.Screen name="Card" component={ManageMentorcard} />
      <Tab.Screen name="Profile" component={FacultyProfile} />
    </Tab.Navigator>
  );
}

// Stack that wraps bottom tabs and other screens
export default function FacultyStack() {
  return (
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
}
