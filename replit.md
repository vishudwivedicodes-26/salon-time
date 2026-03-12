# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: Salon Booking Micro-SaaS

A salon appointment booking platform that connects salon owners with their clients, reducing waiting time and helping clients book services in advance.

### Features
- **Client side**: Browse salons, pick a service, select available time slots, book appointment
- **Owner side**: Manage salon info, add/edit services, view and manage bookings
- **Smart scheduling**: Available slots calculated based on salon hours, service duration, and existing bookings
- **Status management**: Bookings can be pending, confirmed, completed, or cancelled

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── salon-booking/      # React + Vite frontend (root /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **salons**: id, name, ownerName, phone, address, openTime, closeTime, createdAt
- **services**: id, salonId, name, description, durationMinutes, price, createdAt
- **bookings**: id, salonId, serviceId, clientName, clientPhone, date, time, status, notes, createdAt

## API Endpoints

- `GET /api/salons` — list all salons
- `POST /api/salons` — create a salon
- `GET /api/salons/:id` — get salon
- `GET /api/salons/:id/services` — list services
- `POST /api/salons/:id/services` — create service
- `GET /api/salons/:id/slots?date=&serviceId=` — available time slots
- `GET /api/bookings?salonId=&date=` — list bookings
- `POST /api/bookings` — create booking
- `GET /api/bookings/:id` — get booking
- `PATCH /api/bookings/:id` — update booking status

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
