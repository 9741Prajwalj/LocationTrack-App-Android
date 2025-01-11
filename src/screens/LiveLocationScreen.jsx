import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import database from '@react-native-firebase/database'; // Import Firebase Realtime Database
import Geolocation from '@react-native-community/geolocation'; // Import geolocation

const LiveLocationScreen = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for location fetching
  const [fetchingError, setFetchingError] = useState(false); // Error state for geolocation

  // Bangalore's coordinates
  const bangaloreCoordinates = {
    latitude: 12.971598,
    longitude: 77.594566,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    // Fetch initial location and start real-time tracking
    const startLocationTracking = () => {
      Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toISOString();
          setLocation({ latitude, longitude, timestamp });
          setLoading(false); // Set loading to false once location is fetched
          // Push the current location to Firebase continuously with timestamp
          pushLocationData(latitude, longitude, timestamp);
        },
        (error) => {
          console.error('Error fetching location', error);
          setFetchingError(true); // Set error state in case of failure
          setLoading(false); // Stop loading regardless of error
        },
        {
          enableHighAccuracy: true,   // Request high accuracy
          timeout: 30000,             // Timeout in 30 seconds
          maximumAge: 0,              // Do not use cached location data
          distanceFilter: 5,          // Minimum distance (in meters) before updating location
        }
      );
    };

    startLocationTracking();

    // Set up a real-time listener to fetch updated location from Firebase
    const locationRef = database().ref('Realtime');
    const listener = locationRef.on('value', (snapshot) => {
      const liveLocation = snapshot.val();
      if (liveLocation) {
        setLocation(liveLocation);
      }
    });

    // Clean up the listener and stop location tracking on unmount
    return () => {
      locationRef.off('value', listener);
      Geolocation.clearWatch(); // Clear the watchPosition when the component unmounts
    };
  }, []);

  // Push location data to Firebase continuously
  const pushLocationData = (latitude, longitude, timestamp) => {
    const locationData = {
      latitude,
      longitude,
      timestamp,
    };

    const locationRef = database().ref('Realtime');

    // Remove previous data before pushing the new data
    locationRef.remove()
      .then(() => {
        console.log('Previous location data removed');
        // Push location data to Firebase
        locationRef.push(locationData)
          .then(() => console.log('Location data pushed to Firebase!'))
          .catch((error) => console.error('Error pushing location to Firebase:', error));
      })
      .catch((error) => {
        console.error('Error removing previous location data:', error);
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading location...</Text>
      </View>
    );
  }

  if (fetchingError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to fetch location. Please try again later.</Text>
      </View>
    );
  }

  // Ensure the location is valid; default to Bangalore's coordinates if unavailable
  const validLocation = location && location.latitude && location.longitude
    ? location
    : { ...bangaloreCoordinates, timestamp: '' };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: bangaloreCoordinates.latitude,
        longitude: bangaloreCoordinates.longitude,
        latitudeDelta: bangaloreCoordinates.latitudeDelta,
        longitudeDelta: bangaloreCoordinates.longitudeDelta,
      }}
      region={{
        latitude: validLocation.latitude,
        longitude: validLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true} // Show user location on the map
    >
      {/* Marker for the current location */}
      <Marker
        coordinate={{
          latitude: validLocation.latitude,
          longitude: validLocation.longitude,
        }}
        title={`Location at ${validLocation.timestamp}`}
      />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default LiveLocationScreen;
