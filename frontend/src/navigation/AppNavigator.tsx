import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExampleScreen from '../screens/ExampleScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Example" component={ExampleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/*import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";
import { ExampleScreen } from "../screens/ExampleScreen";
import { NavigationContainer } from "@react-navigation/native";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false}}>
            <Stack.Screen 
            name="Example"
            component={ExampleScreen}
            // options={{ title: Inicio }}
            />
            </Stack.Navigator>
        </NavigationContainer>
    );
} */
