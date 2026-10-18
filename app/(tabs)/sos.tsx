// =========================
// Imports
// =========================
import ProtectedRoute from "@/components/ProtectedRoute";
import SOSCountdown from "@/components/SOSCountdown";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// =========================
// Constants and Configurations
// =========================
const { width } = Dimensions.get("window");

// Disasters and Contacts Data
const disasters = [
  {
    id: "1",
    title: "Earthquake",
    icon: "earth",
    color: "#FF3B30",
    gradient: ["#FF3B30", "#FF5E54"] as const,
  },
  {
    id: "2",
    title: "Flood",
    icon: "water",
    color: "#007AFF",
    gradient: ["#007AFF", "#5AA9FF"] as const,
  },
  {
    id: "3",
    title: "Fire",
    icon: "flame",
    color: "#FF9500",
    gradient: ["#FF9500", "#FFB143"] as const,
  },
  {
    id: "4",
    title: "Landslide",
    icon: "triangle",
    color: "#5856D6",
    gradient: ["#5856D6", "#7A78E0"] as const,
  },
];

const contacts = [
  {
    id: "1",
    name: "Police",
    number: "100",
    icon: "shield" as const,
    iconColor: "#2563EB",
    iconBg: "#DBEAFE",
  },
  {
    id: "2",
    name: "Ambulance",
    number: "102",
    icon: "medical" as const,
    iconColor: "#DC2626",
    iconBg: "#FEE2E2",
  },
  {
    id: "3",
    name: "Fire Department",
    number: "101",
    icon: "flame" as const,
    iconColor: "#EA580C",
    iconBg: "#FED7AA",
  },
  {
    id: "4",
    name: "Mountain Rescue",
    number: "103",
    icon: "location" as const,
    iconColor: "#059669",
    iconBg: "#D1FAE5",
  },
];

// =========================
// Main SosScreen Component
// =========================
function SosScreen() {
  // =========================
  // State Variables
  // =========================
  const route = useRoute<any>();
  const colorScheme = useColorScheme();

  // Get initial tab from route params, default to "emergency"
  const initialTab = route.params?.initialTab || "emergency";
  const [tab, setTab] = useState<"emergency" | "contacts">(initialTab);
  const [modal, setModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", number: "" });
  const [pressedDisaster, setPressedDisaster] = useState<string | null>(null);
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const scaleAnim = new Animated.Value(1);

  // =========================
  // Theme Colors (Edit here for color changes)
  // =========================
  const themeColors =
    colorScheme === "light"
      ? {
          background: "#F9FBFD", // Main background color
          cardBackground: "#FFFFFF", // Card backgrounds
          text: "#1E293B", // Main text color
          textSecondary: "#64748B", // Secondary text
          accent: "#2563EB", // Accent color (buttons, links)
          accentText: "#FFFFFF", // Accent text
          border: "#E2E8F0", // Border color
          shadow: "#00000010", // Shadow color
          alertHigh: "#DC2626", // High severity alert
          alertMedium: "#EA580C", // Medium severity alert
          alertLow: "#16A34A", // Low severity alert
          headerGradient: ["#2563EB", "#1D4ED8"] as const, // Header gradient
          sectionHeader: "#334155", // Section header text
          tabActive: "#2563EB", // Active tab color
          tabInactive: "#94A3B8", // Inactive tab color
        }
      : {
          background: "#0F172A",
          cardBackground: "#1E293B",
          text: "#F1F5F9",
          textSecondary: "#94A3B8",
          accent: "#3B82F6",
          accentText: "#FFFFFF",
          border: "#334155",
          shadow: "#00000030",
          alertHigh: "#F87171",
          alertMedium: "#FB923C",
          alertLow: "#4ADE80",
          headerGradient: ["#1D4ED8", "#1E40AF"] as const,
          sectionHeader: "#E2E8F0",
          tabActive: "#3B82F6",
          tabInactive: "#64748B",
        };

  // =========================
  // Handlers: Calls, SMS, SOS, Contacts
  // =========================
  // Function to handle phone calls
  const handlePhoneCall = async (phoneNumber: string, contactName: string) => {
    Alert.alert(
      "Make Emergency Call",
      `Are you sure you want to call ${contactName} at ${phoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          style: "default",
          onPress: async () => {
            try {
              const url = `tel:${phoneNumber}`;
              const supported = await Linking.canOpenURL(url);

              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert(
                  "Cannot Make Call",
                  `Your device cannot make phone calls directly. Please manually dial ${phoneNumber} to contact ${contactName}.`,
                  [
                    { text: "OK", style: "default" },
                    {
                      text: "Copy Number",
                      onPress: () => {
                        Alert.alert(
                          "Number Copied",
                          `${phoneNumber} has been copied to clipboard`
                        );
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              console.log("Call error:", error);
              Alert.alert(
                "Error",
                "Unable to make the call. Please use your phone's dialer to call " +
                  phoneNumber,
                [{ text: "OK", style: "default" }]
              );
            }
          },
        },
      ]
    );
  };

  // Function to handle SMS
  const handleSMS = async (phoneNumber: string, contactName: string) => {
    Alert.alert(
      "Send Emergency SMS",
      `Are you sure you want to send an SMS to ${contactName} at ${phoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SMS",
          style: "default",
          onPress: async () => {
            try {
              const url = `sms:${phoneNumber}`;
              const supported = await Linking.canOpenURL(url);

              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert(
                  "Cannot Send SMS",
                  `Your device cannot send SMS directly. Please use your phone's messaging app to contact ${contactName} at ${phoneNumber}.`,
                  [
                    { text: "OK", style: "default" },
                    {
                      text: "Copy Number",
                      onPress: () => {
                        Alert.alert(
                          "Number Copied",
                          `${phoneNumber} has been copied to clipboard`
                        );
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              console.log("SMS error:", error);
              Alert.alert(
                "Error",
                "Unable to send SMS. Please use your phone's messaging app to contact " +
                  phoneNumber,
                [{ text: "OK", style: "default" }]
              );
            }
          },
        },
      ]
    );
  };

  const handlePressIn = (id: string) => {
    setPressedDisaster(id);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressedDisaster(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Handle disaster selection
  const handleDisasterPress = (disaster: (typeof disasters)[0]) => {
    Alert.alert(
      "Trigger Emergency SOS",
      `Are you sure you want to trigger an emergency SOS for ${disaster.title}?\n\nThis will start a 10-second countdown and send your location to emergency services.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger SOS",
          style: "destructive",
          onPress: () => {
            setSelectedDisaster(disaster.title);
            setShowCountdown(true);
          },
        },
      ]
    );
  };

  // Handle countdown completion
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setSelectedDisaster(null);
    // SOS event is now created only by SOSCountdown and its service
    Alert.alert(
      "SOS Complete",
      "Emergency SOS has been sent successfully. Help is on the way!",
      [{ text: "OK", style: "default" }]
    );
  };

  // Handle countdown cancellation
  const handleCountdownCancel = () => {
    setShowCountdown(false);
    setSelectedDisaster(null);
  };

  const addContact = () => {
    if (newContact.name.trim() && newContact.number.trim()) {
      Alert.alert("Contact Added", "Contact has been added successfully!");
      setNewContact({ name: "", number: "" });
      setModal(false);
    } else {
      Alert.alert("Error", "Please fill in both name and number");
    }
  };

  // =========================
  // Render (JSX)
  // =========================
  // The main UI for the SOS screen is below.
  // Each section is clearly commented for easy editing.

  // If countdown is active, show countdown screen
  if (showCountdown && selectedDisaster) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={themeColors.headerGradient[0]}
        />

        {/* =========================
            Header Section (Edit title, subtitle, colors here)
          ========================= */}
        <LinearGradient
          colors={themeColors.headerGradient}
          style={styles.headerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Emergency SOS</Text>
              <Text style={styles.headerSubtitle}>
                {selectedDisaster} Emergency
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* =========================
            Countdown Component
          ========================= */}
        <View style={styles.countdownWrapper}>
          <SOSCountdown
            disasterType={selectedDisaster}
            onComplete={handleCountdownComplete}
            onCancel={handleCountdownCancel}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeColors.headerGradient[0]}
      />

      {/* =========================
          Header Section (Edit title, subtitle, colors here)
        ========================= */}
      <LinearGradient
        colors={themeColors.headerGradient}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Emergency SOS</Text>
            <Text style={styles.headerSubtitle}>
              Quick access to emergency services
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* =========================
          Tab Navigation (Emergency/Contacts)
        ========================= */}
      <View style={styles.tabWrapper}>
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: themeColors.cardBackground,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              tab === "emergency" && styles.activeTab,
              tab === "emergency" && {
                backgroundColor: themeColors.accent,
              },
            ]}
            onPress={() => setTab("emergency")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    tab === "emergency"
                      ? themeColors.accentText
                      : themeColors.tabInactive,
                },
              ]}
            >
              Emergency
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              tab === "contacts" && styles.activeTab,
              tab === "contacts" && {
                backgroundColor: themeColors.accent,
              },
            ]}
            onPress={() => setTab("contacts")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    tab === "contacts"
                      ? themeColors.accentText
                      : themeColors.tabInactive,
                },
              ]}
            >
              Contacts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            Emergency Section (Disaster types, instructions)
          ========================= */}
        {tab === "emergency" ? (
          <View style={styles.emergencyContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: themeColors.sectionHeader },
              ]}
            >
              Select Emergency Type
            </Text>
            <View style={styles.disastersGrid}>
              {disasters.map((disaster) => (
                <TouchableOpacity
                  key={disaster.id}
                  style={[
                    styles.disasterCard,
                    {
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.border,
                      transform: [
                        { scale: pressedDisaster === disaster.id ? 0.95 : 1 },
                      ],
                    },
                  ]}
                  onPressIn={() => handlePressIn(disaster.id)}
                  onPressOut={handlePressOut}
                  onPress={() => handleDisasterPress(disaster)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={disaster.gradient}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={disaster.icon as any}
                      size={28}
                      color="white"
                    />
                  </LinearGradient>
                  <Text
                    style={[styles.disasterTitle, { color: themeColors.text }]}
                  >
                    {disaster.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emergency Instructions */}
            <View
              style={[
                styles.instructionsCard,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={themeColors.accent}
              />
              <Text
                style={[
                  styles.instructionsText,
                  { color: themeColors.textSecondary },
                ]}
              >
                Tap any emergency type to trigger SOS with 10-second countdown
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.contactsContainer}>
            <View style={styles.contactsHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: themeColors.sectionHeader },
                ]}
              >
                Contacts
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={() => setModal(true)}
              >
                <Ionicons name="add" size={20} color={themeColors.accentText} />
              </TouchableOpacity>
            </View>

            <View style={styles.contactsList}>
              {contacts.map((contact) => (
                <View
                  key={contact.id}
                  style={[
                    styles.contactCard,
                    {
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <View style={styles.contactInfo}>
                    <View
                      style={[
                        styles.contactIcon,
                        { backgroundColor: contact.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={contact.icon}
                        size={20}
                        color={contact.iconColor}
                      />
                    </View>
                    <View style={styles.contactDetails}>
                      <Text
                        style={[
                          styles.contactName,
                          { color: themeColors.text },
                        ]}
                      >
                        {contact.name}
                      </Text>
                      <Text
                        style={[
                          styles.contactNumber,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {contact.number}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: themeColors.alertHigh },
                      ]}
                      onPress={() =>
                        handlePhoneCall(contact.number, contact.name)
                      }
                    >
                      <Ionicons name="call" size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: themeColors.accent },
                      ]}
                      onPress={() => handleSMS(contact.number, contact.name)}
                    >
                      <Ionicons name="chatbubble" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* SMS Instructions */}
            <View
              style={[
                styles.instructionsCard,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={themeColors.accent}
              />
              <Text
                style={[
                  styles.instructionsText,
                  { color: themeColors.textSecondary },
                ]}
              >
                Tap the phone icon to call, or the message icon to send an SMS
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* =========================
          Add Contact Modal
        ========================= */}
      {modal && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Add Emergency Contact
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              placeholder="Contact Name"
              placeholderTextColor={themeColors.textSecondary}
              value={newContact.name}
              onChangeText={(text) =>
                setNewContact({ ...newContact, name: text })
              }
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              placeholder="Phone Number"
              placeholderTextColor={themeColors.textSecondary}
              value={newContact.number}
              onChangeText={(text) =>
                setNewContact({ ...newContact, number: text })
              }
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: themeColors.border },
                ]}
                onPress={() => setModal(false)}
              >
                <Text
                  style={[styles.modalButtonText, { color: themeColors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={addContact}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: themeColors.accentText },
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =========================
// Protected Route Wrapper
// =========================
export default function ProtectedSosScreen() {
  return (
    <ProtectedRoute>
      <SosScreen />
    </ProtectedRoute>
  );
}

// =========================
// Styles (Edit colors, spacing, and layout here)
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 4,
  },
  tabWrapper: {
    paddingHorizontal: 24,
    marginTop: -10,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  emergencyContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  disastersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  disasterCard: {
    width: (width - 72) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  disasterTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  contactsContainer: {
    flex: 1,
  },
  contactsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  contactsList: {
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    padding: 24,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
