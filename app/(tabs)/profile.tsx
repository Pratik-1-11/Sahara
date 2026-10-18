// =========================
// Imports
// =========================
import { useAuth } from "@/components/AuthProvider";
import NotificationSettings from "@/components/NotificationSettings";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebase/firebaseConfig";

// =========================
// Cloudinary Config (for avatar uploads)
// =========================
const CLOUDINARY_UPLOAD_PRESET = "Social Page"; // <-- Replace with your Cloudinary upload preset
const CLOUDINARY_CLOUD_NAME = "dwq87pglw"; // <-- Replace with your Cloudinary cloud name

// =========================
// Main ProfilePage Component
// =========================
const ProfilePage = () => {
  // =========================
  // State Variables
  // =========================
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [phoneError, setPhoneError] = useState("");
  // Change Password modal state
  const [changePwVisible, setChangePwVisible] = useState(false);
  // Privacy Policy modal state
  const [privacyVisible, setPrivacyVisible] = useState(false);
  // Terms of Service modal state
  const [termsVisible, setTermsVisible] = useState(false);
  // Notification Settings modal state
  const [notificationSettingsVisible, setNotificationSettingsVisible] =
    useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  // Change Password handler
  const handleChangePassword = async () => {
    setPwError("");
    if (newPw !== confirmNewPw) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwLoading(true);
    try {
      const user = getAuth().currentUser;
      if (!user || !user.email) throw new Error("User not found");
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setChangePwVisible(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmNewPw("");
      Alert.alert("Success", "Password changed successfully!");
    } catch (e) {
      setPwError((e as any).message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const authUser = getAuth().currentUser;

  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);
  const toggleBiometric = () => setBiometricEnabled((prev) => !prev);

  // Settings sections
  const accountSettings = [
    { id: 1, title: "Change Password", icon: "lock" },
    { id: 2, title: "Privacy Policy", icon: "shield" },
    { id: 3, title: "Terms of Service", icon: "file-text" },
  ];

  const appSettings = [
    { id: 1, title: "Notification Settings", icon: "bell" },
    { id: 2, title: "Language", value: "English", icon: "globe" },
    { id: 3, title: "Storage", value: "1.2 GB used", icon: "hard-drive" },
    { id: 4, title: "Clear Cache", icon: "trash-2" },
  ];

  // =========================
  // Theme Colors (Edit here for color changes)
  // =========================
  const themeColors = {
    background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC", // Main background color
    cardBackground: colorScheme === "dark" ? "#1E293B" : "#FFFFFF", // Card backgrounds
    text: colorScheme === "dark" ? "#F1F5F9" : "#1E293B", // Main text color
    textSecondary: colorScheme === "dark" ? "#94A3B8" : "#64748B", // Secondary text
    accent: colorScheme === "dark" ? "#3B82F6" : "#2563EB", // Accent color (buttons, links)
    border: colorScheme === "dark" ? "#334155" : "#E2E8F0", // Border color
    headerGradient:
      colorScheme === "dark"
        ? (["#1D4ED8", "#1E40AF"] as const)
        : (["#2563EB", "#1D4ED8"] as const), // Header gradient
    switchTrack: colorScheme === "dark" ? "#475569" : "#CBD5E1", // Switch track color
    switchThumb: colorScheme === "dark" ? "#F8FAFC" : "#FFFFFF", // Switch thumb color
    error: "#EF4444", // Error color
    success: "#10B981", // Success color
  };

  // =========================
  // Fetch User Profile from Firestore
  // =========================
  useEffect(() => {
    if (!authUser) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const userRef = doc(db, "users", authUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as { name?: string; email?: string; phone?: string; avatar?: string };
        setProfile({
          name: userData.name || authUser.displayName || "",
          email: userData.email || authUser.email || "",
          phone: userData.phone || "",
          avatar: userData.avatar || authUser.photoURL || "https://i.pravatar.cc/300?u=profile",
        });
      } else {
        setProfile({
          name: authUser.displayName || "",
          email: authUser.email || "",
          phone: "",
          avatar: authUser.photoURL || "https://i.pravatar.cc/300?u=profile",
        });
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [authUser]);

  // =========================
  // Save Profile Changes
  // =========================
  const handleSaveProfile = async () => {
    if (!authUser) return;
    // Phone number validation: must be exactly 10 digits
    if (!/^\d{10}$/.test(profile.phone)) {
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    } else {
      setPhoneError("");
    }
    setSaving(true);
    try {
      // Update Firestore
      const userRef = doc(db, "users", authUser.uid);
      await setDoc(userRef, profile, { merge: true });
      // Update Firebase Auth profile (name, email)
      if (profile.name && profile.name !== authUser.displayName) {
        await updateProfile(authUser, { displayName: profile.name });
      }
      if (profile.email && profile.email !== authUser.email) {
        await updateEmail(authUser, profile.email);
      }
      setModalVisible(false);
      setEditMode(false);
    } catch (e) {
      alert("Failed to update profile: " + (e as any).message);
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Pick and Upload Image to Cloudinary
  // =========================
  const handlePickImage = async () => {
    // Ask for permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }
    // Pick image
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (
      pickerResult.canceled ||
      !pickerResult.assets ||
      !pickerResult.assets[0].uri
    )
      return;
    setUploading(true);
    try {
      const uri = pickerResult.assets[0].uri;
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any); // <-- Fix type error for React Native
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setProfile((p) => ({ ...p, avatar: data.secure_url }));
      } else {
        alert("Failed to upload image");
      }
    } catch (e) {
      alert("Image upload error: " + (e as any).message);
    } finally {
      setUploading(false);
    }
  };

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
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account settings
            </Text>
          </View>
          {/* Removed settings button */}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            Profile Information Section (Edit avatar, name, email, phone here)
          ========================= */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: profile.avatar || "https://i.pravatar.cc/300?u=profile",
              }}
              style={styles.profileImage}
            />
            <View style={styles.editButton}>
              <Feather
                name="edit-3"
                size={16}
                color="#FFFFFF"
                onPress={() => {
                  setModalVisible(true);
                  setEditMode(true);
                }}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: themeColors.text }]}>
              {profile.name || "-"}
            </Text>
            <Text style={[styles.email, { color: themeColors.textSecondary }]}>
              {profile.email || "-"}
            </Text>
            <Text style={[styles.email, { color: themeColors.textSecondary }]}>
              {profile.phone || "-"}
            </Text>
          </View>
        </View>

        {/* =========================
            Profile Edit Modal (Edit name, email, phone, avatar here)
          ========================= */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setModalVisible(false);
            setEditMode(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePickImage}
                disabled={uploading}
              >
                <Text
                  style={{
                    color: themeColors.accent,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {uploading ? "Uploading..." : "Edit Photo"}
                </Text>
              </TouchableOpacity>
              <Image
                source={{
                  uri: profile.avatar || "https://i.pravatar.cc/300?u=profile",
                }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignSelf: "center",
                  marginVertical: 10,
                }}
              />
              <TextInput
                style={styles.modalInput}
                value={profile.name}
                onChangeText={(text) =>
                  setProfile((p) => ({ ...p, name: text }))
                }
                placeholder="Name"
                placeholderTextColor={themeColors.textSecondary}
              />
              <TextInput
                style={styles.modalInput}
                value={profile.email}
                onChangeText={(text) =>
                  setProfile((p) => ({ ...p, email: text }))
                }
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={themeColors.textSecondary}
              />
              <TextInput
                style={styles.modalInput}
                value={profile.phone}
                onChangeText={(text) => {
                  // Only allow numbers
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setProfile((p) => ({ ...p, phone: cleaned }));
                  if (cleaned.length !== 10 && cleaned.length > 0) {
                    setPhoneError("Phone number must be exactly 10 digits");
                  } else {
                    setPhoneError("");
                  }
                }}
                placeholder="Phone"
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={themeColors.textSecondary}
              />
              {phoneError ? (
                <Text
                  style={{
                    color: themeColors.error,
                    marginBottom: 8,
                    marginLeft: 2,
                    fontSize: 13,
                  }}
                >
                  {phoneError}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 18,
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.success },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={saving || uploading}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.error, marginLeft: 8 },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    setEditMode(false);
                  }}
                  disabled={saving || uploading}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* =========================
            Account Settings Section (Change password, privacy, terms)
          ========================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Account Settings
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            {/* Account Settings List */}
            {accountSettings.map((item) => {
              if (item.title === "Change Password") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.settingItem}
                    activeOpacity={0.8}
                    onPress={() => setChangePwVisible(true)}
                  >
                    <View style={styles.settingLeft}>
                      <Feather
                        name={item.icon as any}
                        size={20}
                        color={themeColors.accent}
                      />
                      <Text
                        style={[
                          styles.settingText,
                          { color: themeColors.text, marginLeft: 16 },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              }
              if (item.title === "Privacy Policy") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.settingItem}
                    activeOpacity={0.8}
                    onPress={() => setPrivacyVisible(true)}
                  >
                    <View style={styles.settingLeft}>
                      <Feather
                        name={item.icon as any}
                        size={20}
                        color={themeColors.accent}
                      />
                      <Text
                        style={[
                          styles.settingText,
                          { color: themeColors.text, marginLeft: 16 },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              }
              if (item.title === "Terms of Service") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.settingItem}
                    activeOpacity={0.8}
                    onPress={() => setTermsVisible(true)}
                  >
                    <View style={styles.settingLeft}>
                      <Feather
                        name={item.icon as any}
                        size={20}
                        color={themeColors.accent}
                      />
                      <Text
                        style={[
                          styles.settingText,
                          { color: themeColors.text, marginLeft: 16 },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              }
              // ...existing code for other items...
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingItem}
                  activeOpacity={0.8}
                >
                  <View style={styles.settingLeft}>
                    <Feather
                      name={item.icon as any}
                      size={20}
                      color={themeColors.accent}
                    />
                    <Text
                      style={[
                        styles.settingText,
                        { color: themeColors.text, marginLeft: 16 },
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
            {/* Privacy Policy Modal */}
            <Modal
              visible={privacyVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setPrivacyVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: "80%" }]}>
                  <Text style={styles.modalTitle}>Privacy Policy</Text>
                  <ScrollView
                    style={{ marginBottom: 16 }}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text
                      style={{
                        color: themeColors.text,
                        fontSize: 15,
                        marginBottom: 12,
                      }}
                    >
                      Welcome to Sahara! Your privacy is important to us. This
                      Privacy Policy explains how we collect, use, and protect
                      your information when you use our services. By using
                      Sahara, you agree to the practices described below.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      1. Information We Collect
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • Information you provide: name, email, phone, profile
                      photo, and any content you post or share.
                      {"\n"}• Usage data: device information, log data, and how
                      you interact with Sahara.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      2. How We Use Your Information
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • To provide, personalize, and improve our services.
                      {"\n"}• To communicate with you about updates, security,
                      and support.
                      {"\n"}• To promote safety and integrity on the platform.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      3. Sharing of Information
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • We do not sell your personal information.
                      {"\n"}• We may share information with trusted partners who
                      help us operate Sahara, subject to strict confidentiality
                      agreements.
                      {"\n"}• We may disclose information if required by law or
                      to protect the safety of users.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      4. Data Security
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • We use industry-standard security measures to protect
                      your data.
                      {"\n"}• Despite our efforts, no system is completely
                      secure. Please use strong passwords and protect your
                      account.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      5. Your Choices and Rights
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • You can access, update, or delete your information at
                      any time in your profile settings.
                      {"\n"}• You may contact us for any privacy-related
                      questions or requests.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      6. Updates to This Policy
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • We may update this Privacy Policy from time to time. We
                      will notify you of significant changes.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontSize: 14,
                        marginBottom: 10,
                      }}
                    >
                      For more details, please review our full Privacy Policy on
                      our website or contact support@safetynet.com.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.textSecondary,
                        fontSize: 13,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      Last updated: July 16, 2025
                    </Text>
                  </ScrollView>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: themeColors.accent },
                    ]}
                    onPress={() => setPrivacyVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* Terms of Service Modal */}
            <Modal
              visible={termsVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setTermsVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: "80%" }]}>
                  <Text style={styles.modalTitle}>Terms of Service</Text>
                  <ScrollView
                    style={{ marginBottom: 16 }}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text
                      style={{
                        color: themeColors.text,
                        fontSize: 15,
                        marginBottom: 12,
                      }}
                    >
                      Welcome to Sahara! By using our app, you agree to the
                      following terms and conditions. Please read them
                      carefully.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      1. Acceptance of Terms
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      By accessing or using Sahara, you agree to be bound by
                      these Terms of Service and all applicable laws and
                      regulations.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      2. Use of the App
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • You agree to use the app only for lawful purposes.
                      {"\n"}• You will not misuse, disrupt, or attempt to gain
                      unauthorized access to the app or its services.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      3. User Content
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • You are responsible for any content you post or share.
                      {"\n"}• You must not post content that is illegal,
                      offensive, or infringes on others' rights.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      4. Intellectual Property
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • All content and materials in Sahara are the property of
                      Tech Innovations Inc. or its licensors.
                      {"\n"}• You may not copy, modify, or distribute any part
                      of the app without permission.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      5. Limitation of Liability
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • Sahara is provided "as is" without warranties of any
                      kind.
                      {"\n"}• We are not liable for any damages or losses
                      resulting from your use of the app.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 6,
                      }}
                    >
                      6. Changes to Terms
                    </Text>
                    <Text style={{ color: themeColors.text, marginBottom: 10 }}>
                      • We may update these Terms of Service at any time.
                      Continued use of the app means you accept the new terms.
                    </Text>
                    <Text
                      style={{
                        color: themeColors.textSecondary,
                        fontSize: 13,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      Last updated: July 16, 2025
                    </Text>
                  </ScrollView>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: themeColors.accent },
                    ]}
                    onPress={() => setTermsVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* Change Password Modal */}
            <Modal
              visible={changePwVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setChangePwVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    placeholder="Current Password"
                    secureTextEntry
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.modalInput}
                    value={newPw}
                    onChangeText={setNewPw}
                    placeholder="New Password"
                    secureTextEntry
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.modalInput}
                    value={confirmNewPw}
                    onChangeText={setConfirmNewPw}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  {pwError ? (
                    <Text style={{ color: themeColors.error, marginBottom: 8 }}>
                      {pwError}
                    </Text>
                  ) : null}
                  <View
                    style={{ flexDirection: "row", justifyContent: "flex-end" }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        { backgroundColor: themeColors.success },
                      ]}
                      onPress={handleChangePassword}
                      disabled={pwLoading}
                    >
                      {pwLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: "#fff" }}>Save</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        { backgroundColor: themeColors.error, marginLeft: 8 },
                      ]}
                      onPress={() => setChangePwVisible(false)}
                      disabled={pwLoading}
                    >
                      <Text style={{ color: "#fff" }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>

        {/* =========================
            App Preferences Section (Language, storage, notifications, biometric)
          ========================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            App Preferences
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            {appSettings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.title === "Notification Settings") {
                    setNotificationSettingsVisible(true);
                  }
                }}
              >
                <View style={styles.settingLeft}>
                  <Feather
                    name={item.icon as any}
                    size={20}
                    color={themeColors.accent}
                  />
                  <Text
                    style={[
                      styles.settingText,
                      { color: themeColors.text, marginLeft: 16 },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={styles.settingRight}>
                  {item.value && (
                    <Text
                      style={[
                        styles.settingValue,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {item.value}
                    </Text>
                  )}
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}

            {/* Notification toggle and biometric toggle remain as-is */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Feather name="bell" size={20} color={themeColors.accent} />
                <Text
                  style={[
                    styles.settingText,
                    { color: themeColors.text, marginLeft: 16 },
                  ]}
                >
                  Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{
                  false: themeColors.switchTrack,
                  true: themeColors.accent,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Feather name="lock" size={20} color={themeColors.accent} />
                <Text
                  style={[
                    styles.settingText,
                    { color: themeColors.text, marginLeft: 16 },
                  ]}
                >
                  Biometric Login
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{
                  false: themeColors.switchTrack,
                  true: themeColors.accent,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* =========================
            Security Section (2FA, login activity)
          ========================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Security
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.8}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={20} color={themeColors.accent} />
                <Text
                  style={[
                    styles.settingText,
                    { color: themeColors.text, marginLeft: 16 },
                  ]}
                >
                  Two-Factor Authentication
                </Text>
              </View>
              <Text
                style={[styles.settingAction, { color: themeColors.accent }]}
              >
                Enable
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.8}>
              <View style={styles.settingLeft}>
                <Feather name="activity" size={20} color={themeColors.accent} />
                <Text
                  style={[
                    styles.settingText,
                    { color: themeColors.text, marginLeft: 16 },
                  ]}
                >
                  Login Activity
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            About Section (App version, developer, release date)
          ========================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            About Sahara
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <View style={styles.infoItem}>
              <Text
                style={[styles.infoLabel, { color: themeColors.textSecondary }]}
              >
                Version
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                1.2.3
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text
                style={[styles.infoLabel, { color: themeColors.textSecondary }]}
              >
                Developer
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                Tech Innovations Inc.
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text
                style={[styles.infoLabel, { color: themeColors.textSecondary }]}
              >
                Release Date
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                March 15, 2023
              </Text>
            </View>
          </View>
        </View>

        {/* =========================
            Logout Button
          ========================= */}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.error,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
            }}
            onPress={async () => {
              await logout();
              router.replace("/Login/UserLogin");
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notification Settings Modal */}
      <Modal
        visible={notificationSettingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationSettingsVisible(false)}
      >
        <NotificationSettings
          onClose={() => setNotificationSettingsVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

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
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 15,
    marginRight: 12,
    fontWeight: "500",
  },
  settingAction: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  actionContainer: {
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 18,
    color: "#1E293B",
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButton: {
    backgroundColor: "#E2E8F0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
});

// =========================
// Protected Route Wrapper
// =========================
function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}

export default ProtectedProfilePage;
