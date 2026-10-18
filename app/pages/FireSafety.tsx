import { app } from "@/firebase/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const db = getFirestore(app);

export default function FireSafetyScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === "dark" ? darkTheme : lightTheme;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "safetyTips", "fire-safety"),
      (docSnap) => {
        setData(docSnap.data());
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: themeColors.text }}>No data found.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={themeColors.backgroundGradient}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {data.sections?.map((section: any, idx: number) => (
          <View key={idx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {section.title}
            </Text>
            <View style={styles.sectionContent}>
              {Array.isArray(section.content) ? (
                section.content.map((item: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    {section.content.length > 1 && (
                      <View
                        style={[styles.bullet, { backgroundColor: "#EF4444" }]}
                      />
                    )}
                    <Text
                      style={[
                        styles.listText,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                ))
              ) : section.content ? (
                <View style={styles.listItem}>
                  <Text
                    style={[
                      styles.listText,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {section.content}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
        {data.emergencyFooter && (
          <View style={styles.emergencyFooter}>
            <Text
              style={[
                styles.emergencyText,
                { color: themeColors.textSecondary },
              ]}
            >
              {data.emergencyFooter}
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const lightTheme = {
  backgroundGradient: ["#F8FAFC", "#E2E8F0"] as const,
  cardBackground: "#FFFFFF",
  text: "#1E293B",
  textSecondary: "#64748B",
  accent: "#2563EB",
};

const darkTheme = {
  backgroundGradient: ["#0F172A", "#1E293B"] as const,
  cardBackground: "#1E293B",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  accent: "#3B82F6",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "80%",
  },
  section: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  sectionContent: {
    gap: 16,
  },
  listItem: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  listText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    lineHeight: 24,
  },
  resourcesContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resourcesTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  resourceText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  emergencyFooter: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
  },
  emergencyText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
