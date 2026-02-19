export interface CreatorProfile {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  niches: string[];
  socialLinks: SocialLink[];
  availability: AvailabilityStatus;
  bookedUntil?: string;
}

export type AvailabilityStatus = "available" | "limited" | "booked";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface PortfolioItem {
  id: string;
  type: "photo" | "video";
  uri: string;
  thumbnailUri?: string;
  category: string;
  brandName?: string;
  description?: string;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface InquiryForm {
  brandName: string;
  email: string;
  message: string;
  budget?: string;
}

export type DealStatus = "new" | "in_talks" | "contracted" | "delivered" | "paid";

export interface BrandDeal {
  id: string;
  brandName: string;
  contactEmail: string;
  description: string;
  budget?: number;
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Testimonial {
  id: string;
  brandName: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface AnalyticsData {
  totalViews: number;
  viewsByDay: { date: string; views: number }[];
  portfolioClicks: number;
  rateCardViews: number;
  inquiries: number;
}

export interface Invoice {
  id: string;
  dealId?: string;
  brandName: string;
  brandEmail?: string;
  items: InvoiceItem[];
  total: number;
  status: "draft" | "sent" | "paid";
  createdAt: string;
  dueDate?: string;
  notes?: string;
}

export interface InvoiceItem {
  title: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface RateTemplate {
  id: string;
  name: string;
  niche: string;
  deliverables: Omit<Deliverable, "id">[];
}
