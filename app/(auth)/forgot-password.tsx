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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
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

  const handleResetPassword = async () => {
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Call Firebase password reset function
      await resetPassword(email);
      setSuccess(true);
      console.log("✅ Password reset email sent successfully to:", email);
    } catch (e: any) {
      console.error("❌ Password reset failed:", e.message);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[styles.card, { backgroundColor: themeColors.cardBackground }]}
        >
          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={[styles.successText, { color: themeColors.text }]}>
                Instructions sent!
              </Text>
              <Text
                style={[
                  styles.instructions,
                  { color: themeColors.textSecondary },
                ]}
              >
                We've sent password reset instructions to {email}. Please check
                your email and follow the link to reset your password.
              </Text>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Forgot Password
              </Text>

              <Text
                style={[styles.subtitle, { color: themeColors.textSecondary }]}
              >
                Enter your email to reset your password
              </Text>

              {error ? (
                <Text style={[styles.errorText, { marginBottom: 16 }]}>
                  {error}
                </Text>
              ) : null}

              <View style={styles.formGroup}>
                <Text
                  style={[styles.label, { color: themeColors.textSecondary }]}
                >
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
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.resetButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetButtonText}>
                    Send Reset Instructions
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={themeColors.accent}
                />
                <Text style={[styles.backText, { color: themeColors.accent }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;

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
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 24,
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
  backLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  successText: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 16,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
