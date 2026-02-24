import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  Crown,
  Check,
  Sparkles,
  DollarSign,
  Briefcase,
  Send,
  FileText,
  RotateCcw,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FEATURES = [
  { icon: Sparkles, label: "Unlimited portfolio items", color: Colors.primary },
  { icon: DollarSign, label: "Custom rate cards & templates", color: Colors.success },
  { icon: Briefcase, label: "Deal tracking & pipeline", color: Colors.accent },
  { icon: FileText, label: "Professional invoicing", color: "#60A5FA" },
  { icon: Send, label: "Shareable creator link", color: "#F59E0B" },
];

export default function PaywallScreen() {
  const { price, purchaseSubscription, restorePurchases, trialDaysRemaining } =
    useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = useCallback(async () => {
    setIsPurchasing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await purchaseSubscription();
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error?.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [purchaseSubscription]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Restored!", "Your subscription has been restored.", [{ text: "OK" }]);
    } catch (error: any) {
      Alert.alert(
        "No Subscription Found",
        "We couldn't find an active subscription for this Apple ID. If you believe this is an error, contact support@ugcio.app.",
        [{ text: "OK" }]
      );
    } finally {
      setIsRestoring(false);
    }
  }, [restorePurchases]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 118, 77, 0.12)", "rgba(167, 139, 250, 0.06)", "transparent"]}
        style={styles.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <View style={styles.iconInner}>
            <Crown size={36} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Go Pro with UGCio</Text>
        <Text style={styles.subtitle}>
          Your free trial has ended. Subscribe to keep using all
          features and grow your UGC business.
        </Text>

        <View style={styles.featuresCard}>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}18` }]}>
                  <Icon size={16} color={feature.color} />
                </View>
                <Text style={styles.featureText}>{feature.label}</Text>
                <Check size={16} color={Colors.success} />
              </View>
            );
          })}
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Monthly</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{price.replace("/month", "")}</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.priceNote}>Cancel anytime. No commitment.</Text>
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          ) : (
            <View style={styles.restoreRow}>
              <RotateCcw size={14} color={Colors.textSecondary} />
              <Text style={styles.restoreBtnText}>Restore Purchase</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment will be charged to your Apple ID account at confirmation of
          purchase. Subscription automatically renews unless it is canceled at
          least 24 hours before the end of the current period. Your account will
          be charged for renewal within 24 hours prior to the end of the current
          period. You can manage and cancel your subscriptions by going to your
          account settings on the App Store after purchase.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://ugcio.app/terms")}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>|</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://ugcio.app/privacy")}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255, 118, 77, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  featuresCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  priceCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: Colors.primary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.text,
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  priceNote: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  subscribeBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  restoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  restoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  restoreBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  legal: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  legalDivider: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
