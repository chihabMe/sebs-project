# SEBS Mini-Project Compliance Report

Last updated: 2026-04-30

## API Documentation
- Swagger UI: `http://localhost:4000/api/docs`

## Scope Note
- Backend stack in this project is NestJS + Firestore-backed Prisma compatibility layer.
- Per current instruction, no framework/database migration is applied in this report.

## Feature Tracking

### 1. User Module
- [x] Registration/Login (JWT auth)
- [x] Profile management (view/update)
- [x] Role-based access control (Admin/Organizer/User)

### 2. Event Management Module
- [x] Organizer/Admin CRUD for events
- [x] Categories and tags
- [x] Image upload (multer)
- [x] Event status (upcoming/ongoing/completed/cancelled)
- [x] Admin approval flow for organizer-created events

### 3. Booking Module
- [x] Book an event
- [x] Cancel booking
- [x] Confirmation/request emails for booking flow
- [x] Cancellation email
- [x] Ticket PDF download

### 4. Review and Rating Module
- [x] Review only after attendance conditions
- [x] Rating from 1 to 5
- [x] Aggregate ratings per event

### 5. Admin Dashboard APIs
- [x] User management (ban/unban/promote)
- [x] Event approval/rejection APIs
- [x] Statistics APIs (users/events/bookings/revenue/pending/banned)

### 6. Notification Module
- [x] Email on registration
- [x] Email on booking
- [x] Email on booking cancellation
- [x] Email on event schedule/venue update

## Best Practices / Architecture
- [x] Layered architecture (controllers/services/modules)
- [x] Validation + middleware + global exception filter
- [x] OpenAPI/Swagger configured

## Deliverables Status
- [x] Functional backend REST API
- [x] Swagger/OpenAPI docs
- [ ] Postman collection (Insomnia export exists at `api-tests/insomnia-eventify-export.json`)

## Change Log (Tracking)
- [x] Added registration welcome email dispatch in auth registration flow.
- [x] Added booking cancellation email dispatch in booking cancel flow.
- [x] Added event update emails to confirmed attendees when event date/location changes.
- [x] Added/updated tests for new notification features.
- [x] Switched event and avatar image uploads to Cloudinary (env-driven).
- [x] Added centralized pagination constants:
  - `apps/backend/src/common/constants/pagination.constants.ts`
  - `apps/frontend/src/constants/pagination.ts`
- [x] Added pagination metadata + controls for:
  - Events browse list (`/events`)
  - Event reviews list
  - User search list
  - Following list on profile
  - Organizer event applications/attendees now use shared page-size constants

## Cloudinary Environment Variables
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
