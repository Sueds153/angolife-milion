export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  postedAt: string;
  requirements: string[];
  sourceUrl?: string;
  applicationEmail?: string;
  status: "pending" | "published" | "approved" | "rejected";
  isVerified?: boolean;
  imageUrl?: string;
  category?: string;
  reportCount?: number;
  applicationCount?: number;
  source?: string;
}

export interface ExchangeRate {
  currency: "USD" | "EUR";
  formalBuy: number;
  formalSell: number;
  informalBuy: number;
  informalSell: number;
  lastUpdated: string;
}

export interface ProductDeal {
  id: string;
  title: string;
  store: string;
  storeNumber?: string;
  phone?: string;
  originalPrice: number;
  discountPrice: number;
  /** Alias de discountPrice — usado em alguns componentes como deal.price */
  price?: number;
  location: string;
  description: string;
  imagePlaceholder: string;
  /** URL pública do bucket discount-images do Supabase Storage */
  imageUrl?: string;
  url?: string;
  category?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  createdAt: string;
  views?: number;
  likes?: number;
  verified?: boolean;
  is_admin?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  status: "pending" | "published" | "approved" | "rejected";
  imageUrl?: string;
}

export interface UserProfile {
  id?: string;
  email: string;
  referralCount: number;
  isPremium: boolean;
  referralCode: string;
  isAdmin: boolean;
  cvCredits: number;
  premiumExpiry?: number; // Timestamp
  subscriptionType?: "pack3" | "monthly" | "yearly";
  accountType?: "free" | "premium";
  fullName?: string;
  phone?: string;
  location?: string;
  savedJobs?: string[]; // IDs das vagas guardadas
  applicationHistory?: { jobId: string, date: string, title: string }[];
  cvHistory?: { id: string, date: string, url: string, name: string }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "job" | "market" | "system";
  timestamp: number;
}

export type UserRole = "guest" | "admin";

// CV Types
export interface CVExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface CVEducation {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  photoUrl?: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: string[];
}
