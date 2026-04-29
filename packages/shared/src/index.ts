import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'ORGANIZER', 'USER']);
export const eventStatusSchema = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']);
export const bookingStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']);

export const Role = roleSchema.enum;
export const EventStatus = eventStatusSchema.enum;
export const BookingStatus = bookingStatusSchema.enum;

export type Role = z.infer<typeof roleSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

const booleanLikeSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

// ==========================================
// SCHEMAS (Validation for Requests)
// ==========================================

// AUTH
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: roleSchema.extract(['USER', 'ORGANIZER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const adminLoginSchema = loginSchema;

// TAG
export const tagCreateSchema = z.object({
  name: z.string().min(2).max(50),
});

// EVENT
export const eventCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.coerce.date(),
  location: z.string(),
  category: z.string(),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',').filter(Boolean).map((s) => s.trim()) : val),
    z.array(z.string()).min(3, "Select at least 3 tags").max(7, "Select at most 7 tags")
  ),
  maxTickets: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
  autoApproveBookings: booleanLikeSchema.optional().default(false),
});

// BOOKING
export const bookingCreateSchema = z.object({
  eventId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string().min(1),
  })).optional(),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED']),
});

// EVENT FORM
export const eventFormQuestionSchema = z.object({
  question: z.string().min(3),
  required: z.boolean().default(true),
});

export const eventFormUpdateSchema = z.object({
  questions: z.array(eventFormQuestionSchema),
});

// REVIEW
export const reviewCreateSchema = z.object({
  eventId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// PROFILE
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  password: z.string().min(6).optional(),
  tags: z.array(z.string()).optional(), // Array of Tag IDs
});

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: roleSchema.optional().default('USER'),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: roleSchema.optional(),
  isBanned: z.boolean().optional(),
});

// ==========================================
// TYPES (Inferred from Schemas)
// ==========================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
export type EventFormQuestionInput = z.infer<typeof eventFormQuestionSchema>;
export type EventFormUpdateInput = z.infer<typeof eventFormUpdateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof updateProfileSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;

// ==========================================
// INTERFACES (Frontend/Backend Contracts)
// ==========================================

export interface TagDto {
  id: string;
  name: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBanned?: boolean;
  avatar?: string | null;
  bio?: string | null;
  tags?: TagDto[];
  createdAt?: string | Date;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

export interface AdminSessionResponse {
  user: UserDto;
  portal: 'admin';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  errorId?: string;
  code?: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  location: string;
  image?: string | null;
  category: string;
  status: EventStatus;
  isApproved: boolean;
  maxTickets: number;
  price: number;
  autoApproveBookings?: boolean;
  invitationToken?: string | null;
  organizerId: string;
  organizer?: { id: string; name: string };
  tags: TagDto[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdminUsersQueryParams {
  search?: string;
  role?: Role;
  isBanned?: boolean;
  sortBy?: 'createdAt' | 'name' | 'email' | 'role';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminPendingEventsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserListItem extends Pick<UserDto, 'id' | 'email' | 'name' | 'role' | 'isBanned' | 'createdAt'> {}

export interface AdminPendingEventItem extends Omit<EventDto, 'organizer'> {
  organizer?: {
    name: string;
    email?: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  pendingEvents: number;
  bannedUsers: number;
}

export interface OrganizerDashboardStats {
  totalEvents: number;
  approvedEvents: number;
  pendingApprovalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;
  cancelledBookings: number;
  totalCapacity: number;
  activeDemand: number;
  confirmationRate: number;
}

export interface OrganizerAttendeeSummary {
  pending: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
}

export interface OrganizerAttendeesResponse<T> {
  items: T[];
  meta: PaginationMeta;
  summary: OrganizerAttendeeSummary;
}
