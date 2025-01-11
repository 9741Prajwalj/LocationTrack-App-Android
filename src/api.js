import database from '@react-native-firebase/database';

// API 1: Fetch Realtime Data (Latitude & Longitude)
export const fetchRealtimeLocation = async () => {
  try {
    const snapshot = await database().ref('Realtime').once('value');
    return snapshot.val(); // Returns the latest latitude & longitude
  } catch (error) {
    console.error('Error fetching realtime location:', error);
    throw error;
  }
};

// API 2: Fetch Logs by Date (Retrieve logs in the format DD/MM/YYYY)
export const fetchLogsByDate = async (date) => {
  try {
    const snapshot = await database().ref(`Logs/${date}`).once('value');
    return snapshot.val(); // Returns logs for the given date
  } catch (error) {
    console.error('Error fetching logs by date:', error);
    throw error;
  }
};
