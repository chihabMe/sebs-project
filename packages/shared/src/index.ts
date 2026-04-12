import { z } from 'zod';

// ==========================================
// SCHEMAS (Validation for Requests)
// ==========================================

// AUTH
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['USER', 'ORGANIZER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// EVENT
export const eventCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.coerce.date(),
  location: z.string(),
  category: z.string(),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()) : val),
    z.array(z.string()).optional()
  ),
  maxTickets: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
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
});

// ==========================================
// TYPES (Inferred from Schemas)
// ==========================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
export type EventFormQuestionInput = z.infer<typeof eventFormQuestionSchema>;
export type EventFormUpdateInput = z.infer<typeof eventFormUpdateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof updateProfileSchema>;

// ==========================================
// INTERFACES (Frontend/Backend Contracts)
// ==========================================

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ORGANIZER' | 'USER';
  avatar?: string | null;
  bio?: string | null;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
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
