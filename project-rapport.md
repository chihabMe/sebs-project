# SEBS Project Rapport

## 1. Project Overview

SEBS (Smart Event Booking System) is a full-stack event platform with:
- Public event discovery and details.
- User authentication and profile management.
- Booking lifecycle (request, confirmation/rejection, cancelation, attendance/check-in).
- Organizer workflows (create/manage events, attendees, invitations, booking approvals).
- Admin workflows (users, event moderation, platform stats).
- API documentation via Swagger.

This repository is a monorepo (`pnpm` workspaces + Turbo) containing:
- `apps/frontend`: user-facing web app.
- `apps/admin`: admin web app.
- `apps/backend`: NestJS API.
- `packages/shared`: shared contracts/schemas/types.
- `packages/database`: shared database-related exports.

## 2. Main Features

### 2.1 Authentication & Session
- Register/login for users and organizers.
- Admin login with dedicated session endpoint.
- Cookie + token-based session flows with refresh/logout.
- Password reset flow and email verification flow.

### 2.2 Event Discovery & Booking
- Browse events with filtering/pagination logic.
- Recommended events endpoint.
- Event details endpoint.
- Booking request submission with custom form answers.
- Booking status queries and ticket retrieval.
- QR/check-in flow for attendance marking.

### 2.3 Organizer Features
- Organizer dashboard statistics.
- Create/update/delete events.
- Manage attendee lists.
- Manual booking status management (single or bulk).
- Attendee removal (single or bulk route).
- Invitation token generation and rotation.
- Event form/question management for event-specific booking questions.

### 2.4 User Social & Profile Features
- Profile view/update/delete.
- Public profile endpoint.
- Attendance history endpoint.
- User search endpoint.
- Follow/unfollow users.
- Follower notification preferences.
- Notifications and following list endpoints.

### 2.5 Admin Features
- Create/list/update users.
- List pending events.
- Approve/reject events.
- Platform stats endpoint.

### 2.6 API Documentation
- Swagger UI exposed at:
  - `GET /api/docs`
- OpenAPI generation script available in backend scripts.

## 3. Backend API Routes (All Implemented)

Base prefix configured by backend: `/api`

### 3.1 Health

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Service health check (status/service/timestamp). |

### 3.2 Auth

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create new user/organizer account. |
| POST | `/auth/login` | User/organizer login. |
| POST | `/auth/forgot-password` | Start password reset flow. |
| POST | `/auth/reset-password` | Complete password reset using token. |
| POST | `/auth/verify-email` | Verify account email with token. |
| POST | `/auth/change-password` | Change password for authenticated user. |
| POST | `/auth/admin/login` | Admin login endpoint. |
| POST | `/auth/refresh` | Refresh access/auth tokens. |
| POST | `/auth/logout` | Logout and clear session/auth context. |
| GET | `/auth/session` | Retrieve current user session state. |
| GET | `/auth/admin/session` | Retrieve current admin session state. |

### 3.3 Events

| Method | Route | Purpose |
|---|---|---|
| POST | `/events` | Create event (organizer flow). |
| GET | `/events` | List/browse events. |
| GET | `/events/recommended` | Get recommended events. |
| GET | `/events/organizer` | List organizer-owned events. |
| GET | `/events/:id/manage` | Get management-focused event details. |
| GET | `/events/:id` | Get event details by ID. |
| PATCH | `/events/:id` | Update event. |
| DELETE | `/events/:id` | Delete event. |
| PATCH | `/events/:id/status` | Update event status. |

### 3.4 Bookings

| Method | Route | Purpose |
|---|---|---|
| POST | `/bookings` | Create booking request for an event. |
| POST | `/bookings/checkin/:eventId` | Mark attendance via check-in flow. |
| GET | `/bookings/my` | List current user bookings. |
| GET | `/bookings/:id/ticket` | Retrieve ticket document/data for booking. |
| PATCH | `/bookings/:id/cancel` | Cancel an existing booking. |
| GET | `/bookings/status/:eventId` | Get current user booking status for event. |

### 3.5 Event Forms

| Method | Route | Purpose |
|---|---|---|
| GET | `/event-forms/:eventId` | Get event booking form questions. |
| POST | `/event-forms/:eventId` | Create/replace event booking form questions. |

### 3.6 Reviews

| Method | Route | Purpose |
|---|---|---|
| POST | `/reviews` | Create a review for an event. |
| GET | `/reviews/event/:eventId` | List reviews for an event. |
| DELETE | `/reviews/:id` | Delete a review. |

### 3.7 Tags

| Method | Route | Purpose |
|---|---|---|
| GET | `/tags` | List tags. |
| POST | `/tags` | Create tag. |
| DELETE | `/tags/:id` | Delete tag. |

### 3.8 Users

| Method | Route | Purpose |
|---|---|---|
| GET | `/users/profile` | Get authenticated user profile. |
| PATCH | `/users/profile` | Update authenticated user profile. |
| GET | `/users/attendance` | Get attendance history/stats for user. |
| GET | `/users/search` | Search users (social discovery). |
| POST | `/users/:userId/follow` | Follow a user. |
| DELETE | `/users/:userId/follow` | Unfollow a user. |
| PATCH | `/users/settings/notify-followers-bookings` | Toggle follower booking notifications. |
| GET | `/users/notifications` | List notifications for user. |
| GET | `/users/following` | List users followed by current user. |
| GET | `/users/public/:userId` | Get public profile by user ID. |
| DELETE | `/users/profile` | Delete authenticated user account/profile. |

### 3.9 Organizer

| Method | Route | Purpose |
|---|---|---|
| GET | `/organizer/dashboard/stats` | Organizer dashboard metrics. |
| GET | `/organizer/events/:eventId/attendees` | List attendees for an event. |
| PATCH | `/organizer/bookings/:bookingId/status` | Update one booking status. |
| PATCH | `/organizer/events/:eventId/bookings/status` | Bulk update booking statuses for event. |
| DELETE | `/organizer/bookings/:bookingId` | Remove one attendee/booking. |
| POST | `/organizer/events/:eventId/bookings/remove` | Bulk remove attendees/bookings. |
| POST | `/organizer/events/:eventId/invite` | Generate/retrieve invitation data. |
| POST | `/organizer/events/:eventId/invite/rotate` | Rotate invitation token/link. |

### 3.10 Admin

| Method | Route | Purpose |
|---|---|---|
| POST | `/admin/users` | Create user/admin account from admin panel. |
| GET | `/admin/users` | List users with admin filters/pagination. |
| PATCH | `/admin/users/:id` | Update user state/role/flags. |
| GET | `/admin/pending-events` | List events awaiting moderation. |
| PATCH | `/admin/approve-event/:id` | Approve event. |
| PATCH | `/admin/reject-event/:id` | Reject event. |
| GET | `/admin/stats` | Platform-level admin statistics. |

## 4. Frontend Route Surface

### 4.1 User App (`apps/frontend`)

- Public routes:
  - `/`
  - `/login`
  - `/forgot-password`
  - `/reset-password`
  - `/verify-email`
  - `/register`
  - `/events`
  - `/events/:id`
  - `/events/:id/checkin`
  - `/users/:userId`
- Protected/shared:
  - `/profile`
- User-only:
  - `/dashboard`
  - `/users`
- Organizer-only:
  - `/organizer`
  - `/organizer/events/new`
  - `/organizer/events/:id/edit`
  - `/organizer/events/:id/attendees`
  - `/organizer/events/:id/applications`
  - `/organizer/events/:id/form`

### 4.2 Admin App (`apps/admin`)

- Dedicated admin frontend workspace served separately from user app.
- Consumes admin auth/session and moderation APIs.

## 5. Technologies Used and Why

### 5.1 Monorepo & Tooling
- **pnpm workspaces**: fast installs, shared dependency graph, clean multi-app/package management.
- **Turborepo (`turbo`)**: coordinated build/test/dev pipelines across apps with task orchestration.
- **TypeScript**: type safety across frontend/backend/shared contracts, reduces runtime contract errors.

### 5.2 Backend
- **NestJS**: modular architecture (controllers/services/modules), scalable API structure, clean DI pattern.
- **Swagger (`@nestjs/swagger`)**: automatic API docs generation and interactive testing via `/api/docs`.
- **Class Validator + Class Transformer**: DTO validation/transformation for safer request handling.
- **Helmet**: secure HTTP headers by default.
- **Cookie Parser**: cookie-based auth/session handling.
- **JWT (`@nestjs/jwt`, `jsonwebtoken`)**: token-based authentication and refresh flows.
- **Multer**: multipart/form-data file upload handling.
- **Firebase Admin / Firestore**: cloud-native document storage and real-time-friendly data model.
- **Nodemailer + Resend + React Email render**: transactional email flows (auth/booking notifications).
- **PDFKit**: ticket/PDF generation.
- **Cloudinary**: media/image upload and hosting for user/event assets.

### 5.3 Frontend (User + Admin)
- **React 19**: component-based UI with modern rendering model.
- **React Router**: client-side routing with protected/role-based navigation.
- **TanStack Query**: async server-state caching, retries, and request lifecycle management.
- **Axios**: HTTP client abstraction for API calls/interceptors.
- **Tailwind CSS v4**: utility-first, fast consistent styling.
- **Radix UI primitives**: accessible UI building blocks.
- **Lucide icons**: clean consistent iconography.
- **date-fns**: lightweight date formatting/manipulation.
- **qrcode.react**: QR generation for booking/check-in flows.
- **zod**: shared runtime validation schema support.

### 5.4 DevOps & Runtime
- **Docker + Docker Compose**: reproducible local/dev runtime for backend/frontend/admin and dependencies.
- **Traefik (dev domains)**: local reverse-proxy routing via app-specific hostnames.

### 5.5 Testing & Quality
- **Jest + Supertest**: backend unit/integration/e2e style testing.
- **ESLint**: code quality and consistency gates.
- **OpenAPI contract scripts**: API contract generation/check between backend and frontend.

## 6. Notes

- API base prefix is `/api`; tables in this report list routes without the prefix for readability.
- Swagger UI availability confirmed at `/api/docs` once backend compiles and starts successfully.
