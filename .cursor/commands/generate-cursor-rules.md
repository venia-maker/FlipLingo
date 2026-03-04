# FlipLingo Cursor Rules

Below are production-ready Cursor rule files to be created inside `.cursor/rules/`.

---

## 1. project-architecture.mdc

Store at: `.cursor/rules/project-architecture.mdc`

```
---
alwaysApply: true
---
# FlipLingo Architecture Guide

FlipLingo is a monorepo with the following structure:

- apps/web (Next.js App Router frontend)
- apps/api (NestJS backend)
- packages/db (Drizzle schema + migrations)
- packages/trpc (tRPC routers + shared types)

Backend layering rule:
Controller → Service → Repository → Database

- No business logic in controllers
- No database access in controllers
- Stripe logic only inside services
- Repositories handle Drizzle queries only

Frontend rules:
- Prefer React Server Components
- Client components only when interaction is required
- All data fetching via tRPC

Never duplicate types. Types must flow:
Drizzle → tRPC → Frontend
```

---

## 2. typescript-standards.mdc

Store at: `.cursor/rules/typescript-standards.mdc`

```
---
globs: *.ts,*.tsx
---
# TypeScript Standards

- Strict mode enabled
- No `any` types allowed
- Use Zod for all validation
- Infer types from tRPC procedures
- Prefer early returns
- Maximum 300 lines per file

Never manually duplicate API response types.
```

---

## 3. database-rules.mdc

Store at: `.cursor/rules/database-rules.mdc`

```
---
description: Drizzle and Supabase database constraints
---
# Database Rules

- All schema defined in Drizzle (packages/db)
- Use UUID primary keys
- All tables must include: createdAt, updatedAt
- Soft delete preferred over hard delete
- No raw SQL unless performance critical

Never access Supabase directly from the frontend.
```

---

## 4. trpc-rules.mdc

Store at: `.cursor/rules/trpc-rules.mdc`

```
---
description: tRPC contract and routing rules
---
# tRPC Rules

- All routes defined in packages/trpc
- Validate all input with Zod
- Use protectedProcedure for authenticated routes
- Routers delegate to NestJS services
- Never perform direct DB queries in routers
```

---

## 5. stripe-billing.mdc

Store at: `.cursor/rules/stripe-billing.mdc`

```
---
description: Stripe billing and subscription standards
---
# Stripe Billing Rules

- Stripe logic backend only
- Verify all webhook signatures
- Sync subscription state to database
- Subscription status source of truth: database

Handle events:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

Never trust client-side subscription state.
```

---

## 6. tailwind-frontend.mdc

Store at: `.cursor/rules/tailwind-frontend.mdc`

```
---
globs: *.tsx
---
# Tailwind + Frontend Rules

- Tailwind CSS v4 utility-first only
- No inline styles
- Extract reusable components after 3 repetitions
- Maintain consistent spacing scale
- Design must be dark-mode ready
```

---

Create these files inside `.cursor/rules/` exactly as shown.
