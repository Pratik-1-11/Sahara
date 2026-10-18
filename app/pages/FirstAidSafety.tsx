import { LinearGradient } from "expo-linear-gradient";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function FirstAidSafetyScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === "dark" ? darkTheme : lightTheme;

  const openResource = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient
      colors={themeColors.backgroundGradient}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nepali Sections */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            प्राथमिक उपचार के हो?
          </Text>
          <Text style={[styles.listText, { color: themeColors.textSecondary }]}>
            घाइते वा बिरामीलाई अस्पताल पुर्‍याउनु अघि दिइने तत्कालीन उपचारलाई
            प्राथमिक उपचार भनिन्छ।
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            प्राथमिक उपचार आवश्यक पर्ने कारणहरू
          </Text>
          <View style={styles.sectionContent}>
            {[
              "सडक दुर्घटना",
              "आगोले पोलेको",
              "पानीमा डुबेको",
              "चोटपटक, रगत बग्ने",
              "सर्पले टोकेको, बिषादी सेवन",
            ].map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: "#06D6A0" }]} />
                <Text
                  style={[
                    styles.listText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            प्रभावहरू
          </Text>
          <View style={styles.sectionContent}>
            {[
              "जीवनरक्षा, थप क्षति रोकथाम",
              "रोगको संक्रमण कम",
              "घाइतेको अवस्था स्थिर राख्न सहयोग",
              "चाँडो उपचारको व्यवस्था",
            ].map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: "#06D6A0" }]} />
                <Text
                  style={[
                    styles.listText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            पूर्वतयारी र रोकथामका उपायहरू
          </Text>
          <View style={styles.sectionContent}>
            {[
              "प्राथमिक उपचार बक्स तयार राख्नुहोस्",
              "प्रशिक्षण लिने र अरूलाई सिकाउने",
              "आपतकालीन नम्बरहरू सुरक्षित राख्नुहोस्",
              "सुरक्षित वातावरणमा राख्नुहोस्",
            ].map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: "#06D6A0" }]} />
                <Text
                  style={[
                    styles.listText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            सुरक्षा सुझावहरू
          </Text>
          <View style={styles.sectionContent}>
            {[
              "घाइतेलाई नछोड्नुहोस्, शान्त पार्नुहोस्",
              "रगत बगिरहेको छ भने दबाब दिनुहोस्",
              "सास फेर्न गाह्रो भएमा तुरुन्तै अस्पताल लैजानुहोस्",
              "आगोले पोलेको ठाउँमा चिसो पानी हाल्नुहोस्",
              "बिषादी सेवनमा बान्ता नगराउनुहोस्, तुरुन्तै अस्पताल लैजानुहोस्",
            ].map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: "#06D6A0" }]} />
                <Text
                  style={[
                    styles.listText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Emergency Footer */}
        <View style={styles.emergencyFooter}>
          <Text
            style={[styles.emergencyText, { color: themeColors.textSecondary }]}
          >
            In case of emergency, call 911 or your local emergency number
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Shared Styles and Themes
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
