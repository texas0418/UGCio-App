import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  Camera,
  Plus,
  X,
  Instagram,
  Globe,
  Linkedin,
  Youtube,
  Link2,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Quote,
  Trash2,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { NICHE_CATEGORIES, SOCIAL_PLATFORMS } from "@/mocks/categories";
import { SocialLink, Testimonial, AvailabilityStatus } from "@/types";

const PLATFORM_CONFIG: Record<string, { icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }> = {
  Instagram: { icon: Instagram, color: "#E4405F", bg: "rgba(228, 64, 95, 0.12)" },
  TikTok: { icon: Globe, color: "#00F2EA", bg: "rgba(0, 242, 234, 0.12)" },
  YouTube: { icon: Youtube, color: "#FF0000", bg: "rgba(255, 0, 0, 0.10)" },
  "Twitter/X": { icon: Globe, color: "#1DA1F2", bg: "rgba(29, 161, 242, 0.12)" },
  LinkedIn: { icon: Linkedin, color: "#0A66C2", bg: "rgba(10, 102, 194, 0.12)" },
  Website: { icon: Globe, color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)" },
};

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }[] = [
  { value: "available", label: "Open to Work", icon: CheckCircle2, color: Colors.success, bg: Colors.successLight },
  { value: "limited", label: "Limited Spots", icon: AlertCircle, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  { value: "booked", label: "Fully Booked", icon: Clock, color: Colors.danger, bg: Colors.dangerLight },
];

let _hasRedirectedToOnboarding = false;
let _hasRedirectedToPaywall = false;

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, testimonials, addTestimonial, removeTestimonial, hasOnboarded, isLoading } = useCreator();
  const { isSubscribed, isTrialActive, trialExpired, trialDaysRemaining, isLoading: subLoading } = useSubscription();

  useEffect(() => {
    if (!isLoading && !hasOnboarded && !_hasRedirectedToOnboarding) {
      _hasRedirectedToOnboarding = true;
      router.replace("/onboarding" as never);
    }
  }, [isLoading, hasOnboarded, router]);

  // Redirect to paywall if trial expired and not subscribed
  useEffect(() => {
    if (!isLoading && !subLoading && hasOnboarded && trialExpired && !isSubscribed && !_hasRedirectedToPaywall) {
      _hasRedirectedToPaywall = true;
      router.push("/paywall" as never);
    }
  }, [isLoading, subLoading, hasOnboarded, trialExpired, isSubscribed, router]);
  const [showNichePicker, setShowNichePicker] = useState(false);
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [newTestimonial, setNewTestimonial] = useState({ brandName: "", content: "", rating: 5 });

  const pickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUrl: result.assets[0].uri });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [updateProfile]);

  const toggleNiche = useCallback(
    (niche: string) => {
      const current = profile.niches;
      const updated = current.includes(niche)
        ? current.filter((n) => n !== niche)
        : [...current, niche];
      updateProfile({ niches: updated });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [profile.niches, updateProfile]
  );

  const addSocialLink = useCallback(() => {
    if (!newSocialPlatform || !newSocialUrl) {
      Alert.alert("Missing Info", "Please select a platform and enter a URL.");
      return;
    }
    const link: SocialLink = {
      id: Date.now().toString(),
      platform: newSocialPlatform,
      url: newSocialUrl,
    };
    updateProfile({ socialLinks: [...profile.socialLinks, link] });
    setNewSocialPlatform("");
    setNewSocialUrl("");
    setShowSocialForm(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [newSocialPlatform, newSocialUrl, profile.socialLinks, updateProfile]);

  const removeSocialLink = useCallback(
    (id: string) => {
      updateProfile({
        socialLinks: profile.socialLinks.filter((l) => l.id !== id),
      });
    },
    [profile.socialLinks, updateProfile]
  );

  const setAvailability = useCallback(
    (status: AvailabilityStatus) => {
      updateProfile({ availability: status });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [updateProfile]
  );

  const handleAddTestimonial = useCallback(() => {
    if (!newTestimonial.brandName || !newTestimonial.content) {
      Alert.alert("Missing Info", "Please enter the brand name and testimonial.");
      return;
    }
    const item: Testimonial = {
      id: Date.now().toString(),
      brandName: newTestimonial.brandName,
      content: newTestimonial.content,
      rating: newTestimonial.rating,
      createdAt: new Date().toISOString(),
    };
    addTestimonial(item);
    setNewTestimonial({ brandName: "", content: "", rating: 5 });
    setShowTestimonialForm(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [newTestimonial, addTestimonial]);

  const confirmRemoveTestimonial = useCallback(
    (id: string) => {
      Alert.alert("Remove Testimonial", "Remove this testimonial?", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeTestimonial(id) },
      ]);
    },
    [removeTestimonial]
  );

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            disabled={!interactive}
            onPress={() => interactive && setNewTestimonial((p) => ({ ...p, rating: i }))}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Star
              size={interactive ? 22 : 14}
              color={i <= rating ? "#F59E0B" : Colors.border}
              fill={i <= rating ? "#F59E0B" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={pickAvatar}
          style={styles.avatarContainer}
          activeOpacity={0.8}
          testID="avatar-picker"
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={30} color={Colors.textTertiary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Camera size={13} color={Colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to add headshot</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Availability</Text>
        <View style={styles.availabilityRow}>
          {AVAILABILITY_OPTIONS.map((opt) => {
            const isActive = profile.availability === opt.value;
            const IconComp = opt.icon;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.availabilityChip,
                  isActive && { backgroundColor: opt.bg, borderColor: opt.color },
                ]}
                onPress={() => setAvailability(opt.value)}
                activeOpacity={0.7}
              >
                <IconComp size={14} color={isActive ? opt.color : Colors.textTertiary} />
                <Text
                  style={[
                    styles.availabilityText,
                    isActive && { color: opt.color, fontWeight: "700" as const },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {profile.availability === "booked" && (
          <View style={styles.bookedDateRow}>
            <Text style={styles.bookedLabel}>Booked until</Text>
            <TextInput
              style={styles.bookedInput}
              value={profile.bookedUntil ?? ""}
              onChangeText={(text) => updateProfile({ bookedUntil: text })}
              placeholder="e.g. March 15"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(text) => updateProfile({ name: text })}
          placeholder="Your name"
          placeholderTextColor={Colors.textTertiary}
          testID="name-input"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Username</Text>
        <View style={styles.usernameRow}>
          <View style={styles.prefixBadge}>
            <Text style={styles.usernamePrefix}>ugcio.app/</Text>
          </View>
          <TextInput
            style={[styles.input, styles.usernameInput]}
            value={profile.username}
            onChangeText={(text) =>
              updateProfile({ username: text.toLowerCase().replace(/[^a-z0-9_]/g, "") })
            }
            placeholder="yourname"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            testID="username-input"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={profile.bio}
          onChangeText={(text) => updateProfile({ bio: text })}
          placeholder="Tell brands about you and your content style..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          testID="bio-input"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.sectionLabel}>Niches</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowNichePicker(!showNichePicker)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.editBtn}
          >
            <Text style={styles.toggleText}>
              {showNichePicker ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
        {profile.niches.length > 0 && !showNichePicker && (
          <View style={styles.tagRow}>
            {profile.niches.map((niche) => (
              <View key={niche} style={styles.tagActive}>
                <Text style={styles.tagActiveText}>{niche}</Text>
              </View>
            ))}
          </View>
        )}
        {showNichePicker && (
          <View style={styles.tagRow}>
            {NICHE_CATEGORIES.map((cat) => {
              const isSelected = profile.niches.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tag, isSelected && styles.tagActive]}
                  onPress={() => toggleNiche(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.tagText, isSelected && styles.tagActiveText]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {profile.niches.length === 0 && !showNichePicker && (
          <Text style={styles.emptyHint}>Tap Edit to select your niches</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Social Links</Text>
          <TouchableOpacity
            onPress={() => setShowSocialForm(!showSocialForm)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addIconBtn}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.socialGrid}>
          {profile.socialLinks.map((link) => {
            const config = PLATFORM_CONFIG[link.platform] ?? { icon: Link2, color: Colors.textSecondary, bg: Colors.surfaceElevated };
            const IconComp = config.icon;
            return (
              <View key={link.id} style={styles.socialCard}>
                <TouchableOpacity
                  onPress={() => removeSocialLink(link.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.socialRemoveBtn}
                >
                  <X size={12} color={Colors.textTertiary} />
                </TouchableOpacity>
                <View style={[styles.socialIconWrap, { backgroundColor: config.bg }]}>
                  <IconComp size={22} color={config.color} />
                </View>
                <Text style={styles.socialPlatform}>{link.platform}</Text>
                <Text style={styles.socialUrl} numberOfLines={1}>
                  {link.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </Text>
              </View>
            );
          })}
        </View>

        {showSocialForm && (
          <View style={styles.socialForm}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.platformPicker}
            >
              {SOCIAL_PLATFORMS.map((p) => {
                const pConfig = PLATFORM_CONFIG[p] ?? { icon: Link2, color: Colors.textSecondary, bg: Colors.surfaceElevated };
                const PIcon = pConfig.icon;
                const isActive = newSocialPlatform === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.platformChip,
                      isActive && { backgroundColor: pConfig.bg, borderColor: pConfig.color },
                    ]}
                    onPress={() => setNewSocialPlatform(p)}
                  >
                    <PIcon size={14} color={isActive ? pConfig.color : Colors.textTertiary} />
                    <Text
                      style={[
                        styles.platformChipText,
                        isActive && { color: pConfig.color },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={styles.input}
              value={newSocialUrl}
              onChangeText={setNewSocialUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addSocialLink}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {profile.socialLinks.length === 0 && !showSocialForm && (
          <Text style={styles.emptyHint}>
            Add your social profiles so brands can find you
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <Quote size={14} color={Colors.accent} />
            <Text style={styles.sectionLabel}>Testimonials</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowTestimonialForm(!showTestimonialForm)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addIconBtn}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {showTestimonialForm && (
          <View style={styles.testimonialForm}>
            <Text style={styles.fieldLabel}>Brand Name</Text>
            <TextInput
              style={styles.input}
              value={newTestimonial.brandName}
              onChangeText={(t) => setNewTestimonial((p) => ({ ...p, brandName: t }))}
              placeholder="e.g. Nike, Glossier..."
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.fieldLabel}>Their Review</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={newTestimonial.content}
              onChangeText={(t) => setNewTestimonial((p) => ({ ...p, content: t }))}
              placeholder="What did they say about working with you?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.fieldLabel}>Rating</Text>
            {renderStars(newTestimonial.rating, true)}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTestimonial}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Testimonial</Text>
            </TouchableOpacity>
          </View>
        )}

        {testimonials.length > 0 ? (
          <View style={styles.testimonialsList}>
            {testimonials.map((t) => (
              <View key={t.id} style={styles.testimonialCard}>
                <View style={styles.testimonialHeader}>
                  <View style={styles.testimonialBrandWrap}>
                    <View style={styles.testimonialInitial}>
                      <Text style={styles.testimonialInitialText}>
                        {t.brandName[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.testimonialBrand}>{t.brandName}</Text>
                      {renderStars(t.rating)}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmRemoveTestimonial(t.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={14} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.testimonialContent}>"{t.content}"</Text>
              </View>
            ))}
          </View>
        ) : !showTestimonialForm ? (
          <Text style={styles.emptyHint}>
            Add brand testimonials to build social proof
          </Text>
        ) : null}
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
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 10,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  prefixBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usernamePrefix: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  usernameInput: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  tagActiveText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: "600" as const,
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: "italic" as const,
  },
  availabilityRow: {
    flexDirection: "row",
    gap: 8,
  },
  availabilityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availabilityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  bookedDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  bookedLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookedInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  socialCard: {
    width: "48%" as unknown as number,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    position: "relative",
  },
  socialRemoveBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  socialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  socialPlatform: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  socialUrl: {
    fontSize: 11,
    color: Colors.textTertiary,
    maxWidth: "100%",
  },
  socialForm: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformPicker: {
    flexGrow: 0,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  addIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  testimonialForm: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  testimonialsList: {
    gap: 10,
  },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testimonialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testimonialBrandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  testimonialInitial: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  testimonialInitialText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.accent,
  },
  testimonialBrand: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  testimonialContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: "italic" as const,
  },
});
