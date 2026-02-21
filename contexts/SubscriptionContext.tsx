import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let useIAP: any = null;
let initConnection: any = null;
let endConnection: any = null;
let getAvailablePurchases: any = null;

if (Platform.OS !== "web") {
  try {
    const expoIAP = require("expo-iap");
    useIAP = expoIAP.useIAP;
    initConnection = expoIAP.initConnection;
    endConnection = expoIAP.endConnection;
    getAvailablePurchases = expoIAP.getAvailablePurchases;
  } catch {
    // expo-iap not available
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

// Inner component that uses the useIAP hook (hooks can only be used in components)
function SubscriptionManager({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DURATION_DAYS);
  const [trialExpired, setTrialExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState("$9.99/month");

  const iap = useIAP
    ? useIAP({
        onPurchaseSuccess: async (purchase: any) => {
          try {
            const { finishTransaction } = require("expo-iap");
            await finishTransaction({ purchase, isConsumable: false });
            setIsSubscribed(true);
            await AsyncStorage.setItem(SUBSCRIPTION_KEY, "true");
          } catch {}
        },
        onPurchaseError: (_error: any) => {
          // Purchase error
        },
      })
    : null;

  // Initialize trial
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

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!iap || Platform.OS === "web") {
      await initTrial();
      setIsLoading(false);
      return;
    }

    try {
      const cachedSub = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (cachedSub === "true") {
        setIsSubscribed(true);
      }

      // Fetch subscription products to get price
      if (iap.connected) {
        await iap.fetchProducts({ skus: [PRODUCT_ID], type: "subs" });
        if (iap.products && iap.products.length > 0) {
          const sub = iap.products[0];
          const displayPrice = sub.displayPrice || sub.localizedPrice || "$9.99";
          setPrice(`${displayPrice}/month`);
        }

        // Check available purchases for active subscription
        const purchases = await getAvailablePurchases();
        const hasActiveSub = purchases?.some(
          (p: any) => p.productId === PRODUCT_ID
        );

        if (hasActiveSub) {
          setIsSubscribed(true);
          await AsyncStorage.setItem(SUBSCRIPTION_KEY, "true");
        } else {
          setIsSubscribed(false);
          await AsyncStorage.setItem(SUBSCRIPTION_KEY, "false");
          await initTrial();
        }
      } else {
        // Not connected yet, use cached + trial
        if (cachedSub !== "true") {
          await initTrial();
        }
      }
    } catch {
      const cachedSub = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (cachedSub !== "true") {
        await initTrial();
      }
    } finally {
      setIsLoading(false);
    }
  }, [iap?.connected, initTrial]);

  // Purchase subscription
  const purchaseSubscription = useCallback(async () => {
    if (!iap) return;
    try {
      await iap.requestPurchase({
        request: {
          apple: { sku: PRODUCT_ID },
          google: { skus: [PRODUCT_ID] },
        },
        type: "subs",
      });
    } catch (error: any) {
      if (error?.code !== "E_USER_CANCELLED") {
        throw error;
      }
    }
  }, [iap]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!getAvailablePurchases) return;
    try {
      const purchases = await getAvailablePurchases();
      const hasActiveSub = purchases?.some(
        (p: any) => p.productId === PRODUCT_ID
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

  // Check on mount and when connected
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Re-check when app foregrounds
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        checkSubscription();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
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

// Fallback for web where useIAP isn't available
function WebSubscriptionManager({ children }: { children: React.ReactNode }) {
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DURATION_DAYS);
  const [trialExpired, setTrialExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const trialStart = await AsyncStorage.getItem(TRIAL_START_KEY);
      if (!trialStart) {
        await AsyncStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
        setIsTrialActive(true);
        setTrialDaysRemaining(TRIAL_DURATION_DAYS);
      } else {
        const startDate = new Date(trialStart);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = TRIAL_DURATION_DAYS - diffDays;
        if (remaining > 0) {
          setIsTrialActive(true);
          setTrialDaysRemaining(remaining);
        } else {
          setTrialExpired(true);
          setTrialDaysRemaining(0);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed: false,
        isTrialActive,
        trialDaysRemaining,
        trialExpired,
        isLoading,
        price: "$9.99/month",
        purchaseSubscription: async () => {},
        restorePurchases: async () => {},
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web" || !useIAP) {
    return <WebSubscriptionManager>{children}</WebSubscriptionManager>;
  }
  return <SubscriptionManager>{children}</SubscriptionManager>;
}
