import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../src/DataContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="racer-form"
            options={{ presentation: "modal", title: "Racer" }}
          />
          <Stack.Screen
            name="competition-new"
            options={{ presentation: "modal", title: "New Competition" }}
          />
          <Stack.Screen
            name="competition/[id]/index"
            options={{ title: "Competition" }}
          />
          <Stack.Screen
            name="competition/[id]/race-new"
            options={{ presentation: "modal", title: "Add Race" }}
          />
        </Stack>
      </DataProvider>
    </SafeAreaProvider>
  );
}
