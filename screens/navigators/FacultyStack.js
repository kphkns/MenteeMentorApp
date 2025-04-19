import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import FacultyHome from '../faculty/FacultyHome';
import FacultyProfile from '../faculty/FacultyProfile';

const Tab = createBottomTabNavigator();

export default function FacultyStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={FacultyHome} />
      <Tab.Screen name="Profile" component={FacultyProfile} />
    </Tab.Navigator>
  );
}
