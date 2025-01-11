import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';

const LiveLocationScreen = () => {
  const [location, setLocation] = useState({
    latitude: 12.9716, // Bangalore latitude
    longitude: 77.5946, // Bangalore longitude
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Stores locations for polyline
  const [points, setPoints] = useState([]); // Stores marker points data

  const [markerUpdateCount, setMarkerUpdateCount] = useState(0); // Track the number of updates

  // Request Location Permission (Android only)
  const getLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need access to your location to display it on the map.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS permissions are handled in Info.plist
  };

  // Simulate a new location (this can be replaced with real-time data if available)
  const getNewLocation = (prevLocation) => {
    const newLatitude = prevLocation.latitude + (Math.random() - 0.5) * 0.001; // Slight variation
    const newLongitude = prevLocation.longitude + (Math.random() - 0.5) * 0.001;
    return {
      latitude: newLatitude,
      longitude: newLongitude,
    };
  };

  // Update Marker and Push Location to Firebase
  const updateMarkerLocation = async () => {
    if (markerUpdateCount >= 10) return; // Stop updates after 10 iterations

    const newLocation = getNewLocation(location);
    const timestamp = new Date().toISOString();

    const locationData = {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      timestamp,
      pointNumber: markerUpdateCount + 1, // Increment point number
    };

    // Update State
    setLocation((prevState) => ({
      ...prevState,
      ...newLocation,
    }));

    // Update route coordinates for polyline
    setRouteCoordinates((prevCoords) => [...prevCoords, newLocation]);

    // Add marker point for this update
    setPoints((prevPoints) => [...prevPoints, locationData]);

    // Push Data to Firebase
    database()
      .ref('/realtimeData')
      .set(locationData)
      .then(() => console.log('Updated location in Firebase'))
      .catch((error) => console.error('Error updating Firebase:', error));

    setMarkerUpdateCount((count) => count + 1); // Increment update count
  };

  const handlePointPress = (point) => {
    Alert.alert(
      `Point ${point.pointNumber}`,
      `Latitude: ${point.latitude.toFixed(6)}\nLongitude: ${point.longitude.toFixed(6)}\nTime: ${point.timestamp}`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    const init = async () => {
      const hasPermission = await getLocationPermission();
      if (!hasPermission) return;

      // Fetch initial location
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation((prevState) => ({
            ...prevState,
            latitude,
            longitude,
          }));
          setRouteCoordinates([{ latitude, longitude }]); // Initialize polyline coordinates
        },
        (error) => console.error('Error getting location:', error.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    init();

    // Start updating marker location every 5 seconds
    const intervalId = setInterval(updateMarkerLocation, 5000);

    // Stop updates after 10 iterations
    setTimeout(() => clearInterval(intervalId), 5000 * 10);

    return () => clearInterval(intervalId);
  }, [markerUpdateCount]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={location}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You are here"
          description="This is your current location"
        />
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={4}
          strokeColor="blue"
        />
        {points.map((point, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            pinColor="red"
            onPress={() => handlePointPress(point)} // Display point details on press
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LiveLocationScreen;
