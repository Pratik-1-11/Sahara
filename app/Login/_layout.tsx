import { Stack } from "expo-router";

export default function LoginLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="UserLogin"
        options={{ title: "User Login", headerShown: false }}
      />
    </Stack>
  );
}
