// StudentStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import StudentHome from '../student/StudentHome';
import StudentAppointments from '../student/StudentAppointments';
import StudentProfile from '../student/StudentProfile';
import ChangePassword from '../student/ChangePassword';
import AcadamicThings from '../student/AcadamicThings'
import StudentMentorcard from '../student/StudentMentorcard'

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Appointments') iconName = 'calendar';
          else if (route.name === 'Acadamic') iconName = 'calendar';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={StudentHome} />
      <Tab.Screen name="Appointments" component={StudentAppointments} />
      <Tab.Screen name="Acadamic" component={AcadamicThings} />
      <Tab.Screen name="Profile" component={StudentProfile} />
    </Tab.Navigator>
  );
}

export default function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <Tab.Screen name="ChangePassword" component={ChangePassword} options={{ tabBarButton: () => null, tabBarVisible: false }} />
       <Stack.Screen name="StudentMentorcard" component={StudentMentorcard} /> 
    </Stack.Navigator>
  );
}
