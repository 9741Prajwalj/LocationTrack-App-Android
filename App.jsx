import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import firebase from "@react-native-firebase/app";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreens";
import LiveLocationScreen from "./src/screens/LiveLocationScreen";
import HistoryScreen from "./src/screens/HistoryScreens";
import History from "./src/screens/History";
const Stack = createStackNavigator();

const App = () => {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [appName, setAppName] = useState("");

  // Function to check Firebase initialization and print the app name
  useEffect(() => {
    try {
      const app = firebase.apps[0]; // Firebase app instance
      if (app) {
        setFirebaseInitialized(true);
        setAppName(app.name); // Get Firebase app name
        console.log("Firebase initialized: ", app.name);
      }
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  return (
    <>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LiveLocation" component={LiveLocationScreen} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="HistoryLive" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
};


const styles = StyleSheet.create({
    container: {
      width:'100%',
      height:'10%',
    },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '80%',
  },
});

export default App;
