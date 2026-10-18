import { resetPassword } from "@/firebase/authFunctions";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const themeColors = {
    background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBackground: colorScheme === "dark" ? "#1E293B" : "#FFFFFF",
    text: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
    textSecondary: colorScheme === "dark" ? "#94A3B8" : "#64748B",
    accent: colorScheme === "dark" ? "#3B82F6" : "#2563EB",
    border: colorScheme === "dark" ? "#334155" : "#E2E8F0",
    inputBackground: colorScheme === "dark" ? "#1E293B" : "#F1F5F9",
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleReset = async () => {
    setError("");
    setSuccess(false);
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);

    try {
      // Call Firebase password reset function
      await resetPassword(email);
      setSuccess(true);
    } catch (e: any) {
      setError(
        e.message || "Failed to send reset instructions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeColors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[styles.card, { backgroundColor: themeColors.cardBackground }]}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Enter your email to receive a password reset link.
          </Text>
          {error ? (
            <Text style={[styles.errorText, { marginBottom: 16 }]}>
              {error}
            </Text>
          ) : null}
          {success ? (
            <Text style={[styles.successText, { marginBottom: 16 }]}>
              If an account exists, a reset link has been sent!
            </Text>
          ) : null}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: themeColors.inputBackground },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={themeColors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="your@email.com"
                placeholderTextColor={themeColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: themeColors.accent,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace("/Login/UserLogin")}
          >
            <Text style={{ color: themeColors.accent, textAlign: "center" }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
  successText: {
    color: "#22C55E",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  resetButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  backToLogin: {
    marginTop: 8,
  },
});
