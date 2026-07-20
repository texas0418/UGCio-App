import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Share,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
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
  Download,
  Upload,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { showAlert } from "@/utils/alert";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useCreator } from "@/contexts/CreatorContext";
import {
  scheduleWeeklyDigest,
  cancelWeeklyDigest,
  cancelAllDealNotifications,
} from "@/utils/notifications";

const NOTIFICATION_PREFS_KEY = "notification_preferences";

interface NotificationPrefs {
  dealReminders: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dealReminders: true,
  weeklyDigest: true,
};

// Everything that makes up the user's business data. Deliberately excludes
// trial/subscription markers and device-local flags.
const BACKUP_KEYS = [
  "creator_profile",
  "creator_portfolio",
  "creator_deliverables",
  "creator_deals",
  "creator_testimonials",
  "creator_analytics",
  "creator_invoices",
  "creator_calendar",
  "notification_preferences",
];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSubscribed, isTrialActive, trialDaysRemaining, price } = useSubscription();
  const { resetOnboarding } = useCreator();
  const [notifPermission, setNotifPermission] = useState<string>("undetermined");
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const handleExportData = useCallback(async () => {
    try {
      const pairs = await AsyncStorage.multiGet(BACKUP_KEYS);
      const data: Record<string, unknown> = {};
      for (const [key, value] of pairs) {
        if (value != null) data[key] = JSON.parse(value);
      }
      const payload = JSON.stringify({
        app: "ugcio",
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      });
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(payload);
        showAlert(
          "Backup Copied",
          "Your backup has been copied to the clipboard as JSON. Paste it somewhere safe — you can restore it later with Import Backup."
        );
      } else {
        await Share.share({ message: payload });
      }
    } catch {
      showAlert("Export Failed", "Could not export your data. Please try again.");
    }
  }, []);

  const handleImportData = useCallback(() => {
    let entries: [string, string][];
    try {
      const parsed = JSON.parse(importText.trim());
      if (parsed?.app !== "ugcio" || typeof parsed?.data !== "object" || !parsed.data) {
        throw new Error("not a backup");
      }
      entries = Object.entries(parsed.data)
        .filter(([key]) => BACKUP_KEYS.includes(key))
        .map(([key, value]) => [key, JSON.stringify(value)]);
      if (entries.length === 0) throw new Error("empty backup");
    } catch {
      showAlert(
        "Invalid Backup",
        "That doesn't look like a UGCio backup. Paste the full JSON exported from Export Backup."
      );
      return;
    }
    showAlert(
      "Restore Backup?",
      "This will replace your current profile, portfolio, rates, deals, and other data with the backup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiSet(entries);
              await queryClient.invalidateQueries();
              setShowImport(false);
              setImportText("");
              showAlert("Backup Restored", "Your data has been restored.");
            } catch {
              showAlert("Import Failed", "Could not restore the backup. Please try again.");
            }
          },
        },
      ]
    );
  }, [importText, queryClient]);

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
      showAlert(
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
      // Persist first: schedule/cancel below re-read the stored prefs.
      savePrefs(updated).then(() => {
        if (key === "weeklyDigest") {
          (value ? scheduleWeeklyDigest() : cancelWeeklyDigest()).catch(() => {});
        } else if (key === "dealReminders" && !value) {
          cancelAllDealNotifications().catch(() => {});
        }
      });
    },
    [prefs]
  );

  const handleResetOnboarding = useCallback(() => {
    showAlert(
      "Reset Onboarding",
      "This will take you back to the onboarding screens now.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            await resetOnboarding();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.back();
          },
        },
      ]
    );
  }, [resetOnboarding, router]);

  const handleClearData = useCallback(() => {
    showAlert(
      "Clear All Data",
      "This will permanently delete your profile, portfolio, rates, deals, and all other data. The app will restart. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            AsyncStorage.getAllKeys()
              .then((keys) => {
                // Never wipe trial/subscription markers — clearing them
                // would restart the 14-day free trial.
                const removable = keys.filter(
                  (k) => k !== "ugcio_trial_start" && k !== "ugcio_subscription_active"
                );
                if (removable.length > 0) {
                  return AsyncStorage.multiRemove(removable);
                }
              })
              .then(() => {
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
                }
                // Reload the JS bundle to fully restart the app
                const { DevSettings } = require("react-native");
                if (DevSettings && DevSettings.reload) {
                  DevSettings.reload();
                } else {
                  // Production fallback
                  showAlert(
                    "Data Cleared",
                    "Please close and reopen the app to complete the reset."
                  );
                }
              })
              .catch(() => {
                showAlert("Error", "Failed to clear data. Please try again.");
              });
          },
        },
      ]
    );
  }, []);

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
        <TouchableOpacity style={styles.row} onPress={handleExportData} activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.successLight }]}>
              <Download size={16} color={Colors.success} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Export Backup</Text>
              <Text style={styles.rowSub}>Save all your data as JSON</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowImport((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
              <Upload size={16} color={Colors.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Import Backup</Text>
              <Text style={styles.rowSub}>Restore from an exported backup</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        {showImport && (
          <View style={styles.importBox}>
            <TextInput
              style={styles.importInput}
              value={importText}
              onChangeText={setImportText}
              placeholder="Paste your backup JSON here..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.importBtn, !importText.trim() && styles.importBtnDisabled]}
              onPress={handleImportData}
              disabled={!importText.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.importBtnText}>Restore Backup</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

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
  importBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  importInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  importBtnDisabled: {
    opacity: 0.5,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
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
