# SEBS Project - Gemini AI Guidelines

## Architecture Rules
- **Monorepo:** This is a Turborepo workspace managed with `pnpm`.
- **Strict Typing:** TypeScript is mandatory. Do not use `any`.
- **Shared Contracts:** All API request/response validation must use Zod schemas defined in `packages/shared`. Both frontend and backend must import types from this shared package.
- **Backend:** Node.js + Express. Use layered architecture (Routes -> Controllers -> Services).
- **Frontend:** React + Vite. Keep components modular.
- **Database:** Prisma ORM. Do not write raw SQL/Mongo queries unless absolutely necessary.
- **DevOps:** Ensure all new services are added to `docker-compose.yml`.

## Commands
- Run dev: `pnpm dev`
- Build: `pnpm build`
- Format: `pnpm lint`
