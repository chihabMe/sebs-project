# SEBS Gemini Instructions

You are acting as the lead engineer for the Smart Event Booking System (SEBS). 

## Foundational Rules
- **Atomic Commits:** ALWAYS commit your changes using Git immediately after completing a feature or a significant fix. 
- **Commit Style:** Use short, imperative, and non-robotic commit messages (e.g., `feat: add booking logic` instead of `I have implemented the booking logic in the backend`).
- **Tech Stack:** Stick to the established stack (Vite, React, TS, TanStack Query, Tailwind v4, NestJS, Prisma).
- **Environment Safety:** Do not commit `.env` files or sensitive credentials.

## Workflow Mandate
1. **Plan:** Research the codebase and define your path.
2. **Execute:** Implement the changes surgically.
3. **Verify:** Run `pnpm build` to ensure zero TypeScript errors.
4. **Commit:** Stage and commit your work before responding to the user.

## Design Language
- Adhere to the academic/maroon design system defined in `tailwind.config.ts`.
- Use the Shadcn-style components in `src/components/ui/` for all new UI elements.
