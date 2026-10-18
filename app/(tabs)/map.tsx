import ProtectedRoute from "@/components/ProtectedRoute";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import Firebase
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, where, orderBy, limit, QuerySnapshot, DocumentData } from 'firebase/firestore';

// =========================
// Map Components with Error Boundary and Web Support
// =========================
let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;
let mapError: string | null = null;

try {
  if (Platform.OS === 'web') {
    // Web fallback component
    MapView = ({ children, style, ...props }: any) => (
      <div style={{ 
        ...style, 
        backgroundColor: '#eee', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '300px',
        color: '#000',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p>Map view is optimized for mobile devices.</p>
        <p>Please use the mobile app for full map functionality.</p>
        {children}
      </div>
    );
    Marker = ({ children }: any) => <div>{children}</div>;
    UrlTile = () => null;
  } else {
    // Native implementation
    const MapModule = require("react-native-maps");
    if (!MapModule) throw new Error("react-native-maps not found");
    MapView = MapModule.default;
    Marker = MapModule.Marker;
    UrlTile = MapModule.UrlTile;
  }
} catch (error) {
  console.error("Map initialization error:", error);
  mapError = error instanceof Error ? error.message : 'Failed to load map';
  
  // Fallback component when map fails to load
  MapView = ({ style, children }: any) => (
    <View style={[style, { 
      backgroundColor: '#f8d7da', 
      padding: 20, 
      borderRadius: 8,
      margin: 10,
      alignItems: 'center',
      justifyContent: 'center'
    }]}>
      <Ionicons name="warning" size={32} color="#721c24" />
      <Text style={{ color: '#721c24', marginTop: 10, textAlign: 'center' }}>
        {mapError}
      </Text>
      <Text style={{ color: '#721c24', marginTop: 5, fontSize: 12, textAlign: 'center' }}>
        Please check your internet connection and try again.
      </Text>
      {children}
    </View>
  );
  Marker = () => null;
  UrlTile = () => null;
}

// =========================
// Type Definitions
// =========================
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface FloodWarning {
  id: string;
  basin_name: string;
  currentLevel: number;
  dangerLevel: number;
  district: string;
  district_name: string;
  lat: number;
  lng: number;
  location?: {
    coordinates: [number, number];
    type: string;
  };
}

// =========================
// Disaster Types and Static Data
// =========================
const DISASTER_TYPES = [
  {
    type: "Earthquake",
    color: "#FF3B30",
    icon: "alert-octagon",
    gradient: ["#FF3B30", "#FF5E54"] as const,
  },
  {
    type: "Flood",
    color: "#007AFF",
    icon: "water",
    gradient: ["#007AFF", "#5AA9FF"] as const,
  },
  {
    type: "Wildfire",
    color: "#FF2D55",
    icon: "fire-extinguisher",
    gradient: ["#FF2D55", "#FF5F7D"] as const,
  },
  {
    type: "Landslide",
    color: "#5856D6",
    icon: "alert-circle",
    gradient: ["#5856D6", "#7A78E0"] as const,
  },
];

const STATIC_DISASTERS = [
  {
    id: "1",
    type: "Earthquake",
    coordinates: { latitude: 27.7172, longitude: 85.324 },
    description: "Major earthquake near Kathmandu",
    severity: "High",
    date: "2023-05-12",
    source: "Nepal Seismological Center",
    peopleAffected: "120,000+",
    status: "Ongoing",
  },
  {
    id: "2",
    type: "Flood",
    coordinates: { latitude: 26.4525, longitude: 87.2718 },
    description: "Flooding in Koshi River basin",
    severity: "High",
    date: "2023-07-22",
    source: "Department of Hydrology",
    peopleAffected: "85,000+",
    status: "Ongoing",
  },
  {
    id: "3",
    type: "Landslide",
    coordinates: { latitude: 28.3949, longitude: 84.124 },
    description: "Landslide blocking major highway",
    severity: "Medium",
    date: "2023-08-15",
    source: "Department of Roads",
    peopleAffected: "5,000+",
    status: "Clearing in progress",
  },
];

// =========================
// Helper Functions
// =========================
// Helper: Get date string in YYYY-MM-DD
function getDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

// Helper: Nepal bounding box
const NEPAL_BOUNDS = {
  minlatitude: 26.347,
  maxlatitude: 30.447,
  minlongitude: 80.058,
  maxlongitude: 88.201,
};

// Fetch earthquakes from USGS and store in Firestore
async function fetchAndStoreEarthquakes() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDateString(
    start
  )}&endtime=${getDateString(end)}&minlatitude=${
    NEPAL_BOUNDS.minlatitude
  }&maxlatitude=${NEPAL_BOUNDS.maxlatitude}&minlongitude=${
    NEPAL_BOUNDS.minlongitude
  }&maxlongitude=${NEPAL_BOUNDS.maxlongitude}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        const eq = {
          id: feature.id,
          mag: feature.properties.mag,
          place: feature.properties.place,
          time: feature.properties.time,
          coordinates: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
          },
          depth: feature.geometry.coordinates[2],
          url: feature.properties.url,
        };
        // Store in Firestore (merge: true to avoid overwriting)
        await setDoc(doc(collection(db, "earthquakes"), eq.id), eq, {
          merge: true,
        });
      }
    }
  } catch (e) {
    console.error("Failed to fetch/store earthquakes:", e);
  }
}

// =========================
// Main MapScreen Component
// =========================
export default function MapScreen() {
  // =========================
  // State Variables
  // =========================
  const colorScheme = useColorScheme();
  const [error, setError] = useState<string | null>(mapError);
  const [region, setRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [selected, setSelected] = useState<any>(null);
  const [activeType, setActiveType] = useState("Flood");
  const [floodWarnings, setFloodWarnings] = useState<FloodWarning[]>([]);
  const [loading, setLoading] = useState(true);

  // Earthquake state
  const [earthquakes, setEarthquakes] = useState<any[]>([]);

  // =========================
  // Fetch Data from Firestore with Error Handling
  // =========================
  useEffect(() => {
    if (!db) {
      setError('Firebase is not properly configured');
      setLoading(false);
      return;
    }

    try {
      const warningsRef = collection(db, "warningStations");
      const unsubscribe = onSnapshot(
        warningsRef,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          try {
            const warnings: FloodWarning[] = [];
            querySnapshot.forEach((documentSnapshot) => {
              warnings.push({
                ...documentSnapshot.data(),
                id: documentSnapshot.id,
              } as FloodWarning);
            });
            setFloodWarnings(warnings);
            setError(null);
          } catch (e) {
            console.error('Error processing warnings:', e);
            setError('Failed to process map data');
          } finally {
            setLoading(false);
          }
        },
        (error: Error) => {
          console.error("Error fetching warnings:", error);
          setError('Failed to load map data. Please check your connection.');
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.error('Unexpected error in map initialization:', e);
      setError('Failed to initialize map');
      setLoading(false);
    }
  }, []);

  // Listen to earthquakes collection with error handling
  useEffect(() => {
    if (!db) return;

    try {
      const eqRef = collection(db, "earthquakes");
      const unsubscribe = onSnapshot(
        eqRef,
        (querySnapshot: QuerySnapshot) => {
          try {
            const eqs: any[] = [];
            querySnapshot.forEach((doc) => {
              try {
                eqs.push(doc.data());
              } catch (e) {
                console.error('Error processing earthquake data:', e);
              }
            });
            setEarthquakes(eqs);
          } catch (e) {
            console.error('Error processing earthquake snapshot:', e);
          }
        },
        (error: Error) => {
          console.error("Error fetching earthquakes:", error);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.error('Error setting up earthquake listener:', e);
    }
  }, []);

  // =========================
  // Disaster Data Preparation
  // =========================
  // Calculate severity based on water levels
  const calculateSeverity = (current: number, danger: number) => {
    const percentage = (current / danger) * 100;
    if (percentage >= 95) return "High";
    if (percentage >= 85) return "Medium";
    return "Low";
  };

  // Combine static disasters with flood warnings
  let disasters: any[] = [];
  if (activeType === "Flood") {
    disasters = floodWarnings.map((warning) => ({
      id: warning.id,
      type: "Flood",
      coordinates: {
        latitude: warning.location?.coordinates?.[1] || warning.lat,
        longitude: warning.location?.coordinates?.[0] || warning.lng,
      },
      description: `Flood warning at ${warning.basin_name} (${
        warning.district_name || warning.district
      })`,
      severity: calculateSeverity(warning.currentLevel, warning.dangerLevel),
      date: "Live Data",
      source: "Department of Hydrology",
      peopleAffected: "Monitoring",
      status: "Active",
      originalData: warning,
    }));
  } else if (activeType === "Earthquake") {
    disasters = earthquakes.map((eq) => ({
      id: eq.id,
      type: "Earthquake",
      coordinates: eq.coordinates,
      description: eq.place,
      severity: eq.mag >= 6 ? "High" : eq.mag >= 4.5 ? "Medium" : "Low",
      date: new Date(eq.time).toLocaleDateString(),
      source: "USGS",
      peopleAffected: "-",
      status: "Recorded",
      originalData: eq,
    }));
  }

  // =========================
  // Theme Colors (Edit here for color changes)
  // =========================
  const themeColors =
    colorScheme === "light"
      ? {
          background: "#F8FAFC", // Main background color
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
          mapCard: "#FFFFFF", // Map card background
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
          mapCard: "#1E293B",
        };

  // =========================
  // Helper: Get Severity Color
  // =========================
  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) return themeColors.textSecondary;

    switch (severity.toLowerCase()) {
      case "high":
        return themeColors.alertHigh;
      case "medium":
        return themeColors.alertMedium;
      case "low":
        return themeColors.alertLow;
      default:
        return themeColors.textSecondary;
    }
  };

  // =========================
  // Render (JSX)
  // =========================
  // The main UI for the map screen is below.
  // Each section is clearly commented for easy editing.
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Status Bar */}
      <RNStatusBar
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
            <Text style={styles.headerTitle}>Disaster Map</Text>
            <Text style={styles.headerSubtitle}>
              Real-time emergency information
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Show error if Firebase is not configured */}
      {(!db) && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#dc3545" />
          <Text style={styles.errorText}>
            Firebase is not configured correctly.
          </Text>
          <Text style={[styles.errorText, {fontSize: 14, marginTop: 10}]}>
            Please check your firebase/firebaseConfig.ts file and add your Firebase project credentials.
          </Text>
        </View>
      )}

      {/* =========================
          Loading Indicator for Flood Warnings
        ========================= */}
      {(loading && activeType === "Flood") && (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading flood warnings...
          </Text>
        </View>
      )}

      {/* =========================
          Map View (or Web Fallback)
        ========================= */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" && MapView ? (
          <View style={{ flex: 1 }}>
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              customMapStyle={colorScheme === "dark" ? darkMapStyle : []}
              mapPadding={{ top: 0, right: 0, bottom: 180, left: 0 }}
            >
              {/* OpenStreetMap tile overlay */}
              {UrlTile && (
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                />
              )}
              {/* Disaster Markers */}
              {disasters.map((d) => (
                <Marker
                  key={d.id}
                  coordinate={d.coordinates}
                  onPress={() => setSelected(d)}
                >
                  <LinearGradient
                    colors={
                      DISASTER_TYPES.find((t) => t.type === d.type)
                        ?.gradient || ["#999", "#999"]
                    }
                    style={styles.marker}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons
                      name={
                        d.type === "Flood"
                          ? "water-alert"
                          : (DISASTER_TYPES.find((t) => t.type === d.type)
                              ?.icon as any)
                      }
                      size={20}
                      color="#fff"
                    />
                  </LinearGradient>
                </Marker>
              ))}
            </MapView>
            <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
          </View>
        ) : (
          // Web fallback - show disaster list instead of map
          <ScrollView
            style={styles.webFallback}
            contentContainerStyle={styles.webFallbackContent}
          >
            <View
              style={[
                styles.webMapPlaceholder,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <MaterialCommunityIcons
                name="map-outline"
                size={64}
                color={themeColors.textSecondary}
              />
              <Text
                style={[
                  styles.webMapText,
                  { color: themeColors.textSecondary },
                ]}
              >
                Interactive map available on mobile devices
              </Text>
            </View>

            {/* Disaster List for Web */}
            {disasters.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.disasterCard,
                  { backgroundColor: themeColors.cardBackground },
                ]}
                onPress={() => setSelected(d)}
              >
                <LinearGradient
                  colors={
                    DISASTER_TYPES.find((t) => t.type === d.type)?.gradient || [
                      "#999",
                      "#999",
                    ]
                  }
                  style={styles.disasterIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons
                    name={
                      d.type === "Flood"
                        ? "water-alert"
                        : (DISASTER_TYPES.find((t) => t.type === d.type)
                            ?.icon as any)
                    }
                    size={24}
                    color="#fff"
                  />
                </LinearGradient>

                <View style={styles.disasterInfo}>
                  <Text
                    style={[styles.disasterTitle, { color: themeColors.text }]}
                  >
                    {d.type}
                  </Text>
                  <Text
                    style={[
                      styles.disasterDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {d.description}
                  </Text>
                  <View style={styles.disasterMeta}>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: getSeverityColor(d.severity) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          { color: getSeverityColor(d.severity) },
                        ]}
                      >
                        {d.severity}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.disasterDate,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {d.date}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* =========================
          Filter Bar (Edit disaster types, colors here)
        ========================= */}
      <View
        style={[
          styles.filterContainer,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <Text
          style={[styles.filterTitle, { color: themeColors.sectionHeader }]}
        >
          Disasters
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {DISASTER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.type}
              onPress={() => setActiveType(t.type)}
            >
              <LinearGradient
                colors={t.gradient}
                style={[
                  styles.filterChip,
                  activeType === t.type && styles.activeFilterChip,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.filterText}>{t.type}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* =========================
          Info Modal (Edit modal content, colors here)
        ========================= */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />

          <View
            style={[
              styles.modalCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            {/* Modal Header */}
            <LinearGradient
              colors={
                DISASTER_TYPES.find((t) => t.type === selected?.type)
                  ?.gradient || ["#999", "#999"]
              }
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeaderContent}>
                <MaterialCommunityIcons
                  name={
                    selected?.type === "Flood"
                      ? "water-alert"
                      : (DISASTER_TYPES.find((t) => t.type === selected?.type)
                          ?.icon as any)
                  }
                  size={28}
                  color="#fff"
                />
                <Text style={styles.modalTitle}>{selected?.type}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalDesc, { color: themeColors.text }]}>
                {selected?.description}
              </Text>

              {selected?.type === "Flood" ? (
                <>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Basin
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.originalData?.basin_name || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Current Level
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.originalData?.currentLevel?.toFixed(2) ||
                          "N/A"}{" "}
                        m
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Danger Level
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.originalData?.dangerLevel?.toFixed(2) ||
                          "N/A"}{" "}
                        m
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        District
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.originalData?.district_name ||
                          selected?.originalData?.district ||
                          "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItemFull}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      Station ID
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: themeColors.text }]}
                    >
                      {selected?.originalData?.id || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.infoItemFull}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      Water Level Status
                    </Text>
                    <View style={styles.waterLevelContainer}>
                      <View style={styles.waterLevelBar}>
                        <View
                          style={[
                            styles.currentLevelBar,
                            {
                              width: `${Math.min(
                                (selected?.originalData?.currentLevel /
                                  selected?.originalData?.dangerLevel) *
                                  100,
                                100
                              )}%`,
                              backgroundColor: getSeverityColor(
                                selected?.severity
                              ),
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.waterLevelLabels}>
                        <Text
                          style={[
                            styles.waterLevelLabel,
                            { color: themeColors.text },
                          ]}
                        >
                          Current:{" "}
                          {selected?.originalData?.currentLevel?.toFixed(2)}m
                        </Text>
                        <Text
                          style={[
                            styles.waterLevelLabel,
                            { color: themeColors.text },
                          ]}
                        >
                          Danger:{" "}
                          {selected?.originalData?.dangerLevel?.toFixed(2)}m
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Severity
                      </Text>
                      <View
                        style={[
                          styles.severityBadge,
                          {
                            backgroundColor:
                              getSeverityColor(selected?.severity) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.infoValue,
                            { color: getSeverityColor(selected?.severity) },
                          ]}
                        >
                          {selected?.severity}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Date Reported
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.date}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        People Affected
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.peopleAffected}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Current Status
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: themeColors.text }]}
                      >
                        {selected?.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItemFull}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      Source
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: themeColors.text }]}
                    >
                      {selected?.source}
                    </Text>
                  </View>
                </>
              )}

              {selected?.type !== "Flood" && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { borderColor: themeColors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: themeColors.accent },
                    ]}
                  >
                    View Safety Resources
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={themeColors.accent}
                  />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// =========================
// Protected Route Wrapper
// =========================
export function ProtectedMapScreen() {
  return (
    <ProtectedRoute>
      <MapScreen />
    </ProtectedRoute>
  );
}

// =========================
// Map Style (for dark mode)
// =========================
const darkMapStyle: object[] = [];

// =========================
// Styles (Edit colors, spacing, and layout here)
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 20,
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
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
  mapContainer: {
    flex: 1,
    marginTop: -20,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
  marker: {
    padding: 12,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 120,
  },
  activeFilterChip: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 15,
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  modalBody: {
    padding: 24,
  },
  modalDesc: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  infoItem: {
    width: "48%",
    marginBottom: 20,
  },
  infoItemFull: {
    width: "100%",
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  // Web fallback styles
  webFallback: {
    flex: 1,
  },
  webFallbackContent: {
    padding: 20,
  },
  webMapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  disasterCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disasterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  disasterInfo: {
    flex: 1,
  },
  disasterTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  disasterDesc: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  disasterMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  disasterDate: {
    fontSize: 12,
  },
  // New styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  waterLevelContainer: {
    marginTop: 8,
  },
  waterLevelBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  currentLevelBar: {
    height: "100%",
  },
  waterLevelLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  waterLevelLabel: {
    fontSize: 12,
  },
  attribution: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    zIndex: 10,
  },
});

