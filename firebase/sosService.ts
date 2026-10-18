import { getAuth } from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo, 
  update,
  get,
  DataSnapshot 
} from 'firebase/database';
import { app } from './firebaseConfig';

// Initialize Realtime Database
const database = getDatabase(app);

// Helper function to get the current user ID
const getCurrentUserId = (): string | null => {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
};

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  timestamp: number;
  status: 'active' | 'resolved' | 'cancelled';
  responders: {};
}

// Send SOS alert
export const sendSOSAlert = async (location: { latitude: number; longitude: number }, message: string = 'I need help!') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const alertsRef = ref(database, 'alerts');
  const newAlertRef = push(alertsRef);
  
  if (!newAlertRef.key) throw new Error('Failed to create alert');
  
  const alertData: SOSAlert = {
    id: newAlertRef.key,
    userId,
    location,
    message,
    timestamp: Date.now(),
    status: 'active',
    responders: {}
  };

  await set(newAlertRef, alertData);
  return alertData;
};

// Get active SOS alerts
export const getActiveAlerts = (callback: (alerts: SOSAlert[]) => void) => {
  const alertsRef = ref(database, 'alerts');
  const queryRef = query(alertsRef, orderByChild('status'), equalTo('active'));
  
  const onDataChange = (snapshot: DataSnapshot) => {
    const alerts: SOSAlert[] = [];
    snapshot.forEach((childSnapshot) => {
      alerts.push({
        id: childSnapshot.key!,
        ...childSnapshot.val()
      });
      return false; // Prevent TypeScript from complaining about return value
    });
    callback(alerts);
  };

  onValue(queryRef, onDataChange);
  
  // Return unsubscribe function
  return () => {
    off(queryRef, 'value', onDataChange);
  };
};

// Update alert status
export const updateAlertStatus = async (alertId: string, status: 'active' | 'resolved' | 'cancelled'): Promise<{ success: boolean; error?: string }> => {
  try {
    const alertRef = ref(database, `alerts/${alertId}`);
    await update(alertRef, { status });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating alert status:', error);
    return { success: false, error: error.message };
  }
};

// Respond to an alert
export const respondToAlert = async (alertId: string, responderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const alertRef = ref(database, `alerts/${alertId}/responders/${responderId}`);
    await set(alertRef, { respondedAt: Date.now() });
    return { success: true };
  } catch (error: any) {
    console.error('Error responding to alert:', error);
    return { success: false, error: error.message };
  }
};

// Get a single alert by ID
export const getAlert = async (alertId: string): Promise<{ data: SOSAlert | null; error?: string }> => {
  try {
    const alertRef = ref(database, `alerts/${alertId}`);
    const snapshot = await get(alertRef);
    
    if (!snapshot.exists()) {
      return { data: null, error: 'Alert not found' };
    }
    
    return { 
      data: { 
        id: alertId, 
        ...snapshot.val() 
      } 
    };
  } catch (error: any) {
    console.error('Error getting alert:', error);
    return { data: null, error: error.message };
  }
};
