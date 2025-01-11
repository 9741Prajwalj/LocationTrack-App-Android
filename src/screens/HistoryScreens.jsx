import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import database from '@react-native-firebase/database'; // Import Firebase Realtime Database
import axios from 'axios'; // For making HTTP requests to Google Maps Directions API

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
  const [routeCoordinates, setRouteCoordinates] = useState([]); // New state to hold the route coordinates

  useEffect(() => {
    if (Object.keys(locations).length > 0) {
      storeDataInFirebase(locations); // Store data when locations are fetched
    }
  }, [locations]);

  const fetchHistory = async () => {
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
        fetchRoute(dummyLocations); // Fetch the route after locations are set
        setLoading(false);
      }, 2000);
    }
  };

  // Function to fetch route using Google Maps Directions API
const fetchRoute = async (locations) => {
  if (!locations || Object.keys(locations).length === 0) return;

  const points = locations[Object.keys(locations)[0]]; // Get the first date's points

  if (points.length > 1) {
    // Create the waypoints array for the Directions API
    const waypoints = points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    // Origin and destination (first and last points)
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];

    // Create the waypoints array excluding the origin and destination
    const intermediateWaypoints = waypoints.slice(1, waypoints.length - 1).map((wp) => `${wp.latitude},${wp.longitude}`).join('|');

    try {
      const googleApiKey = 'AIzaSyCI7CwlYJ6Qt5pQGW--inSsJmdEManW-K0'; // Replace with your Google Maps API Key
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${intermediateWaypoints}&key=${googleApiKey}`;

      const response = await axios.get(url);
      const routeData = response.data.routes[0].legs[0].steps;

      // Extract polyline coordinates from the directions response
      const polyline = [];
      routeData.forEach((step) => {
        polyline.push(...decodePolyline(step.polyline.points));
      });

      setRouteCoordinates(polyline); // Set the coordinates for the route
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  }
};


  // Function to decode polyline points from Google Maps Directions API
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
      let byte, shift = 0, result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }
    return points;
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
          {/* Show route if available */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="blue"
            />
          )}
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
