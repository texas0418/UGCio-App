import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Sparkles,
  Camera,
  DollarSign,
  Send,
  Briefcase,
  ChevronRight,
  ArrowRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";

const { width } = Dimensions.get("window");

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  accentColor: string;
  bgGradient: [string, string];
}

const STEPS: OnboardingStep[] = [
  {
    title: "Build Your Brand",
    subtitle:
      "Create a stunning profile that showcases your content style, niches, and personality to attract the right brands.",
    icon: Sparkles,
    accentColor: Colors.primary,
    bgGradient: ["rgba(255, 118, 77, 0.15)", "rgba(255, 118, 77, 0.02)"],
  },
  {
    title: "Set Your Rates",
    subtitle:
      "Define your deliverables and pricing with professional rate cards. Use templates or build your own from scratch.",
    icon: DollarSign,
    accentColor: Colors.success,
    bgGradient: ["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.02)"],
  },
  {
    title: "Track & Get Paid",
    subtitle:
      "Manage brand deals from first contact to payment. Create invoices, track your pipeline, and share your link everywhere.",
    icon: Briefcase,
    accentColor: Colors.accent,
    bgGradient: ["rgba(167, 139, 250, 0.15)", "rgba(167, 139, 250, 0.02)"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, hasOnboarded } = useCreator();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (hasOnboarded) {
      router.replace("/(tabs)/(home)" as never);
    }
  }, [hasOnboarded]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(iconScale, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.spring(iconScale, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    },
    [fadeAnim, slideAnim, iconScale]
  );

  const handleNext = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < STEPS.length - 1) {
      animateTransition(currentStep + 1);
    } else {
      await completeOnboarding();
      router.replace("/(tabs)/(home)" as never);
    }
  }, [currentStep, animateTransition, router, completeOnboarding]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)/(home)" as never);
  }, [router, completeOnboarding]);

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={step.bgGradient}
        style={styles.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <Animated.View
        style={[
          styles.contentWrap,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${step.accentColor}18`,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={[styles.iconInner, { backgroundColor: `${step.accentColor}25` }]}>
            <StepIcon size={40} color={step.accentColor} />
          </View>
        </Animated.View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
      </Animated.View>

      <View style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && {
                  backgroundColor: step.accentColor,
                  width: 24,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: step.accentColor }]}
          onPress={handleNext}
          activeOpacity={0.85}
          testID="onboarding-next-btn"
        >
          {isLast ? (
            <>
              <Text style={styles.nextBtnText}>Get Started</Text>
              <ArrowRight size={18} color={Colors.white} />
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={18} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    height: "60%",
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  contentWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 36,
    gap: 28,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceElevated,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
