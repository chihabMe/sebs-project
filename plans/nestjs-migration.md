# Plan: Migrate Backend from Express to NestJS

This plan outlines the steps to transition the SEBS backend from a simple Express application to a NestJS framework.

## 1. Initial Research & Dependency Setup
- [ ] Backup current `apps/backend/src` directory.
- [ ] Install NestJS core dependencies:
  - `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/throttler`, `class-validator`, `class-transformer`, `reflect-metadata`.
- [ ] Install development dependencies:
  - `@nestjs/cli`, `@nestjs/testing`, `jest`, `ts-jest`, `@types/jest`.
- [ ] Configure `tsconfig.json` for NestJS (decorators, metadata).

## 2. Infrastructure & Core Modules
- [ ] Create `main.ts` as the entry point (replacing `index.ts` and `app.ts`).
- [ ] Setup `AppModule` as the root module.
- [ ] **Prisma Integration:**
  - Create `PrismaModule` and `PrismaService` (wrapping current `@prisma/client`).
  - Update `src/lib/prisma.ts` logic to be a NestJS provider.
- [ ] **Security & Global Middlewares:**
  - Setup Global Exception Filter (replacing `errorHandler.ts`).
  - Configure Helmet, CORS, Cookie Parser, and Throttler in `main.ts`.

## 3. Feature Migration (Module-by-Module)
For each resource (Auth, Users, Events, Bookings, Reviews, Tags, Admin, Organizer, Event-Forms):
- [ ] Define **DTOs** (Data Transfer Objects) using `class-validator` for request validation.
- [ ] Create **Services** to encapsulate business logic and database operations (Prisma).
- [ ] Create **Controllers** to handle HTTP requests and map them to services.
- [ ] Create **Modules** to bundle the controller, service, and dependencies.
- [ ] **Auth Migration:**
  - Convert `auth.ts` middleware to a NestJS `AuthGuard`.
  - Implement JWT strategy (if not using `passport`, use standard NestJS logic).

## 4. Middleware & Utility Migration
- [ ] **Multer Migration:** Convert file upload logic to NestJS `FileInterceptor`.
- [ ] **Validation Migration:** Replace Zod manual validation in controllers with NestJS `ValidationPipe`.
- [ ] **Swagger Migration:** Use `@nestjs/swagger` decorators to generate API documentation instead of manual `swagger.yaml`.

## 5. Testing Migration
- [ ] Configure Jest for unit and E2E testing.
- [ ] Migrate existing Vitest tests to Jest/NestJS testing utilities.
- [ ] Ensure all E2E tests pass for the new NestJS implementation.

## 6. Finalization & Cleanup
- [ ] Update `package.json` scripts (`start`, `dev`, `build`, `test`).
- [ ] Verify `pnpm build` completes successfully without TypeScript errors.
- [ ] Remove unused Express-related dependencies.
- [ ] Update `GEMINI.md` to reflect the new tech stack.

## Verification Strategy
- Run `npm run build` to ensure type safety.
- Run `npm test` to ensure feature parity.
- Manual verification of critical flows (Registration, Login, Event Creation, Booking).
