# HotelPilot — Frontend

HotelPilot is a hotel management and RFID smart access control platform. This
package contains the **frontend-only prototype**: a complete, interactive UI
with simulated functionality backed by a centralized mock data layer and
`localStorage` persistence. No backend, database, or real authentication is
wired up yet — the existing Django project in [`../backend`](../backend) will
be connected in a later phase.

## Tech stack

- React 19 + Vite, with JavaScript application source and TypeScript-based tooling
- React Router (`react-router-dom`, `HashRouter`)
- Tailwind CSS v4 (brand theme defined in `src/index.css`)
- shadcn/ui + base-ui primitives for low-level components (e.g. `Button`)
- React Icons (`react-icons/fi`) for iconography
- Recharts for dashboard and report charts

## Getting started

```bash
npm install
npm run dev
```

### Demo accounts

Sign in on the login screen with any of the following (password:
`password123`):

| Email                     | Role          |
| ------------------------- | ------------- |
| admin@hotelpilot.com      | Administrator |
| manager@hotelpilot.com    | Manager       |
| reception@hotelpilot.com  | Receptionist  |
| accounts@hotelpilot.com   | Accountant    |

## Project structure

```
src/
├── components/        # Reusable UI building blocks
│   ├── charts/         # ChartCard wrapper around Recharts
│   ├── common/         # StatusBadge, Modal, DataTable helpers, etc.
│   ├── forms/           # FormInput, FormSelect, FormTextarea, DatePicker
│   ├── tables/          # Generic DataTable
│   └── ui/              # shadcn/ui primitives (Button, ...)
├── context/            # AppDataContext (mock data + CRUD), AuthContext, ToastContext
├── data/               # Seed data for ~25 rooms, guests, reservations, etc.
├── hooks/              # Shared hooks (e.g. useSyncOnChange)
├── layouts/            # Sidebar, Topbar, DashboardLayout
├── lib/                # Formatting, CSS class merging, CSV export helpers
├── pages/              # One folder per module (Dashboard, Reservations, ...)
├── routes/             # ProtectedRoute guard
├── services/           # localStorage wrapper
```

## Data & persistence

All hotel data (guests, rooms, reservations, RFID cards, access logs,
payments, staff, settings) lives in `AppDataContext` and is persisted to
`localStorage` on every change, so changes survive page reloads. Key
cross-module workflows (check-in, checkout, payments, card lifecycle) are
implemented as single context actions so the room, reservation, RFID card and
access log records always stay consistent with one another.

## Adding shadcn/ui components

```bash
npx shadcn@latest add <component>
```
