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
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Send, Mail } from "lucide-react-native";
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

  const handleSubmit = useCallback(async () => {
    if (!form.brandName || !form.email || !form.message) {
      Alert.alert(
        "Missing Fields",
        "Please fill in your brand name, email, and message."
      );
      return;
    }

    if (!profile.contactEmail) {
      Alert.alert(
        "No Contact Email",
        "The creator hasn't set up their contact email yet."
      );
      return;
    }

    // Build the mailto URL
    const subject = encodeURIComponent(
      `UGCio Inquiry from ${form.brandName}`
    );
    const body = encodeURIComponent(
      `Hi ${profile.name || "there"},\n\n` +
      `I'm ${form.brandName} and I'd love to work with you!\n\n` +
      `${form.budget ? `Budget: ${form.budget}\n\n` : ""}` +
      `${form.message}\n\n` +
      `---\n` +
      `From: ${form.brandName}\n` +
      `Email: ${form.email}\n` +
      `Sent via UGCio`
    );

    const mailto = `mailto:${profile.contactEmail}?subject=${subject}&body=${body}&cc=${encodeURIComponent(form.email)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Alert.alert(
          "No Email App",
          "No email app is available. Please email the creator directly at: " + profile.contactEmail
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Could not open email. You can reach the creator at: " + profile.contactEmail
      );
    }
  }, [form, profile.name, profile.contactEmail]);

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
          Fill out the form and we'll open an email ready to send.
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
          <Text style={styles.label}>Your Email</Text>
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
          <Mail size={16} color={Colors.white} />
          <Text style={styles.submitText}>Open Email</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          This will open your email app with a pre-filled message to {profile.name || "the creator"}.
        </Text>
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
  footnote: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
