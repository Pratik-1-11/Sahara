import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import notificationService from "../firebase/notificationService";
import { useThemeColor } from "../hooks/useThemeColor";
import { useNotifications } from "./NotificationProvider";

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onClose,
}) => {
  const {
    expoPushToken,
    notificationPermissions,
    registerForPushNotifications,
    sendLocalNotification,
    sendEmergencyNotification,
    sendSafetyTipNotification,
    sendWeatherAlertNotification,
    requestPermissions,
  } = useNotifications();

  const [settings, setSettings] = useState({
    emergencyAlerts: true,
    safetyTips: true,
    weatherAlerts: true,
    dailyReminders: false,
  });

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermissions();
      if (result.status === "granted") {
        await registerForPushNotifications();
        Alert.alert("Success", "Notification permissions granted!");
      } else {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to request notification permissions.");
    }
  };

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const testNotification = async (type: string) => {
    try {
      switch (type) {
        case "local":
          await sendLocalNotification(
            "Test Notification",
            "This is a test notification from Sahara app!",
            { type: "test" }
          );
          break;
        case "emergency":
          await sendEmergencyNotification("Test Emergency", "Test Location");
          break;
        case "safety":
          await sendSafetyTipNotification(
            "Test Safety Tip",
            "This is a test safety tip notification."
          );
          break;
        case "weather":
          await sendWeatherAlertNotification("Storm", "Severe");
          break;
      }
      Alert.alert("Success", `${type} notification sent successfully!`);
    } catch (error) {
      Alert.alert("Error", `Failed to send ${type} notification.`);
    }
  };

  const renderPermissionStatus = () => {
    // Check if running in Expo Go
    const isExpoGo = notificationService.isRunningInExpoGo();
    const envInfo = notificationService.getEnvironmentInfo();

    if (isExpoGo) {
      return (
        <View style={[styles.section, { borderColor: "#F59E0B" }]}>
          <Text style={[styles.sectionTitle, { color: "#F59E0B" }]}>
            ⚠️ Expo Go Limitation
          </Text>
          <Text style={[styles.description, { color: textColor }]}>
            Push notifications are not supported in Expo Go with SDK 53. You
            need to use a development build to test push notifications.
          </Text>
          <View style={styles.expoGoInfo}>
            <Text style={[styles.infoText, { color: textColor }]}>
              Environment: {envInfo.appOwnership}
            </Text>
            <Text style={[styles.infoText, { color: textColor }]}>
              Platform: {envInfo.platform}
            </Text>
            <Text style={[styles.infoText, { color: textColor }]}>
              SDK: {envInfo.sdkVersion}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#F59E0B" }]}
            onPress={() => {
              Alert.alert(
                "Development Build Required",
                "To test push notifications, you need to:\n\n1. Build a development version\n2. Install it on your device\n3. Test notifications there\n\nSee DEVELOPMENT_BUILD_SETUP.md for instructions.",
                [{ text: "OK" }]
              );
            }}
          >
            <Text style={styles.buttonText}>
              How to Set Up Development Build
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Check for Firebase initialization error
    if (
      expoPushToken === null &&
      notificationPermissions?.status === "granted"
    ) {
      return (
        <View style={[styles.section, { borderColor: "#EF4444" }]}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>
            🔧 Firebase Configuration Issue
          </Text>
          <Text style={[styles.description, { color: textColor }]}>
            Push notifications are currently being configured. You can still
            test local notifications while we fix the Firebase setup.
          </Text>
          <View style={styles.expoGoInfo}>
            <Text style={[styles.infoText, { color: textColor }]}>
              Status: Permissions granted
            </Text>
            <Text style={[styles.infoText, { color: textColor }]}>
              Push Token: Not available yet
            </Text>
            <Text style={[styles.infoText, { color: textColor }]}>
              Local Notifications: ✅ Available
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#10B981" }]}
            onPress={() => testNotification("local")}
          >
            <Text style={styles.buttonText}>Test Local Notification</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!notificationPermissions) {
      return (
        <View style={[styles.section, { borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Notification Permissions
          </Text>
          <Text style={[styles.description, { color: textColor }]}>
            Enable notifications to receive emergency alerts and safety tips.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#3B82F6" }]}
            onPress={handlePermissionRequest}
          >
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.section, { borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Notification Status
        </Text>
        <Text style={[styles.statusText, { color: textColor }]}>
          Status: {notificationPermissions.status}
        </Text>
        {expoPushToken && (
          <Text style={[styles.tokenText, { color: textColor }]}>
            Token: {expoPushToken.substring(0, 20)}...
          </Text>
        )}
      </View>
    );
  };

  const renderSettings = () => (
    <View style={[styles.section, { borderColor }]}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Notification Preferences
      </Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Emergency Alerts
          </Text>
          <Text style={[styles.settingDescription, { color: textColor }]}>
            Receive immediate alerts for emergencies in your area
          </Text>
        </View>
        <Switch
          value={settings.emergencyAlerts}
          onValueChange={() => handleSettingToggle("emergencyAlerts")}
          trackColor={{ false: "#767577", true: "#3B82F6" }}
          thumbColor={settings.emergencyAlerts ? "#ffffff" : "#f4f3f4"}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Safety Tips
          </Text>
          <Text style={[styles.settingDescription, { color: textColor }]}>
            Get helpful safety tips and guidelines
          </Text>
        </View>
        <Switch
          value={settings.safetyTips}
          onValueChange={() => handleSettingToggle("safetyTips")}
          trackColor={{ false: "#767577", true: "#3B82F6" }}
          thumbColor={settings.safetyTips ? "#ffffff" : "#f4f3f4"}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Weather Alerts
          </Text>
          <Text style={[styles.settingDescription, { color: textColor }]}>
            Stay informed about severe weather conditions
          </Text>
        </View>
        <Switch
          value={settings.weatherAlerts}
          onValueChange={() => handleSettingToggle("weatherAlerts")}
          trackColor={{ false: "#767577", true: "#3B82F6" }}
          thumbColor={settings.weatherAlerts ? "#ffffff" : "#f4f3f4"}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Daily Reminders
          </Text>
          <Text style={[styles.settingDescription, { color: textColor }]}>
            Receive daily safety check reminders
          </Text>
        </View>
        <Switch
          value={settings.dailyReminders}
          onValueChange={() => handleSettingToggle("dailyReminders")}
          trackColor={{ false: "#767577", true: "#3B82F6" }}
          thumbColor={settings.dailyReminders ? "#ffffff" : "#f4f3f4"}
        />
      </View>
    </View>
  );

  const renderTestSection = () => (
    <View style={[styles.section, { borderColor }]}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Test Notifications
      </Text>
      <Text style={[styles.description, { color: textColor }]}>
        Test different types of notifications to ensure they're working
        properly.
      </Text>

      <View style={styles.testButtons}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: "#10B981" }]}
          onPress={() => testNotification("local")}
        >
          <Text style={styles.buttonText}>Test Local</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: "#EF4444" }]}
          onPress={() => testNotification("emergency")}
        >
          <Text style={styles.buttonText}>Test Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: "#F59E0B" }]}
          onPress={() => testNotification("safety")}
        >
          <Text style={styles.buttonText}>Test Safety</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: "#8B5CF6" }]}
          onPress={() => testNotification("weather")}
        >
          <Text style={styles.buttonText}>Test Weather</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Notification Settings
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: textColor }]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderPermissionStatus()}
      {renderSettings()}
      {renderTestSection()}
    </ScrollView>
  );
};

export default NotificationSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  testButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  expoGoInfo: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  infoText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: "monospace",
  },
});
