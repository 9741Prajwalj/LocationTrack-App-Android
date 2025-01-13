import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import database from '@react-native-firebase/database';
import { useNavigation } from '@react-navigation/native';  // Import useNavigation

const LiveLocationScreen = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const mapRef = useRef(null);
  const navigation = useNavigation();  // Use navigation hook

  useEffect(() => {
    const locationRef = database().ref('realtimeData/SinglePoint');
    
    locationRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const newCoordinate = {
          latitude: data.Latitude,
          longitude: data.Longitude,
          date: data.Date,
          time: data.Time,
        };

        setCoordinates(newCoordinate);
        setHistoryData(prevData => [...prevData, newCoordinate]);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: newCoordinate.latitude,
            longitude: newCoordinate.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 500);
        }
      }
    });

    return () => {
      locationRef.off('value');
    };
  }, []);

  const renderPolyline = () => {
    if (showHistory && historyData.length > 1) {
      return (
        <Polyline coordinates={historyData} strokeColor="#FF0000" strokeWidth={3} />
      );
    }
    return null;
  };

  const handleShowHistory = () => {
    navigation.navigate('History', { historyData });  // Pass history data to the History screen
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: coordinates?.latitude || 0,
          longitude: coordinates?.longitude || 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
      >
        {/* Marker for current location (red color for fetched location) */}
        {coordinates ? (
          <Marker
            coordinate={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }}
            title={`Location at ${coordinates.date}`}
            description={`Time: ${coordinates.time}`}
            pinColor="red"  // Red color for fetched location marker
            // image={require('../components/skoegle_logo.png')}  // Optional: Custom image for the marker
          />
        ) : null}

        {/* Marker for history data */}
        {showHistory && historyData.length > 0 &&
          historyData.map((coordinate, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              }}
              title={`Location at ${coordinate.date}`}
              description={`Time: ${coordinate.time}`}
              pinColor="red"  // Optional: Customize the color of the history markers (red)
            />
          ))
        }

        {renderPolyline()}
      </MapView>

      {/* Show the current location info */}
      <View style={{ position: 'absolute', bottom: 20, left: 10, padding: 10 }}>
        <Text>
          Current Location: {coordinates ? `Lat: ${coordinates.latitude}, Long: ${coordinates.longitude}` : 'Loading...'}
        </Text>
      </View>

      {/* Button to toggle showing history and polyline */}
      <View style={{ position: 'absolute', bottom: 80, left: 10, padding: 10 }}>
        <Button title="Show History" onPress={handleShowHistory} />
      </View>
    </View>
  );
};

export default LiveLocationScreen;
