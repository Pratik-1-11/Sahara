import { useAuth } from "@/components/AuthProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

/**
 * Email Validation Features:
 * ✅ Validates any valid email format
 * ✅ Real-time validation with visual feedback
 * ✅ Detailed error messages
 * ✅ Supports student and office emails
 */
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

export default function UserLoginScreen() {
  const colorScheme = useColorScheme();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  const themeColors = {
    background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBackground: colorScheme === "dark" ? "#1E293B" : "#FFFFFF",
    text: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
    textSecondary: colorScheme === "dark" ? "#94A3B8" : "#64748B",
    accent: colorScheme === "dark" ? "#3B82F6" : "#2563EB",
    border: colorScheme === "dark" ? "#334155" : "#E2E8F0",
    inputBackground: colorScheme === "dark" ? "#1E293B" : "#F1F5F9",
  };

  // Simple email validation that accepts any valid email format
  function isValidEmail(email: string): { isValid: boolean; message: string } {
    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    return { isValid: true, message: "Valid email address" };
  }

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (pw: string) => pw.length >= 8;

  // Real-time email validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.trim()) {
      const validation = isValidEmail(text);
      setEmailValidation(validation);
    } else {
      setEmailValidation(null);
    }
  };

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Signup validation
        if (!name.trim()) throw new Error("Name is required");

        // Email validation
        const emailValidation = isValidEmail(email);
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.message);
        }

        if (!validatePassword(password))
          throw new Error("Password must be at least 8 characters");
        if (password !== confirmPassword)
          throw new Error("Passwords do not match");

        await signup({ name, email, password, rememberMe: true });
      } else {
        // Login validation
        const emailValidation = isValidEmail(email);
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.message);
        }

        if (!validatePassword(password))
          throw new Error("Password must be at least 8 characters");

        await login({ email, password, rememberMe });
      }
      // Redirect after successful login/signup
      const redirectTo =
        typeof params.redirect === "string" ? params.redirect : "/";
      router.replace(redirectTo);
    } catch (e: any) {
      setError(e.message || (isSignup ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  // Remove Google sign-in button/component and related logic

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeColors.background}
      />

      {/* Logo removed for a cleaner look */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.cardBackground },
            { marginTop: 48, marginBottom: 24 },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>
            {isSignup ? "Create Account" : "Sign in"}
          </Text>

          {error ? (
            <Text style={[styles.errorText, { marginBottom: 20 }]}>
              {error}
            </Text>
          ) : null}

          {isSignup && (
            <View style={styles.formGroup}>
              <Text
                style={[styles.label, { color: themeColors.textSecondary }]}
              >
                Name
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: themeColors.inputBackground },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Your name"
                  placeholderTextColor={themeColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

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
                style={[
                  styles.input,
                  { color: themeColors.text },
                  emailValidation && {
                    borderColor: emailValidation.isValid
                      ? "#10B981"
                      : "#EF4444",
                    borderWidth: 1,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={themeColors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailValidation && (
                <Ionicons
                  name={
                    emailValidation.isValid
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={20}
                  color={emailValidation.isValid ? "#10B981" : "#EF4444"}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
            {emailValidation && !emailValidation.isValid && (
              <Text style={[styles.helperText, { color: "#EF4444" }]}>
                {emailValidation.message}
              </Text>
            )}
            {emailValidation && emailValidation.isValid && (
              <Text style={[styles.helperText, { color: "#10B981" }]}>
                ✓ Valid email address
              </Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: themeColors.inputBackground },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={themeColors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="••••••••"
                placeholderTextColor={themeColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isSignup && (
            <View style={styles.formGroup}>
              <Text
                style={[styles.label, { color: themeColors.textSecondary }]}
              >
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: themeColors.inputBackground },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          {/* Remember Me and Forgot Password only for Sign In */}
          {!isSignup && (
            <View style={styles.rememberForgotContainer}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Ionicons
                  name={rememberMe ? "checkbox" : "square-outline"}
                  size={20}
                  color={
                    rememberMe ? themeColors.accent : themeColors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.rememberMeText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("../(auth)/forgot-password")}
              >
                <Text style={{ color: themeColors.accent }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.authButton,
              {
                backgroundColor: themeColors.accent,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.authButtonText}>
                {isSignup ? "Create Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View
              style={[styles.dividerLine, { borderColor: themeColors.border }]}
            />
            <Text
              style={[styles.dividerText, { color: themeColors.textSecondary }]}
            >
              or
            </Text>
            <View
              style={[styles.dividerLine, { borderColor: themeColors.border }]}
            />
          </View>

          {/* Remove Google sign-in button/component and related logic */}

          <View style={styles.authToggleContainer}>
            <Text style={[styles.authToggleText, { color: themeColors.text }]}>
              {isSignup ? "Already have an account?" : "Not a member?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
              <Text
                style={[styles.authToggleAction, { color: themeColors.accent }]}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
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
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rememberForgotContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  forgotPassword: {},
  authButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 16,
  },
  authToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  authToggleText: {
    fontSize: 15,
    marginRight: 4,
  },
  authToggleAction: {
    fontSize: 15,
    fontWeight: "600",
  },
});
