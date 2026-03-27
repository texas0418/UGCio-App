import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import {
  Globe,
  Mail,
  Shield,
  FileText,
  Heart,
  Zap,
  Camera,
  DollarSign,
  Briefcase,
  Send,
  ChevronDown,
} from "lucide-react-native";
import Colors from "@/constants/colors";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I share my portfolio with brands?",
    answer:
      "Go to the Share tab to get your unique link. You can copy it and paste it anywhere — Instagram bio, email pitches, LinkedIn, or DMs. Brands will see your profile, portfolio, rates, and an inquiry form.",
  },
  {
    question: "Can I customize my rate card?",
    answer:
      "Yes! In the Rates tab, you can add custom deliverables, use pre-built templates by niche, toggle items on/off, and export your rate card as shareable text.",
  },
  {
    question: "How does deal tracking work?",
    answer:
      "The Deals tab lets you track brand partnerships through stages: New → In Talks → Contracted → Delivered → Paid. You can also create invoices directly from each deal.",
  },
  {
    question: "Is my data stored securely?",
    answer:
      "Your data is stored locally on your device. We don't have access to your portfolio, rates, or deal information. Your content stays on your phone.",
  },
  {
    question: "How do I get more inquiries?",
    answer:
      "Make sure your profile is complete with a great photo, bio, and niches. Add your best work to your portfolio, set competitive rates, and share your UGCio link everywhere you can.",
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <ChevronDown
          size={16}
          color={Colors.textTertiary}
          style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined}
        />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* App Info */}
      <View style={styles.heroSection}>
        <View style={styles.appIcon}>
          <Zap size={32} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>UGCio</Text>
        <Text style={styles.appTagline}>Your UGC career, in one place.</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      {/* Features */}
      <Text style={styles.sectionHeader}>What You Can Do</Text>
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.primaryLight }]}>
            <Camera size={18} color={Colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Portfolio</Text>
          <Text style={styles.featureDesc}>Showcase your best UGC work</Text>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.successLight }]}>
            <DollarSign size={18} color={Colors.success} />
          </View>
          <Text style={styles.featureTitle}>Rate Card</Text>
          <Text style={styles.featureDesc}>Set & share your pricing</Text>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
            <Briefcase size={18} color={Colors.accent} />
          </View>
          <Text style={styles.featureTitle}>Deals</Text>
          <Text style={styles.featureDesc}>Track brand partnerships</Text>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: "rgba(96, 165, 250, 0.12)" }]}>
            <Send size={18} color="#60A5FA" />
          </View>
          <Text style={styles.featureTitle}>Share</Text>
          <Text style={styles.featureDesc}>One link for everything</Text>
        </View>
      </View>

      {/* FAQ */}
      <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
      <View style={styles.faqSection}>
        {FAQ_ITEMS.map((item, i) => (
          <React.Fragment key={i}>
            <FAQAccordion item={item} />
            {i < FAQ_ITEMS.length - 1 && <View style={styles.faqDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Links */}
      <Text style={styles.sectionHeader}>Links</Text>
      <View style={styles.linksSection}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("https://ugcio.app")}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: Colors.primaryLight }]}>
            <Globe size={16} color={Colors.primary} />
          </View>
          <Text style={styles.linkText}>Website</Text>
        </TouchableOpacity>
        <View style={styles.linkDivider} />
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("mailto:support@ugcio.app")}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: Colors.successLight }]}>
            <Mail size={16} color={Colors.success} />
          </View>
          <Text style={styles.linkText}>Contact Support</Text>
        </TouchableOpacity>
        <View style={styles.linkDivider} />
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("https://ugcio.app/privacy")}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: Colors.accentLight }]}>
            <Shield size={16} color={Colors.accent} />
          </View>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <View style={styles.linkDivider} />
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("https://ugcio.app/terms")}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
            <FileText size={16} color="#F59E0B" />
          </View>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Made with</Text>
          <Heart size={12} color={Colors.primary} />
          <Text style={styles.footerText}>for creators</Text>
        </View>
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
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  version: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    width: "48%" as any,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  faqSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
    overflow: "hidden",
  },
  faqItem: {
    padding: 16,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  faqDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  linksSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  linkDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 64,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
