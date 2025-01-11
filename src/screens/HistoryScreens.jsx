import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import database from '@react-native-firebase/database'; // Import Firebase Realtime Database

// Generate dummy data for the last 7 days (excluding future dates)
const generateDummyDataForSelectedDate = (selectedDate) => {
  const dateString = selectedDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  const points = [];
  for (let j = 0; j < 10; j++) {
    points.push({
      latitude: 12.9 + Math.random() * 0.1, // Bangalore region latitudes
      longitude: 77.5 + Math.random() * 0.1, // Bangalore region longitudes
      timestamp: selectedDate.toISOString(), // Timestamp for the entire day's data
    });
  }
  return { [dateString]: points }; // Return data for the selected date only
};

// Store data in Firebase Realtime Database
const storeDataInFirebase = async (data) => {
  try {
    const logsRef = database().ref('logs'); // Reference to the 'logs' path in Realtime Database
    for (const date in data) {
      const dayLogs = data[date];
      await logsRef.child(date).set(dayLogs); // Store all points for the date under the date key
    }
    console.log("Data successfully stored in Firebase Realtime Database");
  } catch (error) {
    console.error("Error storing data in Firebase Realtime Database:", error);
  }
};

const HistoryScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFutureDate, setIsFutureDate] = useState(false);

  useEffect(() => {
    if (Object.keys(locations).length > 0) {
      storeDataInFirebase(locations); // Store data when locations are fetched
    }
  }, [locations]);

  const fetchHistory = () => {
    const today = new Date();
    // Check if the selected date is in the future
    if (selectedDate > today) {
      setIsFutureDate(true); // Set flag for future date
      setLoading(false);
      setLocations({});
      return; // Do not generate data for future dates
    } else {
      setIsFutureDate(false);
      setLoading(true);

      // Generate dummy historical data only for the last 7 days
      setTimeout(() => {
        const dummyLocations = generateDummyDataForSelectedDate(selectedDate);
        setLocations(dummyLocations);
        setLoading(false);
      }, 2000);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false); // Close the picker
    if (date) {
      setSelectedDate(date); // Update selected date
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={`Select Date: ${selectedDate.toLocaleDateString()}`}
        onPress={() => setShowDatePicker(true)}
      />
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      <Button title="Fetch History" onPress={fetchHistory} />
      {isFutureDate && (
        <Text style={styles.errorText}>Data for future dates is not available.</Text>
      )}
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 12.9716, // Bangalore center latitude
            longitude: 77.5946, // Bangalore center longitude
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* Only show data for the selected date */}
          {Object.keys(locations).map((date) => (
            locations[date].map((loc, index) => (
              <Marker
                key={`${date}-${index}`}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={`Point ${index + 1}`}
                description={`Latitude: ${loc.latitude.toFixed(6)}, Longitude: ${loc.longitude.toFixed(6)}\nDateTime: ${new Date(loc.timestamp).toLocaleString()}`}
              />
            ))
          ))}
          {Object.keys(locations).map((date) => (
            <Polyline
              key={date}
              coordinates={locations[date].map((loc) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))}
              strokeWidth={2}
              strokeColor="blue"
            />
          ))}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingText: {
    textAlign: "center",
    marginVertical: 10,
  },
  errorText: {
    textAlign: "center",
    color: "red",
    marginVertical: 10,
  },
  map: {
    flex: 1,
  },
});

export default HistoryScreen;
