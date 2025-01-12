import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TextInput,
  Button,
  Alert,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';
import Geocoder from 'react-native-geocoding';

// Initialize Geocoder with your API key
Geocoder.init('AIzaSyCI7CwlYJ6Qt5pQGW--inSsJmdEManW-K0');

const LiveLocationScreen = () => {
  const [location, setLocation] = useState({
    latitude: 12.9716, // Bangalore latitude
    longitude: 77.5946, // Bangalore longitude
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [points, setPoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // For editable marker details
  const [editModalVisible, setEditModalVisible] = useState(false);

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

  // Generate points incrementally every 5 seconds
  const generatePointsIncrementally = () => {
    if (isGenerating) {
      Alert.alert('Already Generating', 'Points are already being generated.');
      return;
    }

    setIsGenerating(true);
    const newPoints = [];
    let count = 0;

    const timer = setInterval(() => {
      if (count >= 10) {
        clearInterval(timer);
        setIsGenerating(false);
        pushDataToFirebase(newPoints); // Push all points to Firebase
        return;
      }

      const newLatitude = location.latitude + (Math.random() - 0.5) * 0.01;
      const newLongitude = location.longitude + (Math.random() - 0.5) * 0.01;

      const newPoint = {
        latitude: newLatitude,
        longitude: newLongitude,
        timestamp: new Date().toISOString(),
        pointNumber: count + 1,
        description: `Point ${count + 1}`, // Add a description field
      };

      newPoints.push(newPoint);

      setPoints((prevPoints) => [...prevPoints, newPoint]);
      setRouteCoordinates((prevCoords) => [
        ...prevCoords,
        { latitude: newLatitude, longitude: newLongitude },
      ]);

      count++;
    }, 5000);
  };

  // Push data to Firebase
  const pushDataToFirebase = (data) => {
    database()
      .ref('/realtimeData')
      .set(data)
      .then(() => Alert.alert('Success', 'Data pushed to Firebase'))
      .catch((error) =>
        Alert.alert('Error', `Failed to push data: ${error.message}`)
      );
  };

  // Update marker data in Firebase
  const updateFirebaseMarker = (updatedPoint) => {
    const updatedPoints = points.map((point) =>
      point.timestamp === updatedPoint.timestamp ? updatedPoint : point
    );
    setPoints(updatedPoints);

    database()
      .ref('/realtimeData')
      .set(updatedPoints)
      .then(() => Alert.alert('Success', 'Marker updated in Firebase'))
      .catch((error) =>
        Alert.alert('Error', `Failed to update marker: ${error.message}`)
      );
  };

  // Open edit modal with selected point data
  const handleMarkerPress = (point) => {
    setSelectedPoint({
      ...point,
      editableLatitude: point.latitude.toString(),
      editableLongitude: point.longitude.toString(),
    });
    setEditModalVisible(true);
  };

  // Handle marker updates
  const handleUpdateMarker = () => {
    if (selectedPoint) {
      const updatedPoint = {
        ...selectedPoint,
        latitude: parseFloat(selectedPoint.editableLatitude),
        longitude: parseFloat(selectedPoint.editableLongitude),
      };

      updateFirebaseMarker(updatedPoint);
      setEditModalVisible(false);
    }
  };

  // Handle location search
  const handleSearch = () => {
    if (!searchQuery) {
      Alert.alert('Search Error', 'Please enter a location to search.');
      return;
    }
    Geocoder.from(searchQuery)
      .then((response) => {
        const { lat, lng } = response.results[0].geometry.location;
        setLocation({
          ...location,
          latitude: lat,
          longitude: lng,
        });
      })
      .catch((error) => Alert.alert('Search Error', error.message));
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
        },
        (error) => console.error('Error getting location:', error.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      // Listen for Firebase updates
      const pointsRef = database().ref('/realtimeData');
      pointsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPoints(data);
          setRouteCoordinates(data.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })));
        }
      });

      return () => pointsRef.off('value');
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>
      <MapView
        style={styles.map}
        region={location}
        showsUserLocation={true}
        followsUserLocation={true}
      >
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
            onPress={() => handleMarkerPress(point)}
          />
        ))}
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Generate Points" onPress={generatePointsIncrementally} />
      </View>
      <Modal visible={editModalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Marker Details</Text>
          <Text style={styles.dataText}>Point Number: {selectedPoint?.pointNumber}</Text>
          <Text style={styles.dataText}>Latitude: {selectedPoint?.latitude}</Text>
          <Text style={styles.dataText}>Longitude: {selectedPoint?.longitude}</Text>
          <Text style={styles.dataText}>Timestamp: {selectedPoint?.timestamp}</Text>
          <TextInput
            style={styles.input}
            value={selectedPoint?.editableLatitude}
            onChangeText={(text) =>
              setSelectedPoint((prev) => ({
                ...prev,
                editableLatitude: text,
              }))
            }
            placeholder="Latitude"
          />
          <TextInput
            style={styles.input}
            value={selectedPoint?.editableLongitude}
            onChangeText={(text) =>
              setSelectedPoint((prev) => ({
                ...prev,
                editableLongitude: text,
              }))
            }
            placeholder="Longitude"
          />
          <View style={styles.modalButtons}>
            <Button title="Save" onPress={handleUpdateMarker} />
            <Button
              title="Cancel"
              onPress={() => setEditModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color:'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  dataText: {
    fontSize: 16,
    color: 'black', // Set the text color to gray
    marginVertical: 5,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 10,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'gray',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: 'white',
    width: '100%',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
});

export default LiveLocationScreen;
