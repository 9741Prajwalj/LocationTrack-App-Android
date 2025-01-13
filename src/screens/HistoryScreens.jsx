import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';

const HistoryScreen = ({ route }) => {
  const { historyData } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredHistory, setFilteredHistory] = useState(historyData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState(null);

  const googleApiKey = 'AIzaSyCI7CwlYJ6Qt5pQGW--inSsJmdEManW-K0'; // Make sure to replace this with your actual API key

  // Function to render markers on the map
  const renderMarkers = () => {
    return filteredHistory.map((item, index) => {
      let markerColor = 'blue';
      if (index === 0) {
        markerColor = 'green';  // Start point
      } else if (index === filteredHistory.length - 1) {
        markerColor = 'red';  // End point
      }

      return (
        <Marker
          key={index}
          coordinate={{
            latitude: item.latitude,
            longitude: item.longitude,
          }}
          title={`Location at ${item.date}`}
          description={`Time: ${item.time}`}
          pinColor={markerColor}
          onPress={() => {
            alert(`Location: ${item.date}\nTime: ${item.time}\nLat: ${item.latitude}\nLong: ${item.longitude}`);
          }}
        />
      );
    });
  };

  // Date change handler for filtering
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      filterHistoryByDate(selectedDate);
    }
  };

  // Filter history by selected date
  const filterHistoryByDate = (date) => {
    const selectedDateStr = date.toISOString().split('T')[0];
    const filteredData = historyData.filter(item => item.date === selectedDateStr);
    setFilteredHistory(filteredData);
  };

  // Show all history in an alert
  const showAllHistory = () => {
    const allHistoryText = historyData.map((item, index) => (
      `${index + 1}. Location at ${item.date}\nTime: ${item.time}\nLat: ${item.latitude}, Long: ${item.longitude}\n\n`
    )).join('');
    Alert.alert('All History', allHistoryText);
  };

  useEffect(() => {
    // No need to fetch directions manually now with MapViewDirections
  }, [filteredHistory]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Location History</Text>

      <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={{ fontSize: 16, marginTop: 10 }}>
        Selected Date: {selectedDate.toISOString().split('T')[0]}
      </Text>

      <Button title="Show All History" onPress={showAllHistory} />

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: filteredHistory[0]?.latitude || 0,
          longitude: filteredHistory[0]?.longitude || 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {renderMarkers()}

        {/* Use MapViewDirections to draw the route */}
        {filteredHistory.length > 1 && (
          <MapViewDirections
            origin={{
              latitude: filteredHistory[0].latitude,
              longitude: filteredHistory[0].longitude,
            }}
            destination={{
              latitude: filteredHistory[filteredHistory.length - 1].latitude,
              longitude: filteredHistory[filteredHistory.length - 1].longitude,
            }}
            waypoints={filteredHistory.slice(1, -1).map(item => ({
              latitude: item.latitude,
              longitude: item.longitude,
            }))}
            apikey={googleApiKey}
            strokeWidth={3}
            strokeColor="blue"
            onError={(errorMessage) => {
              setError(errorMessage);
              console.log('Error: ', errorMessage);
            }}
          />
        )}

        {error && (
          <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 999 }}>
            <Text style={{ color: 'red' }}>{`Error: ${error}`}</Text>
          </View>
        )}
      </MapView>
    </View>
  );
};

export default HistoryScreen;
