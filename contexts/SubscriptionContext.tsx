import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// react-native-iap will be used on native, but we need graceful fallback for web
let IAP: typeof import("react-native-iap") | null = null;
if (Platform.OS !== "web") {
  try {
    IAP = require("react-native-iap");
  } catch {
    // IAP not available (web or missing native module)
  }
}

const PRODUCT_ID = "com.ugcio.app.monthly";
const TRIAL_START_KEY = "ugcio_trial_start";
const SUBSCRIPTION_KEY = "ugcio_subscription_active";
const TRIAL_DURATION_DAYS = 14;

interface SubscriptionState {
  isSubscribed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  isLoading: boolean;
  price: string;
  purchaseSubscription: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  isSubscribed: false,
  isTrialActive: false,
  trialDaysRemaining: TRIAL_DURATION_DAYS,
  trialExpired: false,
  isLoading: true,
  price: "$9.99/month",
  purchaseSubscription: async () => {},
  restorePurchases: async () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DURATION_DAYS);
  const [trialExpired, setTrialExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState("$9.99/month");
  const purchaseUpdateSubscription = useRef<any>(null);
  const purchaseErrorSubscription = useRef<any>(null);

  // Initialize trial on first launch
  const initTrial = useCallback(async () => {
    const trialStart = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (!trialStart) {
      await AsyncStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
      setIsTrialActive(true);
      setTrialDaysRemaining(TRIAL_DURATION_DAYS);
      return;
    }

    const startDate = new Date(trialStart);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remaining = TRIAL_DURATION_DAYS - diffDays;

    if (remaining > 0) {
      setIsTrialActive(true);
      setTrialDaysRemaining(remaining);
      setTrialExpired(false);
    } else {
      setIsTrialActive(false);
      setTrialDaysRemaining(0);
      setTrialExpired(true);
    }
  }, []);

  // Check subscription via StoreKit
  const checkSubscription = useCallback(async () => {
    if (!IAP || Platform.OS === "web") {
      await initTrial();
      setIsLoading(false);
      return;
    }

    try {
      const cachedSub = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (cachedSub === "true") {
        setIsSubscribed(true);
      }

      await IAP.initConnection();

      // Get available subscriptions to show price (v13 API)
      const subscriptions = await IAP.getSubscriptions({ skus: [PRODUCT_ID] });
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        const localizedPrice = sub.localizedPrice || "$9.99";
        setPrice(`${localizedPrice}/month`);
      }

      // Check current purchases
      const availablePurchases = await IAP.getAvailablePurchases();
      const hasActiveSub = availablePurchases.some(
        (purchase: any) => purchase.productId === PRODUCT_ID
      );

      if (hasActiveSub) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(SUBSCRIPTION_KEY, "true");
      } else {
        setIsSubscribed(false);
        await AsyncStorage.setItem(SUBSCRIPTION_KEY, "false");
        await initTrial();
      }
    } catch (error) {
      const cachedSub = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (cachedSub !== "true") {
        await initTrial();
      }
    } finally {
      setIsLoading(false);
    }
  }, [initTrial]);

  // Purchase subscription (v13 API)
  const purchaseSubscription = useCallback(async () => {
    if (!IAP || Platform.OS === "web") return;

    try {
      await IAP.requestSubscription({ sku: PRODUCT_ID });
    } catch (error: any) {
      if (error?.code !== "E_USER_CANCELLED") {
        throw error;
      }
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!IAP || Platform.OS === "web") return;

    try {
      const purchases = await IAP.getAvailablePurchases();
      const hasActiveSub = purchases.some(
        (purchase: any) => purchase.productId === PRODUCT_ID
      );

      if (hasActiveSub) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(SUBSCRIPTION_KEY, "true");
      } else {
        throw new Error("No active subscription found");
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Set up purchase listeners (v13 API)
  useEffect(() => {
    if (!IAP || Platform.OS === "web") {
      checkSubscription();
      return;
    }

    purchaseUpdateSubscription.current = IAP.purchaseUpdatedListener(
      async (purchase: any) => {
        if (purchase.productId === PRODUCT_ID) {
          try {
            const receipt = purchase.transactionReceipt;
            if (receipt) {
              await IAP!.finishTransaction({ purchase, isConsumable: false });
              setIsSubscribed(true);
              await AsyncStorage.setItem(SUBSCRIPTION_KEY, "true");
            }
          } catch (error) {
            // Transaction finish failed
          }
        }
      }
    );

    purchaseErrorSubscription.current = IAP.purchaseErrorListener(
      (error: any) => {
        if (error.code !== "E_USER_CANCELLED") {
          // Purchase error occurred
        }
      }
    );

    checkSubscription();

    return () => {
      purchaseUpdateSubscription.current?.remove();
      purchaseErrorSubscription.current?.remove();
      if (IAP) {
        IAP.endConnection();
      }
    };
  }, [checkSubscription]);

  // Re-check when app foregrounds
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        checkSubscription();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isTrialActive,
        trialDaysRemaining,
        trialExpired,
        isLoading,
        price,
        purchaseSubscription,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
