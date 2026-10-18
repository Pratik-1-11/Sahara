// React Native notification service for Expo
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { app } from './firebaseConfig';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Type for notification message
interface NotificationMessage {
  title?: string | null;
  body?: string | null;
  data?: Record<string, string> | null;
}

class NotificationService {
  private static instance: NotificationService;
  private messaging: Messaging;
  private token: string | null = null;
  private notificationListeners: ((notification: any) => void)[] = [];
  private responseListeners: ((response: any) => void)[] = [];
  private cleanup: (() => void) | null = null;

  private constructor() {
    this.messaging = getMessaging(app);
    this.setupNotificationListeners();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private setupNotificationListeners() {
    // Handle notifications received in foreground
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      this.notificationListeners.forEach(listener => listener(notification));
      
      // Show an alert when notification is received in foreground
      if (notification.request.content.title && notification.request.content.body) {
        Alert.alert(
          notification.request.content.title,
          notification.request.content.body
        );
      }
    });

    // Handle notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.responseListeners.forEach(listener => listener(response));
    });

    // Store cleanup function
    this.cleanup = () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }

  public async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  public async getNotificationPermissions() {
    return await Notifications.getPermissionsAsync();
  }

  public addNotificationListener(callback: (notification: any) => void) {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        listener => listener !== callback
      );
    };
  }

  public addNotificationResponseListener(callback: (response: any) => void) {
    this.responseListeners.push(callback);
    return () => {
      this.responseListeners = this.responseListeners.filter(
        listener => listener !== callback
      );
    };
  }

  public removeNotificationListener(callback: (notification: any) => void) {
    this.notificationListeners = this.notificationListeners.filter(
      listener => listener !== callback
    );
  }

  public async getFCMToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) return null;

      if (Platform.OS === 'web') {
        const token = await getToken(this.messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE',
        });
        return token;
      }

      // For native platforms, we'll use the Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  public async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }

  // Cleanup method to be called when the service is no longer needed
  public cleanupListeners() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  public async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      // Note: Topic subscription is handled server-side in most cases
      // This is a placeholder for client-side topic subscription if needed
      console.log(`Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  public async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      // Note: Topic unsubscription is handled server-side in most cases
      // This is a placeholder for client-side unsubscription if needed
      console.log(`Unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  // Handle incoming messages
  public onMessage(handler: (message: NotificationMessage) => void): () => void {
    // Handle web platform
    if (Platform.OS === 'web') {
      return onMessage(this.messaging, (payload: any) => {
        const message: NotificationMessage = {
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data as Record<string, string> | undefined
        };
        handler(message);
      });
    }
    
    // For native platforms, we'll use Expo's notification listeners
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const message: NotificationMessage = {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data as Record<string, string> | undefined
      };
      handler(message);
    });
    
    return () => subscription.remove();
  }

  // Handle notification when the app is opened from a quit state
  public async getInitialNotification(): Promise<NotificationMessage | null> {
    try {
      // With Expo, we use the Notifications API to handle initial notifications
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response || !response.notification) return null;
      
      return {
        notification: {
          title: response.notification.request.content.title || undefined,
          body: response.notification.request.content.body || undefined
        },
        data: response.notification.request.content.data as Record<string, string> | undefined
      };
    } catch (error) {
      console.error('Error getting initial notification:', error);
      return null;
    }
  }
}

// Export a singleton instance of the NotificationService
const notificationService = NotificationService.getInstance();
export default notificationService;
