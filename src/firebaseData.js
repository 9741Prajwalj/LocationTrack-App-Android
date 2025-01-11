import database from '@react-native-firebase/database';

// Initialize Firebase Data (Populate with Dummy Data)
export const initializeFirebaseData = async () => {
  try {
    // Realtime Data Initialization
    await database().ref('Realtime').set({
      latitude: 37.78825,
      longitude: -122.4324,
    });

    // Logs Data Initialization
    await database().ref('Logs/01-01-2025').set({
      '10:00:00': { latitude: 37.78825, longitude: -122.4324 },
      '10:05:00': { latitude: 37.78925, longitude: -122.4334 },
    });

    await database().ref('Logs/02-01-2025').set({
      '11:00:00': { latitude: 37.79025, longitude: -122.4344 },
    });

    console.log('Firebase data initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase data:', error);
  }
};
