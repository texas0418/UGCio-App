import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Calendar" }} />
    </Stack>
  );
}
