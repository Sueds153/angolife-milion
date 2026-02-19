
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
  status: 'pending' | 'published';
  isVerified?: boolean;
  imageUrl?: string;
  category?: string;
  reportCount?: number;
  applicationCount?: number;
  source?: string;
}

export interface ExchangeRate {
  currency: 'USD' | 'EUR';
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
  originalPrice: number;
  discountPrice: number;
  location: string;
  description: string;
  imagePlaceholder: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  status: 'pending' | 'published';
  imageUrl?: string;
}

export interface UserProfile {
  email: string;
  referralCount: number;
  isPremium: boolean;
  referralCode: string;
  isAdmin: boolean;
  cvCredits: number;
  premiumExpiry?: number; // Timestamp
  subscriptionType?: 'pack3' | 'monthly' | 'yearly';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'job' | 'market' | 'system';
  timestamp: number;
}

export type UserRole = 'guest' | 'admin';

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
  experiences: CVExperience[];
  education: CVEducation[];
  skills: string[];
}
