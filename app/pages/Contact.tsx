import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { getDatabase, onValue, ref } from "firebase/database";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { app } from "../../firebase/firebaseConfig";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 80,
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  districtBlock: {
    marginBottom: 16,
  },
  districtTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactLabel: {
    fontWeight: "600",
    marginRight: 4,
    fontSize: 15,
  },
  contactNumber: {
    fontWeight: "500",
    fontSize: 15,
  },
  emergencyFooter: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    alignItems: "center",
  },
  emergencyText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  searchBarWrapper: {
    paddingHorizontal: 24,
    paddingTop: 32,
    marginBottom: 8,
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 0,
    color: "#1E293B",
  },
  suggestionDropdown: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  suggestionText: {
    fontSize: 16,
    color: "#1E293B",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  picker: {
    flex: 1,
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contactCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 12,
  },
  contactCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  contactCardPhone: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  contactCardOrg: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  contactCardType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  pageBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
  },
  pageBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginHorizontal: 16,
  },
});

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ContactScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const themeColors = {
    background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBackground: colorScheme === "dark" ? "#1E293B" : "#FFFFFF",
    text: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
    textSecondary: colorScheme === "dark" ? "#94A3B8" : "#64748B",
    accent: colorScheme === "dark" ? "#3B82F6" : "#2563EB",
    border: colorScheme === "dark" ? "#334155" : "#E2E8F0",
    headerGradient:
      colorScheme === "dark"
        ? (["#1D4ED8", "#1E40AF"] as const)
        : (["#2563EB", "#1D4ED8"] as const),
  };

  // Hide default navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [flatContacts, setFlatContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Real-time data listener
  useEffect(() => {
    const db = getDatabase(app);
    const contactsRef = ref(db, "/");
    const unsubscribe = onValue(
      contactsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const contactsArray = Object.entries(data).map(
              ([action, details]) => ({
                id: action,
                action: action
                  .replace(/Action: "/g, "")
                  .replace(/"/g, "")
                  .trim(),
                contact: (details as any)?.Contact,
                organization: (details as any)?.Organization,
                serviceType: (details as any)?.["Service Type"],
              })
            );
            setFlatContacts(contactsArray);
          }
          setLoading(false);
        } catch (err) {
          setFlatContacts([]);
          setLoading(false);
        }
      },
      (error) => {
        setFlatContacts([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Memoized filter logic with search - FIXED TYPE ISSUES
  const filteredContacts = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return flatContacts.filter(
      (contact) =>
        (!selectedOrganization ||
          contact.organization === selectedOrganization) &&
        (!selectedServiceType || contact.serviceType === selectedServiceType) &&
        (debouncedSearchTerm === "" ||
          (contact.action &&
            typeof contact.action === "string" &&
            contact.action.toLowerCase().includes(term)) ||
          (contact.contact &&
            typeof contact.contact === "string" &&
            contact.contact.toLowerCase().includes(term)) ||
          (contact.organization &&
            typeof contact.organization === "string" &&
            contact.organization.toLowerCase().includes(term)) ||
          (contact.serviceType &&
            typeof contact.serviceType === "string" &&
            contact.serviceType.toLowerCase().includes(term)))
    );
  }, [
    flatContacts,
    selectedOrganization,
    selectedServiceType,
    debouncedSearchTerm,
  ]);

  // Memoized pagination
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredContacts, page]);

  // Memoized unique options
  const organizations = useMemo(
    () =>
      Array.from(
        new Set(flatContacts.map((c) => c.organization).filter(Boolean))
      ) as string[],
    [flatContacts]
  );

  const serviceTypes = useMemo(
    () =>
      Array.from(
        new Set(flatContacts.map((c) => c.serviceType).filter(Boolean))
      ) as string[],
    [flatContacts]
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedOrganization, selectedServiceType, searchTerm]);

  // Optimized handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(
        Math.max(
          1,
          Math.min(newPage, Math.ceil(filteredContacts.length / PAGE_SIZE))
        )
      );
    },
    [filteredContacts.length]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  // Memoized ContactCard component

  type ContactCardProps = {
    item: any;
    themeColors: any;
    styles: any;
    Linking: typeof Linking;
    ThemedText: typeof ThemedText;
  };

  const ContactCard = React.memo(function ContactCard({
    item,
    themeColors,
    styles,
    Linking,
    ThemedText,
  }: ContactCardProps) {
    return (
      <View
        style={[
          styles.contactCard,
          {
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border,
          },
        ]}
      >
        {item.action && (
          <ThemedText
            style={[styles.contactCardTitle, { color: themeColors.text }]}
          >
            {item.action}
          </ThemedText>
        )}
        {item.contact && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${item.contact}`)}
          >
            <ThemedText
              style={[styles.contactCardPhone, { color: themeColors.text }]}
            >
              📞 {item.contact}
            </ThemedText>
          </TouchableOpacity>
        )}
        {item.organization && (
          <ThemedText
            style={[
              styles.contactCardOrg,
              { color: themeColors.textSecondary },
            ]}
          >
            Organization: {item.organization}
          </ThemedText>
        )}
        {item.serviceType && (
          <ThemedText
            style={[
              styles.contactCardType,
              { color: themeColors.textSecondary },
            ]}
          >
            Service Type: {item.serviceType}
          </ThemedText>
        )}
      </View>
    );
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[themeColors.background, themeColors.background]}
        style={styles.container}
      >
        {/* Custom header */}
        {flatContacts.length > 0 && (
          <LinearGradient
            colors={themeColors.headerGradient}
            style={styles.headerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <View>
                <ThemedText style={styles.headerTitle}>
                  Emergency Contacts
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  Find emergency numbers and services
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Filter dropdowns */}
        <View style={styles.filterRow}>
          <Picker
            selectedValue={selectedOrganization}
            style={styles.picker}
            onValueChange={setSelectedOrganization}
          >
            <Picker.Item label="All Organizations" value="" />
            {organizations.map((org, idx) => (
              <Picker.Item key={idx} label={String(org)} value={String(org)} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedServiceType}
            style={styles.picker}
            onValueChange={setSelectedServiceType}
          >
            <Picker.Item label="All Service Types" value="" />
            {serviceTypes.map((type, idx) => (
              <Picker.Item
                key={idx}
                label={String(type)}
                value={String(type)}
              />
            ))}
          </Picker>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={[
              styles.searchBar,
              {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Search contacts, services, organizations..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchTerm}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
        </View>

        {/* FlatList for contacts */}
        <FlatList
          data={paginatedContacts}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 108, // estimated/fixed height of ContactCard
            offset: 108 * index,
            index,
          })}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item }) => (
            <ContactCard
              item={item}
              themeColors={themeColors}
              styles={styles}
              Linking={Linking}
              ThemedText={ThemedText}
            />
          )}
          ListEmptyComponent={
            <ThemedText
              style={{
                textAlign: "center",
                marginTop: 40,
                color: themeColors.text,
              }}
            >
              {flatContacts.length === 0
                ? "No emergency contacts available"
                : "No matching contacts found"}
            </ThemedText>
          }
        />

        {/* Pagination controls */}
        {filteredContacts.length > PAGE_SIZE && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, { borderColor: themeColors.border }]}
              onPress={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ThemedText
                style={[
                  styles.pageBtnText,
                  {
                    color:
                      page === 1 ? themeColors.textSecondary : themeColors.text,
                    opacity: page === 1 ? 0.5 : 1,
                  },
                ]}
              >
                {"< Prev"}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText
              style={[styles.pageInfo, { color: themeColors.textSecondary }]}
            >
              {`Page ${page} of ${Math.ceil(
                filteredContacts.length / PAGE_SIZE
              )}`}
            </ThemedText>
            <TouchableOpacity
              style={[styles.pageBtn, { borderColor: themeColors.border }]}
              onPress={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil(filteredContacts.length / PAGE_SIZE)}
            >
              <ThemedText
                style={[
                  styles.pageBtnText,
                  {
                    color:
                      page === Math.ceil(filteredContacts.length / PAGE_SIZE)
                        ? themeColors.textSecondary
                        : themeColors.text,
                    opacity:
                      page === Math.ceil(filteredContacts.length / PAGE_SIZE)
                        ? 0.5
                        : 1,
                  },
                ]}
              >
                {"Next >"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}
