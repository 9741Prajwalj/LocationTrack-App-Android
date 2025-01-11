import React from "react";
import { View, Text, StyleSheet, Button, Image } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
    {/* Image added here */}
    <Image
        source={require("../components/skoegle_logo.png")} // Replace with your image path
        style={styles.image}
      />
      <Text style={styles.title}>Location Tracker</Text>
      <Button
        title="Live Location"
        onPress={() => navigation.navigate("LiveLocation")}
      />
      <View style={styles.space}></View>
      <Button
        title="History Track"
        onPress={() => navigation.navigate("History")}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  image: {
    width: 200, // Adjust width as needed
    height: 100, // Adjust height as needed
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
  space: {
    margin:20,
  }
});

export default HomeScreen;
