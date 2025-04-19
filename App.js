// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import StudentStack from './screens/navigators/StudentStack'
import FacultyStack from './screens/navigators/FacultyStack'; 
import AdminStack from './screens/navigators/AdminStack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Student" component={StudentStack} options={{ headerShown: false }} />
        <Stack.Screen name="Faculty" component={FacultyStack} options={{ headerShown: false }} />
        <Stack.Screen name="Admin" component={AdminStack} options={{ headerShown: false }} />
        {/* You can add more screens here like DashboardScreen later */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
