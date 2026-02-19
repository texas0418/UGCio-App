export const NICHE_CATEGORIES = [
  "Food & Beverage",
  "Beauty & Skincare",
  "Fashion & Style",
  "Tech & Gadgets",
  "Fitness & Wellness",
  "Home & Lifestyle",
  "Travel",
  "Parenting",
  "Pets",
  "Finance",
  "Gaming",
  "Education",
  "Automotive",
  "Health & Supplements",
] as const;

export const SOCIAL_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter/X",
  "LinkedIn",
  "Website",
] as const;

export const DEFAULT_DELIVERABLES = [
  {
    id: "1",
    title: "Single UGC Video",
    description: "One 30-60s video with hook, body, and CTA",
    price: 250,
    currency: "USD",
    isActive: true,
  },
  {
    id: "2",
    title: "3-Video Bundle",
    description: "Three videos with different hooks/angles",
    price: 650,
    currency: "USD",
    isActive: true,
  },
  {
    id: "3",
    title: "Photo Bundle (5 Photos)",
    description: "Five styled product photos, edited and delivered",
    price: 300,
    currency: "USD",
    isActive: true,
  },
  {
    id: "4",
    title: "Usage Rights (30 days)",
    description: "Brand can use content in paid ads for 30 days",
    price: 150,
    currency: "USD",
    isActive: false,
  },
  {
    id: "5",
    title: "Revision",
    description: "One round of revisions on any deliverable",
    price: 50,
    currency: "USD",
    isActive: false,
  },
];
