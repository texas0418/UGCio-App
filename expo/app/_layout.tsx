import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CreatorProvider } from "@/contexts/CreatorContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Colors from "@/constants/colors";

import { initNotifications } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

// Explicit close for modal screens — otherwise they can only be swiped down.
function ModalCloseButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ padding: 4 }}
    >
      <X size={22} color={Colors.text} />
    </TouchableOpacity>
  );
}

const modalOptions = (title: string) => ({
  presentation: "modal" as const,
  title,
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.text,
  headerLeft: () => <ModalCloseButton />,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { color: Colors.text },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="inquiry" options={modalOptions("Work With Me")} />
      <Stack.Screen name="invoice" options={modalOptions("Create Invoice")} />
      <Stack.Screen name="settings" options={modalOptions("Settings")} />
      <Stack.Screen name="about" options={modalOptions("About & Help")} />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

async function registerForNotifications() {
  if (Platform.OS === "web") return;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    // Permission status: finalStatus
  } catch (e) {
    // Notification registration failed silently
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    registerForNotifications();
    initNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <CreatorProvider>
          <SubscriptionProvider>
            <RootLayoutNav />
          </SubscriptionProvider>
        </CreatorProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
