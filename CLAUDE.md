# FlipLingo — CLAUDE.md

## Project Overview
FlipLingo is a language flashcard SaaS. Users study English→target language vocabulary via flip cards, create decks, track progress, and unlock premium decks via Stripe subscriptions. Future: spaced repetition, AI-generated decks.

---

## Monorepo Structure
```
apps/
  web/          # Next.js 15 App Router frontend
  api/          # NestJS backend (REST + tRPC adapter)
packages/
  db/           # Drizzle schema, migrations, db client
  trpc/         # Shared tRPC router types and procedure definitions
```
- Never import `apps/api` from `apps/web` directly — all data flows through tRPC.
- Never import `apps/web` from `apps/api`.
- `packages/db` is imported only by `apps/api` and `packages/trpc`.
- `packages/trpc` is imported by both `apps/web` and `apps/api`.

---

## Architecture Principles

### Layering (enforced — no exceptions)
```
Controller → Service → Repository → Drizzle (packages/db)
```
- Controllers: validate input with Zod, call one service method, return result.
- Services: contain all business logic, call repositories only.
- Repositories: contain all DB queries, return typed Drizzle results.
- No raw SQL outside repositories. No `db.query` in services or controllers.

### Type Safety Contract
```
Drizzle schema → inferred types → tRPC input/output → Frontend types
```
- Use `typeof schema.$inferSelect` and `$inferInsert` from Drizzle — never duplicate types.
- tRPC procedures define all input shapes with Zod schemas.
- Frontend consumes tRPC inferred types via `RouterOutputs` and `RouterInputs` from `packages/trpc`.
- No manual `interface` or `type` definitions that duplicate DB schema shapes.

---

## TypeScript Rules
- `strict: true`, `noUncheckedIndexedAccess: true` in all `tsconfig.json`.
- Zero `any`. Use `unknown` + type narrowing if needed.
- No type assertions (`as Foo`) except when wrapping third-party untyped libs.
- All function parameters and return types explicitly typed in service and repository layers.
- Zod schemas defined once in `packages/trpc/src/schemas/` and imported by both layers.

---

## Folder Structure Rules

### apps/web
```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth route group
    (dashboard)/          # Protected route group
    deck/[id]/
  components/
    ui/                   # Primitive/reusable components only
    features/             # Feature-scoped components (decks, cards, progress)
  lib/
    trpc/                 # tRPC client setup
    auth/                 # Auth helpers
  hooks/                  # Client-side hooks only
```
- `components/ui/` contains no business logic — layout and display only.
- `components/features/` contains feature logic, calls tRPC.
- No API calls outside tRPC client.
- No `fetch()` in components. No `axios`.

### apps/api
```
src/
  modules/
    decks/
      decks.controller.ts
      decks.service.ts
      decks.repository.ts
      decks.module.ts
    cards/
    progress/
    subscriptions/
    users/
  common/
    guards/
    decorators/
    filters/
  trpc/                   # tRPC adapter wiring
  main.ts
```
- One NestJS module per domain feature.
- Module barrel exports only the module class and service (for injection).

### packages/db
```
src/
  schema/
    users.ts
    decks.ts
    cards.ts
    progress.ts
    subscriptions.ts
  index.ts               # exports db client + all schema
  migrate.ts
```
- Each schema file exports one or more Drizzle table definitions.
- `index.ts` is the only entry point for other packages.

### packages/trpc
```
src/
  routers/
    decks.ts
    cards.ts
    progress.ts
    subscriptions.ts
  schemas/               # Shared Zod schemas
  index.ts               # exports appRouter, AppRouter type
  context.ts             # tRPC context definition
```

---

## Backend Module Standards
- Each module has: `controller`, `service`, `repository`, `module` — no exceptions.
- Services are `@Injectable()`. Repositories are `@Injectable()`.
- Controllers receive `@Body()` typed with Zod-validated DTOs — use `ZodValidationPipe`.
- Guard authentication at the controller level with a `JwtAuthGuard`.
- Never put `if (user.subscriptionTier === ...)` logic in controllers.
- Services throw NestJS `HttpException` subclasses for known error cases.

---

## Database Standards (packages/db)
- All schema defined in Drizzle with `pgTable`.
- Use `uuid('id').defaultRandom().primaryKey()` for all PKs.
- Timestamps: `createdAt: timestamp().defaultNow().notNull()`, `updatedAt: timestamp().notNull()`.
- Soft deletes: `deletedAt: timestamp()` nullable — never hard delete user data.
- Migrations: run via `drizzle-kit` — never mutate schema without a migration file.
- All relations defined explicitly with `relations()` from drizzle-orm.
- No `any` in query results — use `db.select().from(table)` with explicit column selection.

---

## tRPC Rules
- All procedures: `publicProcedure` or `protectedProcedure` (with session check in context).
- Input always validated with a Zod schema from `packages/trpc/src/schemas/`.
- Output types inferred — never manually written.
- Mutations for all writes. Queries for all reads.
- Subscriptions router is separate (`subscriptions.ts`) — Stripe logic proxied through it.
- tRPC context provides `db`, `user`, `stripe` — no globals.
- Error handling: use `TRPCError` with appropriate codes (`UNAUTHORIZED`, `NOT_FOUND`, etc.).

---

## Stripe Integration Standards
- All Stripe logic in `apps/api/src/modules/subscriptions/`.
- Never expose Stripe secret key to frontend — not even via tRPC output.
- Webhook handler: separate NestJS controller at `/webhooks/stripe` with raw body parsing.
- `stripe.webhooks.constructEvent()` called in the webhook controller only.
- Subscription status synced to `subscriptions` table on every webhook event.
- Frontend checks subscription status via tRPC (`subscriptions.getStatus`) — never Stripe directly.
- Price IDs stored in environment variables — never hardcoded.
- Test mode and live mode keys in separate `.env` files (`.env.test`, `.env.production`).

---

## Frontend / Tailwind Rules
- Tailwind v4 — use CSS variables for design tokens, not `tailwind.config.js` theme extensions.
- Prefer React Server Components (RSC) — mark `'use client'` only when needed (event handlers, hooks, browser APIs).
- Data fetching in RSC via tRPC server-side caller — not client tRPC hooks.
- Client tRPC hooks (`api.x.useQuery`) only in `components/features/` client components.
- No inline styles. No `style={{}}` except for dynamic CSS variable assignment.
- Flashcard flip animation: CSS `perspective` + `rotateY` — no JS animation libraries.
- Files max 300 lines. Split at natural component boundaries.

---

## Testing Expectations
- Unit tests: services and repositories — mock DB with `drizzle-mock` or plain jest mocks.
- Integration tests: tRPC procedures with a test DB (Supabase local via Docker).
- E2E: Playwright for critical flows (signup, subscribe, study deck).
- No tests for controllers (covered by integration).
- Test files colocated: `decks.service.spec.ts` next to `decks.service.ts`.
- Stripe tests: use `stripe-mock` or recorded fixtures — never hit live Stripe in CI.

---

## Git Conventions
- Format: `type(scope): description` — e.g. `feat(decks): add card reorder endpoint`
- Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`
- Scopes match module names: `decks`, `cards`, `progress`, `subscriptions`, `auth`, `db`, `trpc`
- No commit touches more than one module unless it's a migration + corresponding service change.
- PRs require: passing CI, no TypeScript errors, no ESLint warnings.

---

## Context Management Rules for Claude
- Always read the relevant `*.module.ts` before adding a new module dependency.
- Always read `packages/db/src/schema/` before writing a repository query.
- Always read `packages/trpc/src/schemas/` before writing a new tRPC procedure.
- When adding a feature: create schema → migration → repository → service → tRPC procedure → frontend component (in that order).
- When asked to "add a feature," ask for the domain entity name and user story before writing code.
- Never create a file without first confirming the target folder exists.
- Prefer editing existing files over creating new ones.
- If a file exceeds 300 lines, split before adding more code.

---

## Custom Skills

### /add-feature [name]
1. Create Drizzle schema in `packages/db/src/schema/[name].ts`
2. Generate migration with `drizzle-kit generate`
3. Create `[name].repository.ts` → `[name].service.ts` → `[name].controller.ts` → `[name].module.ts`
4. Register module in `AppModule`
5. Add tRPC router in `packages/trpc/src/routers/[name].ts` and merge into `appRouter`
6. Add Zod schemas to `packages/trpc/src/schemas/[name].ts`
7. Create `components/features/[name]/` in `apps/web`

### /refactor [file]
1. Read file fully before any edits
2. Identify layering violations, duplicated types, missing Zod validation
3. Fix violations one at a time with minimal diff
4. Run TypeScript check after each change

### /add-subscription-flow
1. Add `subscriptions` Drizzle schema if missing
2. Create Stripe product + price in test mode (output IDs for env)
3. Implement `subscriptions.service.ts`: `createCheckoutSession`, `cancelSubscription`, `getStatus`
4. Add webhook handler for `customer.subscription.updated` and `customer.subscription.deleted`
5. Add tRPC `subscriptions` router: `getStatus`, `createCheckoutSession`
6. Gate premium deck access in `decks.service.ts` by checking subscription status

---

## Performance Guardrails
- No `SELECT *` — always select explicit columns in repositories.
- Paginate all list queries — default page size 20, max 100.
- Add DB indexes on all foreign keys and frequently filtered columns.
- RSC data fetching: use `React.cache()` for repeated queries within one request.
- No waterfalling tRPC calls — batch or use `Promise.all` in server components.

---

## Scalability Guardrails
- Supabase Row Level Security (RLS) enabled on all tables — verify policies before launch.
- Feature flags: use a `features` table or env vars — no hardcoded feature checks.
- Spaced repetition algorithm: isolated in `packages/srs/` when implemented — zero coupling to deck module.
- AI deck generation: isolated in `apps/api/src/modules/ai-decks/` — calls external API, never blocks main flow.
- Never store Stripe customer ID in `users` table — use a separate `stripe_customers` table.
