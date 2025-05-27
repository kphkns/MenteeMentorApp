// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import StudentStack from "./screens/navigators/StudentStack";
import FacultyStack from "./screens/navigators/FacultyStack";
import AdminStack from "./screens/navigators/AdminStack";
import PasswordResetScreen from "./screens/PasswordResetScreen";

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
              backgroundColor: "#f2f6ff",
              elevation: 0,
              shadowColor: "#f2f6ff",
              shadowOpacity: 0.0,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0
            },
            headerTintColor: "black",
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            // headerTitleAlign: 'center',
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
        <Stack.Screen
          name="PasswordResetScreen"
          component={PasswordResetScreen}
          options={{
            title: "",
            headerShown: true, // If you want to hide the header, keep this line.
            headerStyle: {
              backgroundColor: "#f2f6ff",
              elevation: 0,
              shadowColor: "#f2f6ff",
              shadowOpacity: 0.0,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0
            },
            headerTintColor: "black",
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            // headerTitleAlign: 'center',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
