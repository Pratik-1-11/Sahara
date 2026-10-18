import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNotifications } from "./NotificationProvider";

interface SOSButtonProps {
  onPress?: () => void;
  style?: any;
}

// Emergency contacts for SOS
const emergencyContacts = [
  { name: "Police", number: "100" },
  { name: "Ambulance", number: "102" },
  { name: "Fire Department", number: "101" },
  { name: "Mountain Rescue", number: "103" },
];

export default function SOSButton({ onPress, style }: SOSButtonProps) {
  const [sosPressed, setSosPressed] = useState(false);
  const sosScaleAnim = useRef(new Animated.Value(1)).current;
  const { sendEmergencyNotification } = useNotifications();

  const handleSOSPress = async () => {
    if (sosPressed) return; // Prevent multiple presses

    setSosPressed(true);

    // Animate button press
    Animated.sequence([
      Animated.timing(sosScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sosScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to send your location with the SOS message.",
          [{ text: "OK" }]
        );
        setSosPressed(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = "Unknown Location";
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const parts = [];
        if (addr.city) parts.push(addr.city);
        if (addr.district) parts.push(addr.district);
        if (addr.region) parts.push(addr.region);
        address = parts.join(", ") || "Unknown Location";
      }

      // Send emergency notification
      try {
        await sendEmergencyNotification("SOS Emergency", address);
      } catch (error) {
        console.error("Failed to send emergency notification:", error);
      }

      // Create SOS message
      const sosMessage = `🚨 EMERGENCY SOS 🚨\n\nI need immediate help!\n\n📍 Location: ${address}\n🌐 Coordinates: ${latitude.toFixed(
        6
      )}, ${longitude.toFixed(
        6
      )}\n⏰ Time: ${new Date().toLocaleString()}\n\nPlease send help immediately!`;

      // Send SMS to all emergency contacts
      let successCount = 0;
      const totalContacts = emergencyContacts.length;

      for (const contact of emergencyContacts) {
        try {
          const smsUrl = `sms:${contact.number}?body=${encodeURIComponent(
            sosMessage
          )}`;
          const supported = await Linking.canOpenURL(smsUrl);

          if (supported) {
            await Linking.openURL(smsUrl);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to send SMS to ${contact.name}:`, error);
        }
      }

      // Show result
      if (successCount > 0) {
        Alert.alert(
          "SOS Message Sent! 🚨",
          `Emergency messages with your location have been sent to ${successCount} out of ${totalContacts} emergency contacts.\n\nHelp is on the way!`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "SMS Not Available",
          "Unable to send SMS automatically. Please manually call emergency services:\n\nPolice: 100\nAmbulance: 102\nFire: 101",
          [
            { text: "Call Police", onPress: () => Linking.openURL("tel:100") },
            {
              text: "Call Ambulance",
              onPress: () => Linking.openURL("tel:102"),
            },
            { text: "Call Fire", onPress: () => Linking.openURL("tel:101") },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }

      // Call custom onPress if provided
      if (onPress) {
        onPress();
      }
    } catch (error) {
      console.error("SOS error:", error);
      Alert.alert(
        "SOS Error",
        "Unable to send SOS message. Please manually call emergency services.",
        [
          { text: "Call Police", onPress: () => Linking.openURL("tel:100") },
          { text: "Call Ambulance", onPress: () => Linking.openURL("tel:102") },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setSosPressed(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.sosButton,
        style,
        {
          transform: [{ scale: sosScaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.sosButtonTouchable}
        onPress={handleSOSPress}
        disabled={sosPressed}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#FF3B30", "#FF5E54"]}
          style={styles.sosButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {sosPressed ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="warning" size={28} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  sosButtonTouchable: {
    flex: 1,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sosButtonGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  sosButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
});
