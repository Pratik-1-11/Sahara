import { useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNotifications } from "../components/NotificationProvider";

export const useNotificationSetup = () => {
  const { registerForPushNotifications, notificationPermissions } =
    useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    const setupNotifications = async () => {
      // Only register if user is authenticated and permissions are not granted
      if (
        user &&
        (!notificationPermissions ||
          notificationPermissions.status !== "granted")
      ) {
        try {
          await registerForPushNotifications();
        } catch (error) {
          console.error("Failed to setup notifications:", error);
        }
      }
    };

    setupNotifications();
  }, [user, notificationPermissions, registerForPushNotifications]);
};
