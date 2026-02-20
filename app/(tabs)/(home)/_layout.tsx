import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Settings } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function HomeLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: "700" as const, color: Colors.text },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/settings" as never)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <Settings size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
