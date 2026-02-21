import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  Trash2,
  Info,
  HelpCircle,
  ChevronRight,
  Mail,
  Shield,
  RotateCcw,
  Crown,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSubscription } from "@/contexts/SubscriptionContext";

const NOTIFICATION_PREFS_KEY = "notification_preferences";

interface NotificationPrefs {
  dealReminders: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dealReminders: true,
  weeklyDigest: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSubscribed, isTrialActive, trialDaysRemaining, price } = useSubscription();
  const [notifPermission, setNotifPermission] = useState<string>("undetermined");
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs();
    checkNotifPermission();
  }, []);

  const checkNotifPermission = async () => {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.getPermissionsAsync();
    setNotifPermission(status);
  };

  const loadPrefs = async () => {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) setPrefs(JSON.parse(stored));
  };

  const savePrefs = async (updated: NotificationPrefs) => {
    setPrefs(updated);
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
  };

  const requestNotifPermission = async () => {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifPermission(status);
    if (status !== "granted") {
      Alert.alert(
        "Notifications Disabled",
        "To enable notifications, go to Settings > UGCio and turn on notifications.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleTogglePref = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const updated = { ...prefs, [key]: value };
      savePrefs(updated);
    },
    [prefs]
  );

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "This will show the onboarding screens again next time you open the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            await AsyncStorage.setItem("creator_onboarded", "false");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Done", "Onboarding will show on next app launch.");
          },
        },
      ]
    );
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete your profile, portfolio, rates, deals, and all other data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all persisted data
              await AsyncStorage.clear();
              // Reset the query cache completely
              queryClient.removeQueries();
              // Refetch all queries so they return defaults
              await queryClient.refetchQueries();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );
              }
              // Navigate to onboarding — the home screen's module-level
              // redirect flags won't fire again, so go directly
              router.replace("/onboarding" as never);
            } catch (e) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  }, [queryClient, router]);

  const notificationsEnabled = notifPermission === "granted";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Subscription Section */}
      <Text style={styles.sectionHeader}>Subscription</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Crown size={16} color={Colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {isSubscribed ? "UGCio Pro" : isTrialActive ? "Free Trial" : "Not Subscribed"}
              </Text>
              <Text style={styles.rowSub}>
                {isSubscribed
                  ? `Active — ${price}`
                  : isTrialActive
                  ? `${trialDaysRemaining} days remaining`
                  : "Trial expired"}
              </Text>
            </View>
          </View>
          {isSubscribed ? (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledBadgeText}>Pro</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enableBtn}
              onPress={() => router.push("/paywall" as never)}
            >
              <Text style={styles.enableBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
        {isSubscribed && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL("https://apps.apple.com/account/subscriptions")}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Manage Subscription</Text>
                  <Text style={styles.rowSub}>Change or cancel in App Store</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Notifications Section */}
      <Text style={styles.sectionHeader}>Notifications</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primaryLight }]}>
              {notificationsEnabled ? (
                <Bell size={16} color={Colors.primary} />
              ) : (
                <BellOff size={16} color={Colors.primary} />
              )}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>
                {notificationsEnabled ? "Enabled" : "Disabled — tap to enable"}
              </Text>
            </View>
          </View>
          {notificationsEnabled ? (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledBadgeText}>On</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enableBtn}
              onPress={requestNotifPermission}
            >
              <Text style={styles.enableBtnText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {notificationsEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Deal Reminders</Text>
                  <Text style={styles.rowSub}>Get notified about deal follow-ups</Text>
                </View>
              </View>
              <Switch
                value={prefs.dealReminders}
                onValueChange={(v) => handleTogglePref("dealReminders", v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.dealReminders ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Weekly Digest</Text>
                  <Text style={styles.rowSub}>Summary of views and inquiries</Text>
                </View>
              </View>
              <Switch
                value={prefs.weeklyDigest}
                onValueChange={(v) => handleTogglePref("weeklyDigest", v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.weeklyDigest ? Colors.primary : Colors.textTertiary}
              />
            </View>
          </>
        )}
      </View>

      {/* Support Section */}
      <Text style={styles.sectionHeader}>Support</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/about" as never)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
              <Info size={16} color={Colors.accent} />
            </View>
            <Text style={styles.rowTitle}>About UGCio</Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL("mailto:support@ugcio.app")}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.successLight }]}>
              <Mail size={16} color={Colors.success} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Contact Support</Text>
              <Text style={styles.rowSub}>support@ugcio.app</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL("https://texas0418.github.io/UGCio-App/privacy/")}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(96, 165, 250, 0.12)" }]}>
              <Shield size={16} color="#60A5FA" />
            </View>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Data Section */}
      <Text style={styles.sectionHeader}>Data</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleResetOnboarding}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
              <RotateCcw size={16} color="#F59E0B" />
            </View>
            <Text style={styles.rowTitle}>Reset Onboarding</Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={handleClearData}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.dangerLight }]}>
              <Trash2 size={16} color={Colors.danger} />
            </View>
            <Text style={[styles.rowTitle, { color: Colors.danger }]}>Clear All Data</Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>UGCio v1.0.0</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 64,
  },
  enableBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enableBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  enabledBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enabledBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});
