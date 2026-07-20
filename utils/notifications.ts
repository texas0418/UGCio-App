import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { BrandDeal } from "@/types";

const NOTIFICATION_PREFS_KEY = "notification_preferences";

interface NotificationPrefs {
  dealReminders: boolean;
  weeklyDigest: boolean;
}

async function getPrefs(): Promise<NotificationPrefs> {
  const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
  if (stored) return JSON.parse(stored);
  return { dealReminders: true, weeklyDigest: true };
}

async function hasPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

const dealReminderId = (dealId: string) => `deal_reminder_${dealId}`;
const dealStaleId = (dealId: string) => `deal_stale_${dealId}`;

/**
 * Schedule a deal follow-up reminder for 24 hours from now
 */
export async function scheduleDealReminder(deal: BrandDeal): Promise<void> {
  const permitted = await hasPermission();
  if (!permitted) return;

  const prefs = await getPrefs();
  if (!prefs.dealReminders) return;

  await Notifications.scheduleNotificationAsync({
    identifier: dealReminderId(deal.id),
    content: {
      title: "Deal Follow-up 🤝",
      body: `Time to follow up with ${deal.brandName}! Keep the momentum going.`,
      data: { dealId: deal.id, type: "deal_reminder" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24, // 24 hours
    },
  });
}

/**
 * Schedule a reminder when a deal has been in the same stage for 3 days
 */
export async function scheduleDealStaleReminder(deal: BrandDeal): Promise<void> {
  const permitted = await hasPermission();
  if (!permitted) return;

  const prefs = await getPrefs();
  if (!prefs.dealReminders) return;

  const statusLabels: Record<string, string> = {
    new: "New",
    in_talks: "In Talks",
    contracted: "Contracted",
    delivered: "Delivered",
  };

  // The user just acted on the deal, so the 24h follow-up nudge is obsolete —
  // and a paid deal needs no further reminders at all.
  await Notifications.cancelScheduledNotificationAsync(dealReminderId(deal.id)).catch(() => {});
  if (deal.status === "paid") {
    await Notifications.cancelScheduledNotificationAsync(dealStaleId(deal.id)).catch(() => {});
    return;
  }

  // Re-using the identifier replaces any pending stale reminder, so status
  // changes don't stack one notification per stage.
  await Notifications.scheduleNotificationAsync({
    identifier: dealStaleId(deal.id),
    content: {
      title: "Deal needs attention 📋",
      body: `Your deal with ${deal.brandName} has been "${statusLabels[deal.status] || deal.status}" for a while. Ready to move it forward?`,
      data: { dealId: deal.id, type: "deal_stale" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 3, // 3 days
    },
  });
}

/**
 * Cancel all pending notifications for a deal (call when the deal is removed)
 */
export async function cancelDealNotifications(dealId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(dealReminderId(dealId)).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(dealStaleId(dealId)).catch(() => {});
}

/**
 * Cancel every pending deal reminder (call when the pref is toggled off)
 */
export async function cancelAllDealNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith("deal_"))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // best effort
  }
}

/**
 * Schedule a weekly digest notification (every Monday at 9am)
 */
export async function scheduleWeeklyDigest(): Promise<void> {
  const permitted = await hasPermission();
  if (!permitted) return;

  const prefs = await getPrefs();
  if (!prefs.weeklyDigest) return;

  // Cancel existing weekly digest first
  await cancelWeeklyDigest();

  await Notifications.scheduleNotificationAsync({
    identifier: "weekly_digest",
    content: {
      title: "Your Weekly UGCio Recap 📊",
      body: "Check out your portfolio views, inquiries, and deal progress from this week!",
      data: { type: "weekly_digest" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Cancel all weekly digest notifications
 */
export async function cancelWeeklyDigest(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync("weekly_digest").catch(() => {});
}

/**
 * Send an immediate local notification (for testing or instant alerts)
 */
export async function sendInstantNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const permitted = await hasPermission();
  if (!permitted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Immediate
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Initialize notification scheduling (call on app start)
 */
export async function initNotifications(): Promise<void> {
  const permitted = await hasPermission();
  if (!permitted) return;

  const prefs = await getPrefs();
  if (prefs.weeklyDigest) {
    await scheduleWeeklyDigest();
  }
}
