import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { auth } from "../firebase/firebaseConfig";
import notificationService from "../firebase/notificationService";
import { useAuth } from "./AuthProvider";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: any;
  registerForPushNotifications: () => Promise<void>;
  sendLocalNotification: (
    title: string,
    body: string,
    data?: any
  ) => Promise<void>;
  sendEmergencyNotification: (
    emergencyType: string,
    location: string
  ) => Promise<void>;
  sendSafetyTipNotification: (
    tipTitle: string,
    tipContent: string
  ) => Promise<void>;
  sendWeatherAlertNotification: (
    weatherType: string,
    severity: string
  ) => Promise<void>;
  notificationPermissions: any;
  requestPermissions: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [notificationPermissions, setNotificationPermissions] =
    useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Check notification permissions on mount
    checkNotificationPermissions();

    // Set up notification listeners
    const notificationListener = notificationService.addNotificationListener(
      (notification) => {
        setNotification(notification);
      }
    );

    const responseListener =
      notificationService.addNotificationResponseListener((response) => {
        console.log("Notification response:", response);
        // Handle notification tap here
        handleNotificationResponse(response);
      });

    return () => {
      notificationService.removeNotificationListener(notificationListener);
      notificationService.removeNotificationListener(responseListener);
    };
  }, []);

  const checkNotificationPermissions = async () => {
    const permissions = await notificationService.getNotificationPermissions();
    console.log("[checkNotificationPermissions] permissions:", permissions);
    setNotificationPermissions(permissions);
  };

  const requestPermissions = async () => {
    const permissions =
      await notificationService.requestNotificationPermissions();
    setNotificationPermissions(permissions);
    return permissions;
  };

  const registerForPushNotifications = async () => {
    try {
      const token =
        await notificationService.registerForPushNotificationsAsync();
      console.log("[registerForPushNotifications] token:", token);
      if (token && typeof token === "string" && token.trim() !== "") {
        setExpoPushToken(token);

        // Save token to Firestore if user is authenticated
        const currentUser = auth.currentUser;
        console.log("[registerForPushNotifications] currentUser:", currentUser);
        if (
          currentUser &&
          currentUser.uid &&
          typeof currentUser.uid === "string" &&
          currentUser.uid.trim() !== ""
        ) {
          await notificationService.savePushToken(currentUser.uid, token);
        } else {
          console.warn(
            "[registerForPushNotifications] No valid currentUser found"
          );
        }

        console.log("Push token registered:", token);
      } else {
        console.warn("[registerForPushNotifications] No valid token received");
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      Alert.alert("Error", "Failed to register for push notifications");
    }
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      await notificationService.sendLocalNotification(title, body, data);
    } catch (error) {
      console.error("Error sending local notification:", error);
    }
  };

  const sendEmergencyNotification = async (
    emergencyType: string,
    location: string
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await notificationService.sendEmergencyNotification(
          currentUser.uid,
          emergencyType,
          location
        );
      }
    } catch (error) {
      console.error("Error sending emergency notification:", error);
    }
  };

  const sendSafetyTipNotification = async (
    tipTitle: string,
    tipContent: string
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await notificationService.sendSafetyTipNotification(
          currentUser.uid,
          tipTitle,
          tipContent
        );
      }
    } catch (error) {
      console.error("Error sending safety tip notification:", error);
    }
  };

  const sendWeatherAlertNotification = async (
    weatherType: string,
    severity: string
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await notificationService.sendWeatherAlertNotification(
          currentUser.uid,
          weatherType,
          severity
        );
      }
    } catch (error) {
      console.error("Error sending weather alert notification:", error);
    }
  };

  const handleNotificationResponse = (response: any) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    switch (data.type) {
      case "emergency":
        Alert.alert(
          "Emergency Alert",
          `${data.emergencyType} emergency detected in your area. Please take necessary precautions.`,
          [{ text: "OK" }]
        );
        break;
      case "safety_tip":
        Alert.alert("Safety Tip", data.content, [{ text: "OK" }]);
        break;
      case "weather_alert":
        Alert.alert(
          "Weather Alert",
          `${data.severity} ${data.weatherType} weather conditions detected. Stay safe!`,
          [{ text: "OK" }]
        );
        break;
      default:
        console.log("Unknown notification type:", data.type);
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    registerForPushNotifications,
    sendLocalNotification,
    sendEmergencyNotification,
    sendSafetyTipNotification,
    sendWeatherAlertNotification,
    notificationPermissions,
    requestPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
