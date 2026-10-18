import { useAuth } from "@/components/AuthProvider";
import { SOSService } from "@/firebase/sosService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SOSCountdownProps {
  disasterType: string;
  onComplete: () => void;
  onCancel: () => void;
  style?: any;
}

export default function SOSCountdown({
  disasterType,
  onComplete,
  onCancel,
  style,
}: SOSCountdownProps) {
  const [countdown, setCountdown] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Start countdown when component mounts
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          handleSOSTrigger();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  // Pulse animation
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive]);

  const handleSOSTrigger = async () => {
    if (hasTriggered) return; // Prevent duplicate trigger
    setHasTriggered(true);
    setIsProcessing(true);

    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to send your location with the SOS message.",
          [{ text: "OK" }]
        );
        setIsProcessing(false);
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

      // Get assignedTo based on disaster type
      const assignedTo = SOSService.getAssignedTo(disasterType);

      // Create SOS data
      const sosData = {
        Message: `🚨 EMERGENCY SOS - ${disasterType.toUpperCase()} 🚨\n\nI need immediate help!\n\n📍 Location: ${address}\n🌐 Coordinates: ${latitude.toFixed(
          6
        )}, ${longitude.toFixed(
          6
        )}\n⏰ Time: ${new Date().toLocaleString()}\n\nPlease send help immediately!`,
        additionalInfo: `Emergency triggered for ${disasterType} at ${address}`,
        assignedTo: assignedTo,
        location: {
          lat: latitude,
          lng: longitude,
        },
        severity: "high",
        type: disasterType.toLowerCase(),
        userId: user?.uid || "unknown",
        userName: user?.displayName || user?.email || "Unknown User",
        userPhone: user?.phoneNumber || "Unknown",
        mail: user?.email || "anonymous",
      };

      // Create SOS event in Firestore
      await SOSService.createSOSEvent(sosData);

      // Show success message
      Alert.alert(
        "SOS Triggered! 🚨",
        `Emergency SOS has been sent for ${disasterType} emergency.\n\nHelp is on the way!`,
        [
          {
            text: "Call Emergency Services",
            onPress: () => SOSService.makeEmergencyCall(assignedTo),
          },
          {
            text: "Send SMS",
            onPress: () =>
              SOSService.sendEmergencySMS(assignedTo, sosData.Message),
          },
          { text: "OK", style: "default" },
        ]
      );

      onComplete();
    } catch (error) {
      console.error("SOS error:", error);
      Alert.alert(
        "SOS Error",
        "Unable to send SOS message. Please manually call emergency services.",
        [
          {
            text: "Call Police",
            onPress: () => SOSService.makeEmergencyCall("police"),
          },
          {
            text: "Call Ambulance",
            onPress: () => SOSService.makeEmergencyCall("ambulance"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsActive(false);
    onCancel();
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.countdownContainer,
          {
            transform: [{ scale: isActive ? pulseAnim : scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#FF3B30", "#FF5E54"]}
          style={styles.countdownGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="warning" size={32} color="#FFFFFF" />
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.disasterText}>{disasterType}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>

      {isActive && !isProcessing && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel SOS</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  countdownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
  },
  countdownGradient: {
    flex: 1,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  countdownText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  sosText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 2,
  },
  disasterText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 2,
    textAlign: "center",
  },
  controls: {
    marginTop: 20,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
});
