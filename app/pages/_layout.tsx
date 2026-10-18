import { Stack } from "expo-router";

export default function PagesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="QuizScreen"
        options={{
          title: "Emergency Quiz",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#2563EB",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="EarthquakeSafety"
        options={{
          title: "Earthquake Safety",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#F59E0B",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="FloodSafety"
        options={{
          title: "Flood Safety",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#3B82F6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="FireSafety"
        options={{
          title: "Fire Safety",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#EF4444",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="FirstAidSafety"
        options={{
          title: "First Aid Safety",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#06D6A0",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="Alarm"
        options={{
          title: "Emergency Alarm",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#FFD166",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Stack>
  );
}
