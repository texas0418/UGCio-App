import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import React from "react";

export default function DealsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { color: Colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Deals" }} />
    </Stack>
  );
}
