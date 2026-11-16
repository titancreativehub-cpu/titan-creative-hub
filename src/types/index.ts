export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  suspended?: boolean;
  photoURL?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  videoUrl: string;
  videoStoragePath?: string;
  resourceName?: string;
  resourceUrl?: string;
  resourceStoragePath?: string;
  isPreview?: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  thumbnailStoragePath?: string;
  instructorName: string;
  instructorTitle: string;
  category: string;
  priceNGN: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  formatLabel?: string;
  isPdfCourse?: boolean;
  pdfStoragePath?: string;
  pdfFileName?: string;
  enrollmentInfo?: string;
  lessonsCount: number;
  published: boolean;
  archived?: boolean;
  featured?: boolean;
  outcomes: string[];
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export type EbookAvailabilityStatus = 'available' | 'coming_soon' | 'unpublished';

export interface Ebook {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  author: string;
  category: string;
  priceNGN: number;
  pages: number;
  format: string;
  coverUrl: string;
  coverStoragePath?: string;
  pdfStoragePath?: string;
  pdfFileName?: string;
  previewExcerpt: string;
  tableOfContents: string[];
  availabilityStatus?: EbookAvailabilityStatus;
  published: boolean;
  archived?: boolean;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_REQUESTED' | 'REFUNDED';
export type ProductType = 'course' | 'ebook';

export interface Order {
  id: string;
  reference: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  productType: ProductType;
  productId: string;
  productTitle: string;
  amountNGN: number;
  currency: 'NGN';
  status: OrderStatus;
  paymentProvider: 'paystack';
  paymentReference?: string;
  paystackStatus?: string;
  refundReason?: string;
  whatsappPreparedUrl: string;
  emailNotificationStatus?: 'sent' | 'unconfigured' | 'failed';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  productType: ProductType;
  productId: string;
  orderId: string;
  grantedBy: 'paystack_verified' | 'admin_grant';
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  logoUrl: string;
  whatsappNumber: string;
  businessEmail: string;
  address: string;
  updatedAt: string;
}

export interface SystemConfigStatus {
  firebaseClientConfigured: boolean;
  firebaseAdminConfigured: boolean;
  paystackConfigured: boolean;
  paystackMode: 'test' | 'live' | 'unconfigured';
  emailConfigured: boolean;
  missingClientVars: string[];
  missingServerVars: string[];
}
