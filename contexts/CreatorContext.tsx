import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import {
  CreatorProfile,
  PortfolioItem,
  Deliverable,
  BrandDeal,
  Testimonial,
  AnalyticsData,
  Invoice,
  AvailabilityStatus,
  DealStatus,
} from "@/types";
import { DEFAULT_DELIVERABLES } from "@/mocks/categories";

const STORAGE_KEYS = {
  PROFILE: "creator_profile",
  PORTFOLIO: "creator_portfolio",
  DELIVERABLES: "creator_deliverables",
  DEALS: "creator_deals",
  TESTIMONIALS: "creator_testimonials",
  ANALYTICS: "creator_analytics",
  INVOICES: "creator_invoices",
  ONBOARDED: "creator_onboarded",
};

const DEFAULT_PROFILE: CreatorProfile = {
  name: "",
  username: "",
  bio: "",
  avatarUrl: "",
  niches: [],
  socialLinks: [],
  availability: "available",
};

const DEFAULT_DELIVERABLES_LIST: Deliverable[] = DEFAULT_DELIVERABLES.map((d) => ({ ...d })) as Deliverable[];

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalViews: 0,
  viewsByDay: [],
  portfolioClicks: 0,
  rateCardViews: 0,
  inquiries: 0,
};

export const [CreatorProvider, useCreator] = createContextHook(() => {
  const queryClient = useQueryClient();

  const onboardedQuery = useQuery({
    queryKey: ["creator_onboarded"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED);
      return stored === "true";
    },
  });

  const onboardedMutation = useMutation({
    mutationFn: async (value: boolean) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, value ? "true" : "false");
      return value;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_onboarded"], data);
    },
  });

  const hasOnboarded = onboardedQuery.data ?? false;

  const completeOnboarding = useCallback(async () => {
    await onboardedMutation.mutateAsync(true);
  }, []);

  const profileQuery = useQuery({
    queryKey: ["creator_profile"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored) as CreatorProfile;
        if (!parsed.availability) parsed.availability = "available";
        return parsed;
      }
      return DEFAULT_PROFILE;
    },
  });

  const portfolioQuery = useQuery({
    queryKey: ["creator_portfolio"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      return stored ? (JSON.parse(stored) as PortfolioItem[]) : [];
    },
  });

  const deliverablesQuery = useQuery({
    queryKey: ["creator_deliverables"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DELIVERABLES);
      return stored
        ? (JSON.parse(stored) as Deliverable[])
        : DEFAULT_DELIVERABLES_LIST;
    },
  });

  const dealsQuery = useQuery({
    queryKey: ["creator_deals"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEALS);
      return stored ? (JSON.parse(stored) as BrandDeal[]) : [];
    },
  });

  const testimonialsQuery = useQuery({
    queryKey: ["creator_testimonials"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
      return stored ? (JSON.parse(stored) as Testimonial[]) : [];
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ["creator_analytics"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return stored ? (JSON.parse(stored) as AnalyticsData) : DEFAULT_ANALYTICS;
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ["creator_invoices"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
      return stored ? (JSON.parse(stored) as Invoice[]) : [];
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (profile: CreatorProfile) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_profile"], data);
    },
  });

  const portfolioMutation = useMutation({
    mutationFn: async (items: PortfolioItem[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(items));
      return items;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_portfolio"], data);
    },
  });

  const deliverablesMutation = useMutation({
    mutationFn: async (items: Deliverable[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.DELIVERABLES, JSON.stringify(items));
      return items;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_deliverables"], data);
    },
  });

  const dealsMutation = useMutation({
    mutationFn: async (items: BrandDeal[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(items));
      return items;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_deals"], data);
    },
  });

  const testimonialsMutation = useMutation({
    mutationFn: async (items: Testimonial[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(items));
      return items;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_testimonials"], data);
    },
  });

  const analyticsMutation = useMutation({
    mutationFn: async (data: AnalyticsData) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_analytics"], data);
    },
  });

  const invoicesMutation = useMutation({
    mutationFn: async (items: Invoice[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(items));
      return items;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["creator_invoices"], data);
    },
  });

  const profile = profileQuery.data ?? DEFAULT_PROFILE;
  const portfolio = portfolioQuery.data ?? [];
  const deliverables = deliverablesQuery.data ?? DEFAULT_DELIVERABLES_LIST;
  const deals = dealsQuery.data ?? [];
  const testimonials = testimonialsQuery.data ?? [];
  const analytics = analyticsQuery.data ?? DEFAULT_ANALYTICS;
  const invoices = invoicesQuery.data ?? [];

  const updateProfile = useCallback(
    (updates: Partial<CreatorProfile>) => {
      const updated = { ...profile, ...updates };
      profileMutation.mutate(updated);
    },
    [profile]
  );

  const addPortfolioItem = useCallback(
    (item: PortfolioItem) => {
      const updated = [item, ...portfolio];
      portfolioMutation.mutate(updated);
    },
    [portfolio]
  );

  const removePortfolioItem = useCallback(
    (id: string) => {
      const updated = portfolio.filter((item) => item.id !== id);
      portfolioMutation.mutate(updated);
    },
    [portfolio]
  );

  const updateDeliverable = useCallback(
    (id: string, updates: Partial<Deliverable>) => {
      const updated = deliverables.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      );
      deliverablesMutation.mutate(updated);
    },
    [deliverables]
  );

  const addDeliverable = useCallback(
    (item: Deliverable) => {
      const updated = [...deliverables, item];
      deliverablesMutation.mutate(updated);
    },
    [deliverables]
  );

  const removeDeliverable = useCallback(
    (id: string) => {
      const updated = deliverables.filter((d) => d.id !== id);
      deliverablesMutation.mutate(updated);
    },
    [deliverables]
  );

  const setDeliverables = useCallback(
    (items: Deliverable[]) => {
      deliverablesMutation.mutate(items);
    },
    []
  );

  const addDeal = useCallback(
    (deal: BrandDeal) => {
      const updated = [deal, ...deals];
      dealsMutation.mutate(updated);
    },
    [deals]
  );

  const updateDeal = useCallback(
    (id: string, updates: Partial<BrandDeal>) => {
      const updated = deals.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      );
      dealsMutation.mutate(updated);
    },
    [deals]
  );

  const removeDeal = useCallback(
    (id: string) => {
      const updated = deals.filter((d) => d.id !== id);
      dealsMutation.mutate(updated);
    },
    [deals]
  );

  const addTestimonial = useCallback(
    (item: Testimonial) => {
      const updated = [item, ...testimonials];
      testimonialsMutation.mutate(updated);
    },
    [testimonials]
  );

  const removeTestimonial = useCallback(
    (id: string) => {
      const updated = testimonials.filter((t) => t.id !== id);
      testimonialsMutation.mutate(updated);
    },
    [testimonials]
  );

  const updateAnalytics = useCallback(
    (updates: Partial<AnalyticsData>) => {
      const updated = { ...analytics, ...updates };
      analyticsMutation.mutate(updated);
    },
    [analytics]
  );

  const incrementAnalytic = useCallback(
    (key: "totalViews" | "portfolioClicks" | "rateCardViews" | "inquiries") => {
      const updated = { ...analytics, [key]: analytics[key] + 1 };
      const today = new Date().toISOString().split("T")[0];
      const existingDay = updated.viewsByDay.find((d) => d.date === today);
      if (existingDay) {
        updated.viewsByDay = updated.viewsByDay.map((d) =>
          d.date === today ? { ...d, views: d.views + 1 } : d
        );
      } else {
        updated.viewsByDay = [...updated.viewsByDay.slice(-29), { date: today, views: 1 }];
      }
      analyticsMutation.mutate(updated);
    },
    [analytics]
  );

  const addInvoice = useCallback(
    (invoice: Invoice) => {
      const updated = [invoice, ...invoices];
      invoicesMutation.mutate(updated);
    },
    [invoices]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      );
      invoicesMutation.mutate(updated);
    },
    [invoices]
  );

  const removeInvoice = useCallback(
    (id: string) => {
      const updated = invoices.filter((inv) => inv.id !== id);
      invoicesMutation.mutate(updated);
    },
    [invoices]
  );

  const isLoading =
    profileQuery.isLoading ||
    portfolioQuery.isLoading ||
    deliverablesQuery.isLoading ||
    dealsQuery.isLoading ||
    testimonialsQuery.isLoading ||
    analyticsQuery.isLoading ||
    invoicesQuery.isLoading ||
    onboardedQuery.isLoading;

  return {
    profile,
    portfolio,
    deliverables,
    deals,
    testimonials,
    analytics,
    invoices,
    hasOnboarded,
    isLoading,
    completeOnboarding,
    updateProfile,
    addPortfolioItem,
    removePortfolioItem,
    updateDeliverable,
    addDeliverable,
    removeDeliverable,
    setDeliverables,
    addDeal,
    updateDeal,
    removeDeal,
    addTestimonial,
    removeTestimonial,
    updateAnalytics,
    incrementAnalytic,
    addInvoice,
    updateInvoice,
    removeInvoice,
  };
});
