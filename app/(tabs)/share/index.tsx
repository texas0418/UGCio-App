import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import {
  Copy,
  Star,
  Globe,
  Instagram,
  Youtube,
  Linkedin,
  Link2,
  MessageCircle,
  ArrowRight,
  Eye,
  MousePointer,
  FileText,
  Mail,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ExternalLink,
} from "lucide-react-native";
import { publishProfile } from "@/services/publishService";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { AvailabilityStatus } from "@/types";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Instagram: Instagram,
  YouTube: Youtube,
  LinkedIn: Linkedin,
  Website: Globe,
};

const AVAILABILITY_DISPLAY: Record<AvailabilityStatus, { label: string; color: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  available: { label: "Open to Work", color: Colors.success, icon: CheckCircle2 },
  limited: { label: "Limited Spots", color: "#F59E0B", icon: AlertCircle },
  booked: { label: "Fully Booked", color: Colors.danger, icon: Clock },
};

export default function ShareScreen() {
  const router = useRouter();
  const { profile, portfolio, deliverables, analytics, testimonials, incrementAnalytic } = useCreator();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string>("");

  const handlePublish = useCallback(async () => {
    if (isPublishing) return;

    if (!profile.username) {
      Alert.alert("Username Required", "Please set a username in your profile before publishing.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus("Starting...");

    try {
      const result = await publishProfile(
        profile,
        portfolio,
        deliverables,
        testimonials,
        (step) => setPublishStatus(step)
      );

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Published!",
          `Your profile is live at ${result.url}`,
          [
            { text: "Copy Link", onPress: () => Clipboard.setStringAsync(result.url) },
            { text: "Open", onPress: () => Linking.openURL(result.url) },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert("Publish Failed", result.error || "Something went wrong. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setIsPublishing(false);
      setPublishStatus("");
    }
  }, [isPublishing, profile, portfolio, deliverables, testimonials]);

  const shareUrl = useMemo(
    () =>
      profile.username
        ? `ugcio.app/${profile.username}`
        : "ugcio.app/yourname",
    [profile.username]
  );

  const activeDeliverables = useMemo(
    () => deliverables.filter((d) => d.isActive),
    [deliverables]
  );

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(`https://${shareUrl}`);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Copied!", "Your link has been copied to clipboard.");
  }, [shareUrl, scaleAnim]);

  const handleCopyMediaKit = useCallback(async () => {
    const lines: string[] = [];
    lines.push("═══════════════════════════════");
    lines.push(`${profile.name || "Creator"} — Media Kit`);
    lines.push("═══════════════════════════════");
    lines.push("");
    if (profile.bio) lines.push(profile.bio);
    lines.push("");

    const avail = AVAILABILITY_DISPLAY[profile.availability ?? "available"];
    lines.push(`Status: ${avail.label}`);
    if (profile.bookedUntil && profile.availability === "booked") {
      lines.push(`Booked until: ${profile.bookedUntil}`);
    }
    lines.push("");

    if (profile.niches.length > 0) {
      lines.push(`Niches: ${profile.niches.join(", ")}`);
      lines.push("");
    }

    if (activeDeliverables.length > 0) {
      lines.push("SERVICES & RATES");
      lines.push("───────────────────────────────");
      activeDeliverables.forEach((d) => {
        lines.push(`${d.title} — $${d.price}`);
        if (d.description) lines.push(`  ${d.description}`);
      });
      lines.push("");
    }

    if (testimonials.length > 0) {
      lines.push("TESTIMONIALS");
      lines.push("───────────────────────────────");
      testimonials.slice(0, 3).forEach((t) => {
        lines.push(`"${t.content}" — ${t.brandName}`);
      });
      lines.push("");
    }

    lines.push(`Portfolio: ${portfolio.length} pieces`);
    lines.push("");

    if (profile.socialLinks.length > 0) {
      lines.push("SOCIALS");
      profile.socialLinks.forEach((l) => {
        lines.push(`${l.platform}: ${l.url}`);
      });
      lines.push("");
    }

    lines.push(`Link: https://${shareUrl}`);

    await Clipboard.setStringAsync(lines.join("\n"));
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Media Kit Copied!", "Your full media kit text has been copied to clipboard. Paste it anywhere.");
  }, [profile, activeDeliverables, testimonials, portfolio, shareUrl]);

  const simulateView = useCallback(() => {
    incrementAnalytic("totalViews");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [incrementAnalytic]);

  const profileComplete = useMemo(() => {
    let score = 0;
    if (profile.name) score += 20;
    if (profile.username) score += 20;
    if (profile.bio) score += 20;
    if (profile.avatarUrl) score += 15;
    if (profile.niches.length > 0) score += 10;
    if (portfolio.length > 0) score += 10;
    if (activeDeliverables.length > 0) score += 5;
    return Math.min(score, 100);
  }, [profile, portfolio, activeDeliverables]);

  const completionItems = useMemo(() => {
    return [
      { label: "Add your name", done: !!profile.name },
      { label: "Set a username", done: !!profile.username },
      { label: "Write a bio", done: !!profile.bio },
      { label: "Upload a headshot", done: !!profile.avatarUrl },
      { label: "Select niches", done: profile.niches.length > 0 },
      { label: "Add portfolio work", done: portfolio.length > 0 },
      { label: "Set your rates", done: activeDeliverables.length > 0 },
    ];
  }, [profile, portfolio, activeDeliverables]);

  const last7Days = useMemo(() => {
    const days: { date: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const existing = analytics.viewsByDay.find((v) => v.date === dateStr);
      days.push({ date: dateStr, views: existing?.views ?? 0 });
    }
    return days;
  }, [analytics.viewsByDay]);

  const maxViews = useMemo(() => Math.max(...last7Days.map((d) => d.views), 1), [last7Days]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[styles.linkCard, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.linkGlow} />
        <View style={styles.linkCardInner}>
          <Text style={styles.linkLabel}>YOUR UGCIO LINK</Text>
          <Text style={styles.linkUrl}>{shareUrl}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.8}
            testID="copy-link-btn"
          >
            <Copy size={16} color={Colors.white} />
            <Text style={styles.copyButtonText}>Copy Link</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
        onPress={handlePublish}
        activeOpacity={0.8}
        disabled={isPublishing}
      >
        {isPublishing ? (
          <>
            <ActivityIndicator size="small" color={Colors.white} />
            <View style={styles.publishInfo}>
              <Text style={styles.publishTitle}>Publishing...</Text>
              <Text style={styles.publishSub}>{publishStatus}</Text>
            </View>
          </>
        ) : (
          <>
            <Upload size={18} color={Colors.white} />
            <View style={styles.publishInfo}>
              <Text style={styles.publishTitle}>Publish to Website</Text>
              <Text style={styles.publishSub}>Go live at ugcio.app/{profile.username || "yourname"}</Text>
            </View>
            <ExternalLink size={16} color={Colors.textTertiary} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.analyticsSection}>
        <View style={styles.analyticsSectionHeader}>
          <View style={styles.analyticsHeaderLeft}>
            <BarChart3 size={16} color={Colors.accent} />
            <Text style={styles.analyticsSectionTitle}>Analytics</Text>
          </View>
          <TouchableOpacity onPress={simulateView} style={styles.simBtn} activeOpacity={0.7}>
            <Text style={styles.simBtnText}>Simulate View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Eye size={18} color="#60A5FA" />
            <Text style={styles.analyticsValue}>{analytics.totalViews}</Text>
            <Text style={styles.analyticsLabel}>Link Views</Text>
          </View>
          <View style={styles.analyticsCard}>
            <MousePointer size={18} color={Colors.primary} />
            <Text style={styles.analyticsValue}>{analytics.portfolioClicks}</Text>
            <Text style={styles.analyticsLabel}>Portfolio Clicks</Text>
          </View>
          <View style={styles.analyticsCard}>
            <FileText size={18} color={Colors.accent} />
            <Text style={styles.analyticsValue}>{analytics.rateCardViews}</Text>
            <Text style={styles.analyticsLabel}>Rate Views</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Mail size={18} color={Colors.success} />
            <Text style={styles.analyticsValue}>{analytics.inquiries}</Text>
            <Text style={styles.analyticsLabel}>Inquiries</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Last 7 Days</Text>
          <View style={styles.chartBars}>
            {last7Days.map((day) => {
              const height = Math.max((day.views / maxViews) * 60, 4);
              const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
              return (
                <View key={day.date} style={styles.chartBarCol}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height,
                        backgroundColor: day.views > 0 ? Colors.primary : Colors.surfaceElevated,
                      },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.mediaKitBtn}
        onPress={handleCopyMediaKit}
        activeOpacity={0.8}
      >
        <FileText size={18} color={Colors.accent} />
        <View style={styles.mediaKitInfo}>
          <Text style={styles.mediaKitTitle}>Export Media Kit</Text>
          <Text style={styles.mediaKitSub}>Copy your full profile as shareable text</Text>
        </View>
        <Copy size={16} color={Colors.textTertiary} />
      </TouchableOpacity>

      {profileComplete < 100 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Star size={16} color={Colors.primary} />
            <Text style={styles.progressTitle}>
              {profileComplete}% complete
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${profileComplete}%` }]}
            />
          </View>
          <View style={styles.checklistWrap}>
            {completionItems.filter((i) => !i.done).slice(0, 3).map((item) => (
              <View key={item.label} style={styles.checkItem}>
                <ArrowRight size={12} color={Colors.textTertiary} />
                <Text style={styles.checkItemText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.previewTitle}>Brand Preview</Text>
      <Text style={styles.previewSubtitle}>
        What brands see when they open your link
      </Text>

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View style={styles.previewAvatarContainer}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.previewAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.previewAvatarPlaceholder}>
                <Text style={styles.previewAvatarInitial}>
                  {profile.name ? profile.name[0]?.toUpperCase() : "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.previewName}>
            {profile.name || "Your Name"}
          </Text>
          {profile.username ? (
            <Text style={styles.previewHandle}>@{profile.username}</Text>
          ) : null}

          {profile.availability && (
            <View style={[styles.previewAvailBadge, { backgroundColor: `${AVAILABILITY_DISPLAY[profile.availability].color}18` }]}>
              {React.createElement(AVAILABILITY_DISPLAY[profile.availability].icon, {
                size: 12,
                color: AVAILABILITY_DISPLAY[profile.availability].color,
              })}
              <Text style={[styles.previewAvailText, { color: AVAILABILITY_DISPLAY[profile.availability].color }]}>
                {AVAILABILITY_DISPLAY[profile.availability].label}
                {profile.availability === "booked" && profile.bookedUntil ? ` until ${profile.bookedUntil}` : ""}
              </Text>
            </View>
          )}

          <Text style={styles.previewBio}>
            {profile.bio || "Your bio will appear here..."}
          </Text>

          {profile.niches.length > 0 && (
            <View style={styles.previewTags}>
              {profile.niches.slice(0, 4).map((n) => (
                <View key={n} style={styles.previewTag}>
                  <Text style={styles.previewTagText}>{n}</Text>
                </View>
              ))}
            </View>
          )}

          {profile.socialLinks.length > 0 && (
            <View style={styles.previewSocials}>
              {profile.socialLinks.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform] || Link2;
                return (
                  <View key={link.id} style={styles.previewSocialIcon}>
                    <Icon size={14} color={Colors.textSecondary} />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {testimonials.length > 0 && (
          <View style={styles.previewTestimonials}>
            <Text style={styles.previewSectionTitle}>What Brands Say</Text>
            {testimonials.slice(0, 2).map((t) => (
              <View key={t.id} style={styles.previewTestimonialItem}>
                <Text style={styles.previewTestimonialText}>"{t.content}"</Text>
                <Text style={styles.previewTestimonialBrand}>— {t.brandName}</Text>
              </View>
            ))}
          </View>
        )}

        {portfolio.length > 0 && (
          <View style={styles.previewPortfolio}>
            <Text style={styles.previewSectionTitle}>Recent Work</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewPortfolioRow}
            >
              {portfolio.slice(0, 6).map((item) => (
                <View key={item.id} style={styles.previewPortfolioItem}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.previewPortfolioImage}
                    contentFit="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {activeDeliverables.length > 0 && (
          <View style={styles.previewRates}>
            <Text style={styles.previewSectionTitle}>Services & Rates</Text>
            {activeDeliverables.map((d) => (
              <View key={d.id} style={styles.previewRateItem}>
                <View style={styles.previewRateInfo}>
                  <Text style={styles.previewRateTitle}>{d.title}</Text>
                  <Text style={styles.previewRateDesc} numberOfLines={1}>
                    {d.description}
                  </Text>
                </View>
                <Text style={styles.previewRatePrice}>${d.price}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={() => router.push("/inquiry" as never)}>
          <MessageCircle size={18} color={Colors.white} />
          <Text style={styles.ctaButtonText}>Work With Me</Text>
        </TouchableOpacity>
      </View>

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
  linkCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  linkGlow: {
    position: "absolute",
    top: -40,
    left: "25%",
    width: "50%",
    height: 80,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    borderRadius: 100,
  },
  linkCardInner: {
    padding: 28,
    alignItems: "center",
  },
  linkLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 10,
    fontWeight: "600" as const,
  },
  linkUrl: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 20,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  analyticsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyticsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  analyticsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analyticsSectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  simBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  analyticsCard: {
    width: "48%" as unknown as number,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  analyticsValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  analyticsLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  chartSection: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
  },
  chartBarCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  chartBar: {
    width: 20,
    borderRadius: 6,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishInfo: {
    flex: 1,
  },
  publishTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  publishSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  mediaKitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaKitInfo: {
    flex: 1,
  },
  mediaKitTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  mediaKitSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  checklistWrap: {
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  previewAvatarContainer: {
    marginBottom: 14,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  previewAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarInitial: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  previewName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  previewHandle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  previewAvailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  previewAvailText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  previewBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  previewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  previewTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  previewSocials: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  previewSocialIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTestimonials: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewSectionTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  previewTestimonialItem: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  previewTestimonialText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic" as const,
    lineHeight: 19,
    marginBottom: 6,
  },
  previewTestimonialBrand: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "600" as const,
  },
  previewPortfolio: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewPortfolioRow: {
    gap: 6,
  },
  previewPortfolioItem: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
  },
  previewPortfolioImage: {
    width: "100%",
    height: "100%",
  },
  previewRates: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewRateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewRateInfo: {
    flex: 1,
    marginRight: 12,
  },
  previewRateTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  previewRateDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  previewRatePrice: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
