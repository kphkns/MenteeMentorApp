// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import StudentStack from "./screens/navigators/StudentStack";
import FacultyStack from "./screens/navigators/FacultyStack";
import AdminStack from "./screens/navigators/AdminStack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "#f2f6ff", // Primary color for header background
              elevation: 0, // Android shadow
              shadowColor: "#f2f6ff", // iOS shadow color
              shadowOpacity: 0.0,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0
            },
            headerTintColor: "black", // White text/icons
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
              
            },
            // headerTitleAlign: 'center', // Centered title
          }}
        />
        <Stack.Screen
          name="Student"
          component={StudentStack}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Faculty"
          component={FacultyStack}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminStack}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
