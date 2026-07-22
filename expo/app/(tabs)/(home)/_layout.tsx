import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Settings } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSubscription } from "@/contexts/SubscriptionContext";

function TrialBadge() {
  const { isTrialActive, trialDaysRemaining, isSubscribed } = useSubscription();

  if (isSubscribed || !isTrialActive) return null;

  return (
    <View style={styles.trialBadge}>
      <Text style={styles.trialText}>
        {trialDaysRemaining}d left
      </Text>
    </View>
  );
}

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
            <View style={styles.headerRight}>
              <TrialBadge />
              <TouchableOpacity
                onPress={() => router.push("/settings" as never)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Settings size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 4,
  },
  trialBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  trialText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
});
