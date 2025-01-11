import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Tracker</Text>
      <Button
        title="Live Location"
        onPress={() => navigation.navigate("LiveLocation")}
      />
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
  button: {
    marginTop: 10,
  },
});

export default HomeScreen;
