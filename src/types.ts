/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface VendorServiceItem {
  name: string;
  price: number;
  description: string;
  unit: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string; // e.g. "Banquet Hall", "Decorator", "Photographer"
  occasion: string[]; // e.g. ["Wedding", "Birthday"]
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  distance: string;
  responseTime: string;
  verified: boolean;
  basePrice: number;
  images: string[];
  videos?: string[];
  location: string;
  features: string[];
  services: VendorServiceItem[];
  reviews: Review[];
  bookingsCount: number;
  isTrending?: boolean;
  capacity?: number; // Maximum guest size for venues
  instagram?: string;
  whatsapp?: string;
  phone?: string;
  founderName?: string;
  founderImage?: string;
  experience?: string;
  busyDates?: string[];
  latitude?: number;
  longitude?: number;
}

export interface EventPlanner {
  id: string;
  name: string;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  images: string[];
  features: string[];
}

export type UserRole = 'user' | 'admin' | 'master_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  city: string;
  phone?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  userName: string; // User who is assigned/used this
}

export interface PaymentSettings {
  id: string;
  paymentEnabled: boolean;
  methods: ('upi' | 'card' | 'cod')[];
}

export interface AdminSettings {
  id: string;
  paymentEnabled: boolean;
  promoCodes: PromoCode[];
  adminUsers: { username: string; passwordHash: string }[];
}

export interface Booking {
  id: string;
  vendor: Vendor;
  selectedServices: VendorServiceItem[];
  eventDate: string;
  eventType: string;
  status: 'Pending' | 'Confirmed' | 'Vendor Assigned' | 'In Progress' | 'Completed';
  totalPrice: number;
  bundleDiscount: number;
  finalPrice: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  bookingIdString: string;
}

export interface ChatMessage {
  id: string;
  vendorId: string;
  sender: 'user' | 'vendor';
  text: string;
  timestamp: string;
}

export interface ChatThread {
  vendor: Vendor;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface QuickCategory {
  id: string;
  name: string;
  iconName: string;
  image: string;
}

export interface HeroPromo {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  gradient: string;
  tag: string;
}

