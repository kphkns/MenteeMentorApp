// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import StudentStack from './screens/navigators/StudentStack'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Student" component={StudentStack} options={{ headerShown: false }} />
        {/* You can add more screens here like DashboardScreen later */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
