import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const AlarmScreen = () => {
  const [alarmActive, setAlarmActive] = useState(false);
  const [volume, setVolume] = useState(300);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0); // For gradual increase
  const [soundLoaded, setSoundLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeInInterval = useRef<number | null>(null);

  // Set up audio mode and load alarm sound
  useEffect(() => {
    const setupAudio = async () => {
      console.log("Setting up audio...");
      try {
        // Set audio mode for alarm functionality
        console.log("Setting audio mode...");
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log("Audio mode set successfully");

        // Create a simple alarm sound using reliable audio URLs
        // These are publicly accessible audio files optimized for maximum volume
        console.log("Loading primary alarm sound...");
        const { sound: newSound } = await Audio.Sound.createAsync(
          {
            uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          },
          {
            shouldPlay: false,
            isLooping: true,
            volume: 0,
            rate: 1.0, // Normal rate for maximum clarity
            shouldCorrectPitch: false, // Disable pitch correction for maximum volume
          }
        );

        setSound(newSound);
        setSoundLoaded(true);
        console.log("Alarm sound loaded successfully");
      } catch (error) {
        console.log("Error setting up audio:", error);

        // Fallback: Try a different sound URL
        try {
          console.log("Trying fallback sound 1...");
          const { sound: fallbackSound } = await Audio.Sound.createAsync(
            {
              uri: "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3",
            },
            {
              shouldPlay: false,
              isLooping: true,
              volume: 0,
            }
          );
          setSound(fallbackSound);
          setSoundLoaded(true);
          console.log("Fallback alarm sound loaded successfully");
        } catch (fallbackError) {
          console.log("Fallback sound also failed:", fallbackError);

          // Final fallback - try to create a simple tone using a different approach
          try {
            console.log("Trying fallback sound 2...");
            // Create a simple beep using a different URL
            const { sound: finalSound } = await Audio.Sound.createAsync(
              {
                uri: "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3",
              },
              {
                shouldPlay: false,
                isLooping: true,
                volume: 0,
              }
            );
            setSound(finalSound);
            setSoundLoaded(true);
            console.log("Final fallback alarm sound loaded successfully");
          } catch (finalError) {
            console.log("All sound creation methods failed:", finalError);
            // If all else fails, we'll just use vibration
            setSoundLoaded(false);
          }
        }
      }
    };

    setupAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (fadeInInterval.current) {
        clearInterval(fadeInInterval.current);
      }
    };
  }, []); // Remove sound from dependency array to prevent infinite loop

  // Handle alarm activation/deactivation
  useEffect(() => {
    const handleAlarm = async () => {
      if (alarmActive) {
        // Record activation time
        setLastTriggered(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        // Start with volume at 0 and gradually increase
        setCurrentVolume(0);

        if (sound && soundLoaded) {
          try {
            console.log("Playing alarm sound...");
            // Reset sound to beginning and set initial volume
            await sound.setStatusAsync({ positionMillis: 0, volume: 0 });
            await sound.playAsync();
            console.log("Alarm sound started playing");

            // Gradually increase volume to max over 3 seconds (faster than before)
            fadeInInterval.current = setInterval(async () => {
              setCurrentVolume((prev) => {
                const newVolume = Math.min(prev + 0.12, 3.0); // Increase by 12% every 200ms, max 300% volume
                if (sound) {
                  sound
                    .setVolumeAsync(newVolume)
                    .catch((err: any) =>
                      console.log("Error setting volume:", err)
                    );
                }
                return newVolume;
              });
            }, 200); // Faster interval for more intense effect
          } catch (error) {
            console.log("Error playing sound:", error);
            // If sound fails, just use vibration
            setCurrentVolume(1);
          }
        } else {
          console.log("No sound available, using vibration only");
          // No sound available, just use vibration
          setCurrentVolume(1);
        }
      } else {
        // Stop the alarm and clear fade-in interval
        if (fadeInInterval.current) {
          clearInterval(fadeInInterval.current);
          fadeInInterval.current = null;
        }
        if (sound && soundLoaded) {
          try {
            await sound.stopAsync();
            await sound.setVolumeAsync(0);
          } catch (error) {
            console.log("Error stopping sound:", error);
          }
        }
        setCurrentVolume(0);
      }
    };

    handleAlarm();
  }, [alarmActive, sound, soundLoaded]);

  // Animation effects
  useEffect(() => {
    if (alarmActive) {
      // Create pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Create glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Vibrate continuously
      Vibration.vibrate([600, 600], true);
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Vibration.cancel();
    }

    return () => {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Vibration.cancel();
    };
  }, [alarmActive, pulseAnim, glowAnim]);

  // Animate volume indicator
  useEffect(() => {
    Animated.spring(volumeAnim, {
      toValue: currentVolume,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [currentVolume, volumeAnim]);

  const toggleAlarm = async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Debug information
    console.log(
      "Toggle alarm - Sound loaded:",
      soundLoaded,
      "Sound object:",
      !!sound
    );

    setAlarmActive(!alarmActive);
  };

  // Calculate animation values
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Calculate visualizer bar heights based on current volume
  const visualizerHeights = Array(8)
    .fill(0)
    .map((_, i) =>
      pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 10 + currentVolume * 80 * (i % 2 === 0 ? 0.8 : 1.2)],
      })
    );

  return (
    <LinearGradient
      colors={["#0C1220", "#1A2436", "#0C1220"]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Background pattern */}
      <View style={styles.backgroundPattern} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: alarmActive
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(59, 130, 246, 0.15)",
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, alarmActive ? 1.1 : 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name={alarmActive ? "bell-ring" : "bell"}
              size={36}
              color={alarmActive ? "#EF4444" : "#3B82F6"}
            />
          </Animated.View>
          <Text style={styles.title}>Emergency Alarm</Text>
          <Text style={styles.subtitle}>
            {alarmActive ? "Alarm is active!" : "Ready to alert for help"}
          </Text>

          {/* Sound status indicator */}
          <View style={styles.soundStatus}>
            <MaterialCommunityIcons
              name={soundLoaded ? "volume-high" : "volume-off"}
              size={16}
              color={soundLoaded ? "#10B981" : "#EF4444"}
            />
            <Text
              style={[
                styles.soundStatusText,
                { color: soundLoaded ? "#10B981" : "#EF4444" },
              ]}
            >
              {soundLoaded
                ? "Sound Available"
                : "Sound Unavailable - Vibration Only"}
            </Text>
          </View>

          {lastTriggered && (
            <View style={styles.lastTriggered}>
              <Text style={styles.lastTriggeredText}>
                <Ionicons name="time-outline" size={14} color="#94A3B8" />
                Last triggered: {lastTriggered}
              </Text>
            </View>
          )}
        </View>

        {/* Alarm button with pulse animation */}
        <View style={styles.alarmButtonContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
                backgroundColor: alarmActive ? "#EF4444" : "#3B82F6",
                shadowColor: alarmActive ? "#EF4444" : "#3B82F6",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: alarmActive ? 0.8 : 0.3,
                shadowRadius: alarmActive ? 20 : 10,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowOpacity,
                backgroundColor: alarmActive ? "#EF4444" : "#3B82F6",
                shadowColor: alarmActive ? "#EF4444" : "#3B82F6",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: alarmActive ? 0.6 : 0.2,
                shadowRadius: alarmActive ? 40 : 20,
              },
            ]}
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.alarmButton,
                {
                  backgroundColor: alarmActive ? "#EF4444" : "#3B82F6",
                  shadowColor: alarmActive ? "#EF4444" : "#3B82F6",
                },
              ]}
              onPress={toggleAlarm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  alarmActive ? ["#EF4444", "#DC2626"] : ["#3B82F6", "#2563EB"]
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={alarmActive ? "bell-off" : "bell"}
                  size={48}
                  color="#FFF"
                />
                <Text style={styles.alarmButtonText}>
                  {alarmActive ? "STOP ALARM" : "ACTIVATE ALARM"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Volume visualization */}
        <View style={styles.volumeVisualization}>
          <Text style={styles.volumeLabel}>
            SOUND INTENSITY: {Math.round(currentVolume * 100)}%
            {currentVolume < 3.0 && alarmActive && " (Increasing...)"}
            {currentVolume >= 3.0 && alarmActive && " (MAXIMUM VOLUME!)"}
          </Text>

          <View style={styles.volumeBarContainer}>
            <Animated.View
              style={[
                styles.volumeBarFill,
                {
                  width: `${Math.min(currentVolume * 100, 100)}%`,
                  backgroundColor: alarmActive ? "#EF4444" : "#3B82F6",
                },
              ]}
            />
          </View>

          {/* Test sound button */}
          {!alarmActive && soundLoaded && (
            <TouchableOpacity
              style={styles.testSoundButton}
              onPress={async () => {
                try {
                  if (sound) {
                    await sound.setVolumeAsync(1.5); // Maximum test volume
                    await sound.setStatusAsync({ rate: 1.2 }); // Faster playback for intensity
                    await sound.playAsync();
                    setTimeout(async () => {
                      try {
                        await sound.stopAsync();
                        await sound.setVolumeAsync(0);
                        await sound.setStatusAsync({ rate: 1.0 }); // Reset rate
                      } catch (e) {
                        console.log("Error stopping test sound:", e);
                      }
                    }, 2000); // Longer test duration for maximum effect
                  }
                } catch (error) {
                  console.log("Error playing test sound:", error);
                }
              }}
            >
              <Text style={styles.testSoundText}>Test Maximum Volume</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Emergency instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionsHeader}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={24}
              color="#F59E0B"
            />
            <Text style={styles.instructionsTitle}>Important Instructions</Text>
          </View>

          {/* Volume warning */}
          <View style={styles.volumeWarning}>
            <MaterialCommunityIcons
              name="volume-high"
              size={20}
              color="#EF4444"
            />
            <Text style={styles.volumeWarningText}>
              WARNING: This alarm uses maximum volume (300%) for emergency
              situations. Ensure device volume is set to maximum for optimal
              clarity.
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View
              style={[
                styles.instructionIcon,
                { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="volume-high"
                size={18}
                color="#EF4444"
              />
            </View>
            <Text style={styles.instructionText}>
              Alarm sound gradually increases to maximum volume (300%) over 3
              seconds for maximum clarity
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View
              style={[
                styles.instructionIcon,
                { backgroundColor: "rgba(59, 130, 246, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="vibrate"
                size={18}
                color="#3B82F6"
              />
            </View>
            <Text style={styles.instructionText}>
              Device vibrates continuously while alarm is active
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View
              style={[
                styles.instructionIcon,
                { backgroundColor: "rgba(16, 185, 129, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={18}
                color="#10B981"
              />
            </View>
            <Text style={styles.instructionText}>
              Designed to be heard from a distance in emergency situations
            </Text>
          </View>
        </View>

        {/* Emergency contact */}
        <View style={styles.emergencyFooter}>
          <Text style={styles.emergencyText}>
            <MaterialCommunityIcons
              name="phone-alert"
              size={18}
              color="#EF4444"
            />{" "}
            In case of emergency, call 911 or your local emergency number
          </Text>
        </View>
      </View>

      {/* Sound visualization */}
      {alarmActive && (
        <Animated.View
          style={[styles.soundVisualizer, { opacity: pulseOpacity }]}
        >
          {visualizerHeights.map((height, i) => (
            <Animated.View
              key={i}
              style={[
                styles.visualizerBar,
                {
                  height: height,
                  backgroundColor: `rgba(239, 68, 68, ${0.2 + i * 0.1})`,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#0C1220",
    opacity: 0.4,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F1F5F9",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 10,
    textAlign: "center",
    maxWidth: "90%",
    lineHeight: 24,
  },
  soundStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  soundStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
  },
  lastTriggered: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  lastTriggeredText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  alarmButtonContainer: {
    marginVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowEffect: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.4,
    shadowRadius: 30,
    shadowColor: "#3B82F6",
  },
  alarmButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alarmButtonText: {
    marginTop: 16,
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  volumeVisualization: {
    width: "100%",
    marginBottom: 30,
    alignItems: "center",
  },
  volumeLabel: {
    color: "#F1F5F9",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.5,
    fontSize: 16,
    textAlign: "center",
  },
  volumeBarContainer: {
    width: "80%",
    height: 12,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  volumeBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  instructions: {
    width: "100%",
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 16,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
    marginLeft: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: "#CBD5E1",
    lineHeight: 24,
  },
  emergencyFooter: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FECACA",
    textAlign: "center",
    lineHeight: 24,
  },
  soundVisualizer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 20,
    gap: 4,
    zIndex: 1,
  },
  visualizerBar: {
    width: 8,
    backgroundColor: "#EF4444",
    borderRadius: 4,
    marginHorizontal: 2,
  },
  testSoundButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginTop: 16,
  },
  testSoundText: {
    color: "#F1F5F9",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  volumeWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  volumeWarningText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
  },
});

export default AlarmScreen;
