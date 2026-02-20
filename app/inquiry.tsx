import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Send } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";

export default function InquiryScreen() {
  const router = useRouter();
  const { profile } = useCreator();
  const [form, setForm] = useState({
    brandName: "",
    email: "",
    message: "",
    budget: "",
  });

  const handleSubmit = useCallback(() => {
    if (!form.brandName || !form.email || !form.message) {
      Alert.alert(
        "Missing Fields",
        "Please fill in your brand name, email, and message."
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Notifications.scheduleNotificationAsync({
        content: {
          title: "New Brand Inquiry!",
          body: `${form.brandName} wants to work with you${form.budget ? ` (Budget: ${form.budget})` : ""}.`,
          data: { brandName: form.brandName, email: form.email },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
      }).catch(() => {});
    }
    Alert.alert(
      "Inquiry Sent!",
      `Thanks ${form.brandName}! ${profile.name || "The creator"} will get back to you soon.`,
      [{ text: "Done", onPress: () => router.back() }]
    );
  }, [form, profile.name, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          Work with {profile.name || "this creator"}
        </Text>
        <Text style={styles.subheading}>
          Fill out the form below and they'll get back to you.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Brand / Company Name</Text>
          <TextInput
            style={styles.input}
            value={form.brandName}
            onChangeText={(t) => setForm((p) => ({ ...p, brandName: t }))}
            placeholder="Your brand name"
            placeholderTextColor={Colors.textTertiary}
            testID="inquiry-brand-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
            placeholder="you@brand.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="inquiry-email-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Budget (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.budget}
            onChangeText={(t) => setForm((p) => ({ ...p, budget: t }))}
            placeholder="e.g. $500-$1000"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={form.message}
            onChangeText={(t) => setForm((p) => ({ ...p, message: t }))}
            placeholder="Tell the creator about your project, timeline, and what you're looking for..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            testID="inquiry-message-input"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.85}
          testID="inquiry-submit-btn"
        >
          <Send size={16} color={Colors.white} />
          <Text style={styles.submitText}>Send Inquiry</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
    lineHeight: 21,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 8,
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
  messageInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
