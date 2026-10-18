// =========================
// Imports
// =========================
import { useAuth } from "@/components/AuthProvider";
import { useNotifications } from "@/components/NotificationProvider";
import { 
  onSnapshot, 
  query, 
  where, 
  collection, 
  addDoc, 
  Timestamp, 
  GeoPoint, 
  DocumentData, 
  QuerySnapshot,
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import ProtectedRoute from "@/components/ProtectedRoute";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getAuth } from 'firebase/auth';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { toGradientColors } from "@/utils/themeUtils";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView as RNSafeAreaView,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { lightTheme, darkTheme, actionGradients } from "@/constants/theme";

// =========================
// Constants and Configurations
// =========================
const { width } = Dimensions.get("window");
const WEATHER_API_KEY = "a3cf90bbeab7a32511d2371fd3578fe1";
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const ACTIONS = [
  {
    key: "sos",
    label: "SOS",
    icon: "alert-octagon",
    color: "#FF4B4B",
    gradient: actionGradients.sos,
    onPress: () => {},
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: "users",
    color: "#3B82F6",
    gradient: actionGradients.contacts,
    onPress: () => {},
  },
  {
    key: "alarm",
    label: "Alarm",
    icon: "bell",
    color: "#FFD166",
    gradient: actionGradients.alarm,
    onPress: () => {},
  },
  {
    key: "firstaid",
    label: "First Aid",
    icon: "plus-square",
    color: "#06D6A0",
    gradient: actionGradients.firstaid,
    onPress: () => {},
  },
];

// Import collections from firebaseConfig
import { 
  sheltersCollection,
  ratingsCollection,
  safetyTipsCollection,
  alertsCollection
} from '@/firebase/firebaseConfig';

type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
  isEqual: (other: any) => boolean;
  valueOf: () => string;
};

type FirebaseGeoPoint = {
  latitude: number;
  longitude: number;
  isEqual: (other: any) => boolean;
  toJSON: () => { latitude: number; longitude: number };
};

// Type definitions
interface ShelterRating {
  userId: string;
  shelterId: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp | FirebaseTimestamp;
}

interface Shelter {
  id: string;
  name: string;
  location: GeoPoint | FirebaseGeoPoint;
  address: string;
  capacity: number;
  currentOccupancy: number;
  rating: number;
  ratingCount: number;
  status?: string;
  icon?: string;
  color?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  region?: string;
  severity: 'low' | 'medium' | 'high';
  time?: string;
  icon?: string;
  timestamp: Timestamp | FirebaseTimestamp;
  location: GeoPoint | FirebaseGeoPoint;
}

// Custom Hook: Fetch Safety Tips
function useSafetyTips() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'safetyTips'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const tipsArr: any[] = [];
        querySnapshot.forEach((doc) => {
          tipsArr.push({ id: doc.id, ...doc.data() });
        });
        setTips(tipsArr);
        setLoading(false);
      },
      (error) => {
        console.error("Error getting safety tips: ", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  return { tips, loading, error };
}

// Navigation param list
type RootStackParamList = {
  pages: {
    screen: string;
  };
  sos: undefined;
  // Add other routes as needed
};

// =========================
// HomeScreen Component
// =========================
function HomeScreen() {
  // Navigation and theme
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [pressedAction, setPressedAction] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scaleAnim = new Animated.Value(1);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cityDistrict, setCityDistrict] = useState("");
  const [notificationModal, setNotificationModal] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ratingSuccess, setRatingSuccess] = useState<Record<string, boolean>>({});
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [viewAllModal, setViewAllModal] = useState({
    visible: false,
    type: '',
    data: [] as any[],
    title: ''
  });
  const [addShelterModal, setAddShelterModal] = useState(false);
  const [addingShelter, setAddingShelter] = useState(false);
  const [newShelter, setNewShelter] = useState({
    name: "",
    capacity: "",
    status: "Available",
    icon: "home",
    color: "#10B981",
    latitude: "",
    longitude: "",
  });
  
  // Weather state
  const [weatherData, setWeatherData] = useState({
    temperature: 22,
    condition: "Clear",
    icon: "sunny",
    loading: false,
    error: false,
  });

  // Location state
  const [locationName, setLocationName] = useState("");

  // Get theme colors based on color scheme
  const themeColors = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Time and greeting functions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const getGreeting = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  // Weather functions
  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode >= 200 && weatherCode < 300) return "thunderstorm-outline";
    if (weatherCode >= 300 && weatherCode < 400) return "rainy-outline";
    if (weatherCode >= 500 && weatherCode < 600) return "rainy-outline";
    if (weatherCode >= 600 && weatherCode < 700) return "snow-outline";
    if (weatherCode >= 700 && weatherCode < 800) return "cloudy-outline";
    if (weatherCode === 800) return "sunny-outline";
    if (weatherCode >= 801 && weatherCode < 900) return "partly-sunny-outline";
    return "sunny-outline";
  };

  const getWeatherCondition = (weatherCode: number) => {
    if (weatherCode >= 200 && weatherCode < 300) return "Thunderstorm";
    if (weatherCode >= 300 && weatherCode < 400) return "Drizzle";
    if (weatherCode >= 500 && weatherCode < 600) return "Rain";
    if (weatherCode >= 600 && weatherCode < 700) return "Snow";
    if (weatherCode >= 700 && weatherCode < 800) return "Mist";
    if (weatherCode === 800) return "Clear";
    if (weatherCode >= 801 && weatherCode < 900) return "Cloudy";
    return "Clear";
  };

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      setWeatherData(prev => ({ ...prev, loading: true, error: false }));
      const response = await fetch(
        `${WEATHER_BASE_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!response.ok) throw new Error("Weather API request failed");
      
      const data = await response.json();
      setWeatherData({
        temperature: Math.round(data.main.temp),
        condition: getWeatherCondition(data.weather[0].id),
        icon: getWeatherIcon(data.weather[0].id),
        loading: false,
        error: false,
      });
    } catch (error) {
      console.error("Weather fetch error:", error);
      setWeatherData(prev => ({ ...prev, loading: false, error: true }));
    }
  };

  // Location function
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        if (address.city) parts.push(address.city);
        if (address.district) parts.push(address.district);
        setLocationName(parts.join(", ") || "Your Location");
        setCityDistrict(parts.join(", ") || "Your Location");
      } else {
        setLocationName("Your Location");
        setCityDistrict("Your Location");
      }
      await fetchWeatherData(latitude, longitude);
    } catch (error) {
      console.error("Location error:", error);
      setLocationName("Location unavailable");
      setCityDistrict("Location unavailable");
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Alerts listener
  useEffect(() => {
    const q = query(collection(db, 'alerts'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
          const d = doc.data();
          let timeString = d.time || "";
          if (!timeString && d.date?.seconds) {
            timeString = new Date(d.date.seconds * 1000).toLocaleString();
          } else if (!timeString && d.createdAt?.seconds) {
            timeString = new Date(d.createdAt.seconds * 1000).toLocaleString();
          }
          let icon = d.icon;
          if (!icon && d.type) {
            if (d.type === "Earthquake") icon = "alert-octagon";
            else if (d.type === "Flood") icon = "water";
            else if (d.type === "Landslide") icon = "terrain";
            else icon = "alert-octagon";
          }
          return {
            id: doc.id,
            title: d.title || "Alert",
            message: d.message || d.description || "",
            region: d.region || d.location || "",
            severity: d.severity || "low",
            time: timeString,
            icon: icon || "alert-octagon",
          } as Alert;
        });
        setAlerts(data);
        setUnreadCount(data.length);
      },
      (error) => {
        console.error("Error getting alerts: ", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Shelters listener
  useEffect(() => {
    const q = query(collection(db, 'Nearby_Shelters'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const sheltersData: Shelter[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const location = data.location as GeoPoint;
          sheltersData.push({
            id: doc.id,
            ...data,
            location,
            latitude: location.latitude,
            longitude: data.location.longitude
          } as Shelter);
        });
        setShelters(sheltersData);
      });
    return unsubscribe;
  }, []);

  // Notification handling
  useEffect(() => {
    if (notificationModal) setUnreadCount(0);
  }, [notificationModal]);

  // UI handlers
  const handleViewAll = (type: 'alerts' | 'shelters' | 'safetyTips') => {
    let data: Alert[] | Shelter[] | any[] = [];
    let title = '';

    switch (type) {
      case 'alerts':
        data = alerts;
        title = 'All Alerts';
        break;
      case 'shelters':
        data = shelters;
        title = 'All Shelters';
        break;
      case 'safetyTips':
        data = SAFETY_TIPS;
        title = 'All Safety Tips';
        break;
    }

    setViewAllModal({ visible: true, type, data, title });
  };

  const closeViewAllModal = () => {
    setViewAllModal(prev => ({ ...prev, visible: false }));
  };

  // Rating handler
  const handleRate = async (shelterId: string, rating: number) => {
    const { user } = useAuth();
    if (!user) return;

    try {
      setRatingSuccess(prev => ({ ...prev, [shelterId]: false }));
      await addDoc(collection(db, 'ratings'), {
        userId: user.uid,
        shelterId,
        rating,
        createdAt: serverTimestamp()
      });
      setUserRatings(prev => ({ ...prev, [shelterId]: rating }));
      setRatingSuccess(prev => ({ ...prev, [shelterId]: true }));
      setTimeout(() => {
        setRatingSuccess(prev => ({ ...prev, [shelterId]: false }));
      }, 2000);
    } catch (error) {
      console.error("Rating failed:", error);
    }
  };

  // Shelter handler
  const handleAddShelter = async () => {
    if (!newShelter.name || !newShelter.capacity || !newShelter.latitude || !newShelter.longitude) {
      alert("Please fill in all required fields.");
      return;
    }

    setAddingShelter(true);
    try {
      await addDoc(collection(db, 'Nearby_Shelters'), {
        name: newShelter.name,
        capacity: parseInt(newShelter.capacity, 10),
        status: newShelter.status,
        icon: newShelter.icon,
        color: newShelter.color,
        location: new GeoPoint(
          parseFloat(newShelter.latitude),
          parseFloat(newShelter.longitude)
        ),
        rating: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      });
      setAddShelterModal(false);
      setNewShelter({
        name: "",
        capacity: "",
        status: "Available",
        icon: "home",
        color: "#10B981",
        latitude: "",
        longitude: "",
      });
    } catch (e) {
      console.error("Error adding shelter:", e);
      alert("Failed to add shelter. Please try again.");
    } finally {
      setAddingShelter(false);
    }
  };

  // Navigation handlers
  const handleQuizNavigation = () => {
    navigation.navigate("pages", { screen: "QuizScreen" });
  };

  const handleSafetyTipNavigation = (tipId: string) => {
    const screenName = tipId.replace(/-/g, '');
    navigation.navigate("pages", { screen: screenName });
  };

  const handleQuickActionPress = (key: string) => {
    switch (key) {
      case "sos":
        navigation.navigate("sos");
        break;
      case "contacts":
        navigation.navigate("pages", { screen: "Contact" });
        break;
      case "alarm":
        navigation.navigate("pages", { screen: "Alarm" });
        break;
      case "firstaid":
        navigation.navigate("pages", { screen: "FirstAidSafety" });
        break;
      default:
        break;
    }
  };

  const handlePressIn = (key: string) => {
    setPressedAction(key);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressedAction(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  // Safety tips data
  const { tips: SAFETY_TIPS } = useSafetyTips();
  const { registerForPushNotifications } = useNotifications();
  const { user } = useAuth();

  // Register for push notifications
  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user, registerForPushNotifications]);

  // =========================
  // Render (JSX)
  // =========================
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <RNStatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />

      <RNSafeAreaView style={{ backgroundColor: "transparent" }}>
        <LinearGradient
          colors={themeColors.headerGradient}
          style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingTextBold}>{getGreeting(currentTime)}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#FFD166" style={{ marginRight: 4 }} />
                <Text style={styles.locationDisplay}>{locationName || "Location unavailable"}</Text>
              </View>
              <Text style={styles.titleTextShadow}>Stay Safe</Text>
              <View style={styles.weatherWidget}>
                {weatherData.loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : weatherData.error ? (
                  <>
                    <Ionicons name="warning" size={16} color="#FFFFFF" />
                    <Text style={styles.weatherText}>Weather unavailable</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name={weatherData.icon as any} size={20} color="#FFFFFF" />
                    <Text style={styles.weatherText}>
                      {weatherData.temperature}°C • {weatherData.condition}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.timeTextLight}>
                {formatTime(currentTime)} • {formatDate(currentTime)}
              </Text>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => setNotificationModal(true)}
              >
                <Feather name="bell" size={22} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        <LinearGradient
          colors={["#FFD166", "#3B82F6"]}
          style={styles.headerAccentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </RNSafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alerts Section */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.alertHigh + "20" }]}>
                <Ionicons name="warning" size={20} color={themeColors.alertHigh} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.sectionHeader }]}>
                Latest Alerts
              </Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => handleViewAll("alerts")}>
              <Text style={[styles.viewAllText, { color: themeColors.accent }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={themeColors.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={alerts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item: alert }) => (
              <View
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                    shadowColor: themeColors.shadow,
                    borderLeftWidth: 4,
                    borderLeftColor: getSeverityColor(alert.severity),
                  },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Feather name={alert.icon as any} size={20} color={getSeverityColor(alert.severity)} />
                  <View style={styles.alertTitleContainer}>
                    <Text style={[styles.alertTitle, { color: themeColors.text }]}>{alert.title}</Text>
                    <View style={styles.alertMetaRow}>
                      <Text style={[styles.alertMeta, { color: themeColors.textSecondary }]}>
                        {alert.region}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text
                  style={[styles.alertMessage, { color: themeColors.textSecondary }]}
                  numberOfLines={3}
                >
                  {alert.message}
                </Text>
                <Text style={styles.notificationLocation}>
                  {locationLoading ? "Locating..." : locationName}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.alertsList}
          />
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.accent + "20" }]}>
                <Ionicons name="flash" size={20} color={themeColors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.sectionHeader }]}>
                Quick Actions
              </Text>
            </View>
          </View>
          <View style={styles.quickActionsGrid}>
            {ACTIONS.map((action) => (
              <Animated.View
                key={action.key}
                style={{ transform: [{ scale: pressedAction === action.key ? 0.95 : 1 }] }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={() => handlePressIn(action.key)}
                  onPressOut={handlePressOut}
                  onPress={() => handleQuickActionPress(action.key)}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.actionIconContainer}>
                      <Feather name={action.icon as any} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Safety Tips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: "#F59E0B20" }]}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.sectionHeader }]}>
                Safety Tips
              </Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => handleViewAll("safetyTips")}>
              <Text style={[styles.viewAllText, { color: themeColors.accent }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={themeColors.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={SAFETY_TIPS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item: tip }) => (
              <TouchableOpacity
                style={[
                  styles.tipCard,
                  {
                    backgroundColor: themeColors.tipCard,
                    borderColor: themeColors.border,
                    shadowColor: themeColors.shadow,
                  },
                ]}
                onPress={() => handleSafetyTipNavigation(tip.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.tipIconContainer,
                    { backgroundColor: (tip.color || "#F59E0B") + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(tip.icon || "alert-octagon") as any}
                    size={24}
                    color={tip.color || "#F59E0B"}
                  />
                </View>
                <Text style={[styles.tipTitle, { color: themeColors.text }]} numberOfLines={2}>
                  {tip.title}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tipsList}
          />
        </View>

        {/* Quiz Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.quizGradient[0] + "20" }]}>
                <Ionicons name="help-circle" size={20} color={themeColors.quizGradient[0]} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.sectionHeader }]}>Quiz</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleQuizNavigation} activeOpacity={0.9}>
            <LinearGradient
              colors={themeColors.quizGradient}
              style={[styles.quizCard, { shadowColor: themeColors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.quizContent}>
                <View style={styles.quizTextContainer}>
                  <Text style={styles.quizTitle}>Test Your Knowledge</Text>
                  <Text style={styles.quizSubtitle}>Prepare with our emergency readiness quiz</Text>
                </View>
                <View style={styles.quizIcon}>
                  <Ionicons name="help-circle" size={40} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.quizFooter}>
                <Text style={styles.quizActionText}>Start Quiz</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Nearby Shelters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: "#10B98120" }]}>
                <Ionicons name="home" size={20} color="#10B981" />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.sectionHeader }]}>
                Nearby Shelters
              </Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => handleViewAll("shelters")}>
              <Text style={[styles.viewAllText, { color: themeColors.accent }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={themeColors.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={shelters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item: shelter }) => (
              <View
                style={[
                  styles.shelterCard,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                    shadowColor: themeColors.shadow,
                  },
                ]}
              >
                <View style={styles.shelterHeader}>
                  <View style={[styles.shelterIcon, { backgroundColor: shelter.color + "20" }]}>
                    <Ionicons name={shelter.icon as any} size={20} color={shelter.color} />
                  </View>
                  <View
                    style={[
                      styles.shelterStatus,
                      {
                        backgroundColor: shelter.status === "Available" ? "#10B98120" : "#EF444420",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.shelterStatusText,
                        { color: shelter.status === "Available" ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {shelter.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.shelterName, { color: themeColors.text }]} numberOfLines={2}>
                  {shelter.name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>
                    {Number(averageRatings[shelter.id] ?? shelter.rating ?? 0).toFixed(1)}
                  </Text>
                </View>
                {user && (
                  <>
                    <View style={{ flexDirection: "row", marginVertical: 8 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleRate(shelter.id, star)}
                        >
                          <Ionicons
                            name={star <= (userRatings[shelter.id] ?? 0) ? "star" : "star-outline"}
                            size={24}
                            color="#F59E0B"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    {ratingSuccess[shelter.id] && (
                      <Text style={{ color: "#10B981", fontWeight: "600", marginBottom: 4 }}>
                        Rating successful!
                      </Text>
                    )}
                  </>
                )}
                <View style={styles.shelterDetails}>
                  <View style={styles.shelterDetail}>
                    <Ionicons name="location" size={14} color={themeColors.textSecondary} />
                    <Text style={[styles.shelterDetailText, { color: themeColors.textSecondary }]}>
                      {shelter.distance}
                    </Text>
                  </View>
                  <View style={styles.shelterDetail}>
                    <Ionicons name="people" size={14} color={themeColors.textSecondary} />
                    <Text style={[styles.shelterDetailText, { color: themeColors.textSecondary }]}>
                      {shelter.capacity}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.shelterActionButton,
                    { backgroundColor: themeColors.accent + "10" },
                  ]}
                  onPress={() => {
                    if (shelter.latitude && shelter.longitude) {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`;
                      Linking.openURL(url);
                    } else {
                      alert("Location not available for this shelter.");
                    }
                  }}
                >
                  <Text style={[styles.shelterActionText, { color: themeColors.accent }]}>
                    Get Directions
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.shelterList}
          />
        </View>
      </ScrollView>

      {/* View All Modal */}
      <Modal
        visible={viewAllModal.visible}
        animationType="slide"
        transparent
        onRequestClose={closeViewAllModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeViewAllModal}>
          <View
            style={[
              styles.viewAllModalContainer,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <View style={styles.viewAllModalHeader}>
              <Text style={[styles.viewAllModalTitle, { color: themeColors.text }]}>
                {viewAllModal.title}
              </Text>
              <TouchableOpacity onPress={closeViewAllModal} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.viewAllModalContent} showsVerticalScrollIndicator={false}>
              {viewAllModal.type === "alerts" && (
                <View>
                  {viewAllModal.data.map((alert) => (
                    <View
                      key={alert.id}
                      style={[
                        styles.viewAllAlertCard,
                        {
                          backgroundColor: themeColors.cardBackground,
                          borderColor: themeColors.border,
                          borderLeftWidth: 4,
                          borderLeftColor: getSeverityColor(alert.severity),
                        },
                      ]}
                    >
                      <View style={styles.viewAllAlertHeader}>
                        <Feather
                          name={alert.icon as any}
                          size={20}
                          color={getSeverityColor(alert.severity)}
                        />
                        <View style={styles.viewAllAlertTitleContainer}>
                          <Text
                            style={[styles.viewAllAlertTitle, { color: themeColors.text }]}
                          >
                            {alert.title}
                          </Text>
                          <View style={styles.viewAllAlertMetaRow}>
                            <Text
                              style={[
                                styles.viewAllAlertMeta,
                                { color: themeColors.textSecondary },
                              ]}
                            >
                              {alert.region}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.viewAllAlertMessage,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {alert.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {viewAllModal.type === "safetyTips" && (
                <View style={styles.viewAllTipsGrid}>
                  {viewAllModal.data.map((tip) => (
                    <TouchableOpacity
                      key={tip.id}
                      style={[
                        styles.viewAllTipCard,
                        {
                          backgroundColor: themeColors.tipCard,
                          borderColor: themeColors.border,
                        },
                      ]}
                      onPress={() => {
                        closeViewAllModal();
                        handleSafetyTipNavigation(tip.id);
                      }}
                    >
                      <View
                        style={[
                          styles.viewAllTipIconContainer,
                          { backgroundColor: tip.color + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={tip.icon as any}
                          size={24}
                          color={tip.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.viewAllTipTitle,
                          { color: themeColors.text },
                        ]}
                      >
                        {tip.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {viewAllModal.type === "shelters" && (
                <View>
                  {viewAllModal.data.map((shelter) => (
                    <View
                      key={shelter.id}
                      style={[
                        styles.viewAllShelterCard,
                        {
                          backgroundColor: themeColors.cardBackground,
                          borderColor: themeColors.border,
                        },
                      ]}
                    >
                      <View style={styles.viewAllShelterHeader}>
                        <View
                          style={[
                            styles.viewAllShelterIcon,
                            { backgroundColor: shelter.color + "20" },
                          ]}
                        >
                          <Ionicons
                            name={shelter.icon as any}
                            size={20}
                            color={shelter.color}
                          />
                        </View>
                        <View
                          style={[
                            styles.viewAllShelterStatus,
                            {
                              backgroundColor:
                                shelter.status === "Available"
                                  ? "#10B98120"
                                  : "#EF444420",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.viewAllShelterStatusText,
                              {
                                color:
                                  shelter.status === "Available"
                                    ? "#10B981"
                                    : "#EF4444",
                              },
                            ]}
                          >
                            {shelter.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.viewAllShelterName,
                          { color: themeColors.text },
                        ]}
                      >
                        {shelter.name}
                      </Text>
                      <View style={styles.viewAllRatingContainer}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text
                          style={[
                            styles.viewAllRatingText,
                            { color: themeColors.textSecondary },
                          ]}
                        >
                          {Number(
                            averageRatings[shelter.id] ?? shelter.rating ?? 0
                          ).toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.viewAllShelterDetails}>
                        <View style={styles.viewAllShelterDetail}>
                          <Ionicons
                            name="location"
                            size={14}
                            color={themeColors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.viewAllShelterDetailText,
                              { color: themeColors.textSecondary },
                            ]}
                          >
                            {shelter.distance}
                          </Text>
                        </View>
                        <View style={styles.viewAllShelterDetail}>
                          <Ionicons
                            name="people"
                            size={14}
                            color={themeColors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.viewAllShelterDetailText,
                              { color: themeColors.textSecondary },
                            ]}
                          >
                            {shelter.capacity}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.viewAllShelterActionButton,
                          { backgroundColor: themeColors.accent + "10" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.viewAllShelterActionText,
                            { color: themeColors.accent },
                          ]}
                        >
                          Get Directions
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Add Shelter Modal */}
      <Modal
        visible={addShelterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAddShelterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Add New Shelter
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholder="Shelter Name"
              placeholderTextColor={themeColors.textSecondary}
              value={newShelter.name}
              onChangeText={(text) => setNewShelter(s => ({ ...s, name: text }))}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholder="Capacity (e.g. 200 people)"
              placeholderTextColor={themeColors.textSecondary}
              value={newShelter.capacity}
              onChangeText={(text) => setNewShelter(s => ({ ...s, capacity: text }))}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholder="Status (Available/Full)"
              placeholderTextColor={themeColors.textSecondary}
              value={newShelter.status}
              onChangeText={(text) => setNewShelter(s => ({ ...s, status: text }))}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholder="Latitude"
              placeholderTextColor={themeColors.textSecondary}
              value={newShelter.latitude}
              onChangeText={(text) => setNewShelter(s => ({ ...s, latitude: text }))}
              keyboardType="numeric"
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholder="Longitude"
              placeholderTextColor={themeColors.textSecondary}
              value={newShelter.longitude}
              onChangeText={(text) => setNewShelter(s => ({ ...s, longitude: text }))}
              keyboardType="numeric"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.error }]}
                onPress={() => setAddShelterModal(false)}
                disabled={addingShelter}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.accent }]}
                onPress={handleAddShelter}
                disabled={addingShelter}
              >
                <Text style={styles.buttonText}>
                  {addingShelter ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setNotificationModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setNotificationModal(false)}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Notifications
            </Text>
            <ScrollView style={{ maxHeight: 400, marginTop: 16 }}>
              {alerts.length === 0 ? (
                <Text style={{ color: themeColors.textSecondary }}>No notifications.</Text>
              ) : (
                alerts.map((alert) => (
                  <View key={alert.id} style={{ marginBottom: 16 }}>
                    <Text style={{ color: themeColors.text, fontWeight: "bold" }}>
                      {alert.title}
                    </Text>
                    <Text style={{ color: themeColors.textSecondary }}>{alert.message}</Text>
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>
                      {alert.time}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={{ marginTop: 16, alignSelf: "flex-end" }}
              onPress={() => setNotificationModal(false)}
            >
              <Text style={{ color: themeColors.accent, fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// =========================
// Protected Route Wrapper
// =========================
function ProtectedHomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}

export default ProtectedHomeScreen;

// =========================
// Styles
// =========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  greetingTextBold: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  locationDisplay: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD166",
    marginBottom: 2,
  },
  titleTextShadow: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginBottom: 8,
    textShadowColor: "#00000055",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  weatherWidget: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  weatherText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeTextLight: {
    fontSize: 13,
    fontWeight: "400",
    color: "#F1F5F9",
    marginBottom: 8,
    opacity: 0.85,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
  },
  headerAccentBar: {
    height: 4,
    width: "100%",
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 20,
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  alertsList: {
    gap: 16,
  },
  alertCard: {
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 16,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 6,
  },
  alertMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  alertMeta: {
    fontWeight: "500",
    fontSize: 14,
    opacity: 0.7,
  },
  alertMessage: {
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.8,
  },
  notificationLocation: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  actionCard: {
    width: (width - 72) / 2,
    borderRadius: 16,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tipsList: {
    gap: 16,
  },
  tipCard: {
    borderRadius: 16,
    padding: 20,
    width: 140,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  quizCard: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  quizContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  quizTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 22,
  },
  quizIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quizFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 16,
  },
  quizActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  shelterList: {
    gap: 16,
  },
  shelterCard: {
    borderRadius: 16,
    padding: 24,
    width: width * 0.7,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  shelterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  shelterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  shelterStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shelterStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  shelterName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  shelterDetails: {
    gap: 12,
    marginBottom: 24,
  },
  shelterDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shelterDetailText: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
  },
  shelterActionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  shelterActionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  viewAllModalContainer: {
    margin: 20,
    borderRadius: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  viewAllModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  viewAllModalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeModalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllModalContent: {
    padding: 24,
  },
  viewAllAlertCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewAllAlertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  viewAllAlertTitleContainer: {
    flex: 1,
  },
  viewAllAlertTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  viewAllAlertMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  viewAllAlertMeta: {
    fontWeight: "500",
    fontSize: 13,
    opacity: 0.7,
  },
  viewAllAlertMessage: {
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  viewAllTipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  viewAllTipCard: {
    borderRadius: 16,
    padding: 16,
    width: (width - 80) / 2,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  viewAllTipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllTipTitle: {
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 18,
  },
  viewAllShelterCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewAllShelterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllShelterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllShelterStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  viewAllShelterStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewAllShelterName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  viewAllRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllRatingText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewAllShelterDetails: {
    gap: 8,
    marginBottom: 16,
  },
  viewAllShelterDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewAllShelterDetailText: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.8,
  },
  viewAllShelterActionButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  viewAllShelterActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});