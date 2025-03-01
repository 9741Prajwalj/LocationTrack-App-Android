import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import database from '@react-native-firebase/database'; // Import Firebase Realtime Database
import MapViewDirections from "react-native-maps-directions"; // Import Directions
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"; // For arrow markers

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

const History = () => {
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

  // // Function to render arrows for each marker showing direction from one point to the next
  // const renderArrowsAlongPath = (coordinates) => {
  //   const arrows = [];
  //   const arrowSpacingInMeters = 800; // Adjust arrow spacing
    
  //   // Calculate distance between two points in meters
  //   const getDistanceInMeters = (start, end) => {
  //     const R = 6371000; // Earth's radius in meters
  //     const lat1 = (start.latitude * Math.PI) / 180;
  //     const lat2 = (end.latitude * Math.PI) / 180;
  //     const deltaLat = ((end.latitude - start.latitude) * Math.PI) / 180;
  //     const deltaLng = ((end.longitude - start.longitude) * Math.PI) / 180;

  //     const a =
  //       Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
  //       Math.cos(lat1) *
  //         Math.cos(lat2) *
  //         Math.sin(deltaLng / 2) *
  //         Math.sin(deltaLng / 2);
  //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //     return R * c;
  //   };

  //   // Generate intermediate points for arrow placement
  //   const getIntermediatePoints = (start, end, totalDistance) => {
  //     const numArrows = Math.floor(totalDistance / arrowSpacingInMeters);
  //     const latStep = (end.latitude - start.latitude) / numArrows;
  //     const lngStep = (end.longitude - start.longitude) / numArrows;

  //     const points = [];
  //     for (let i = 1; i <= numArrows; i++) {
  //       points.push({
  //         latitude: start.latitude + latStep * i,
  //         longitude: start.longitude + lngStep * i,
  //       });
  //     }
  //     return points;
  //   };

  //   // Place arrows along the path
  //   for (let i = 0; i < coordinates.length - 1; i++) {
  //     const start = coordinates[i];
  //     const end = coordinates[i + 1];
  //     const totalDistance = getDistanceInMeters(start, end);

  //     const intermediatePoints = getIntermediatePoints(start, end, totalDistance);
  //     const angle =
  //       (Math.atan2(
  //         end.longitude - start.longitude,
  //         end.latitude - start.latitude
  //       ) *
  //         180) /
  //       Math.PI;

  //     intermediatePoints.forEach((point, index) => {
  //       arrows.push(
  //         <Marker
  //           key={`arrow-${i}-${index}`}
  //           coordinate={point}
  //           anchor={{ x: 0.5, y: 0.5 }}
  //         >
  //           <MaterialCommunityIcons
  //             name="arrow-right"
  //             size={24} // Adjust size as needed
  //             color="red" // Arrow color
  //             style={{ transform: [{ rotate: `${angle}deg` }] }}
  //           />
  //         </Marker>
  //       );
  //     });
  //   }

  //   return arrows;
  // };

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
          {/* Markers for locations */}
          {Object.keys(locations).map((date) =>
            locations[date].map((loc, index) => (
              <Marker
                key={`${date}-${index}`}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={`Point ${index + 1}`}
                description={`Latitude: ${loc.latitude.toFixed(6)}, Longitude: ${loc.longitude.toFixed(6)}\nDateTime: ${new Date(loc.timestamp).toLocaleString()}`}
                pinColor={index === 0 ? "green" : index === locations[date].length - 1 ? "red" : "blue"}
              />
            ))
          )}

          {/* Render polylines and arrows */}
          {Object.keys(locations).map((date) => {
            const coordinates = locations[date].map((loc) => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }));

            return (
              <>
                {/* Polyline with MapViewDirections */}
                <MapViewDirections
                  key={`polyline-${date}`}
                  origin={coordinates[0]}
                  destination={coordinates[coordinates.length - 1]}
                  waypoints={coordinates.slice(1, coordinates.length - 1)}
                  apikey="AIzaSyCI7CwlYJ6Qt5pQGW--inSsJmdEManW-K0" // Replace with your API key
                  strokeWidth={3}
                  strokeColor="blue"
                />

                {/* Render arrows above polyline */}
                {/*renderArrowsAlongPath(coordinates)*/}
              </>
            );
          })}
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

export default History;
