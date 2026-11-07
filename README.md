# 🏋️ Power Zone Gym — Gym Management App

A full-stack gym management web application: member registration, role-based dashboards, monthly payments (Stripe + cash), attendance check-ins with streaks, and personal day-by-day workout plans for every member.

**Stack:** Next.js 14 (App Router) · TypeScript · MongoDB/Mongoose · NextAuth (credentials, JWT) · Tailwind CSS · Framer Motion · Stripe · Zustand · React Hook Form + Zod · SWR · Recharts · date-fns · Lucide

All visuals are pure CSS/SVG: gradients, grid/dot patterns, animated shapes, glassmorphism, avatar initials. No stock images are used. Places where real gym photos can go are marked with `ADD GYM PHOTO HERE LATER` comments.

---

## Quick start

```bash
npm install

# 1. Configure environment
cp .env.example .env.local      # then fill in MONGODB_URI (+ Stripe keys for online payments)

# 2. Seed the default admin + realistic sample data
npm run seed                    # or: npm run seed:admin   (admin only)
                                #     npm run seed -- --reset (wipe & reseed)

# 3. Run
npm run dev                     # http://localhost:3000
```

### Default accounts

| Role   | Email                 | Password    |
| ------ | --------------------- | ----------- |
| Admin  | `admin@gym.com`       | `admin123`  |
| Member | `kasun@example.com` (and the other seeded members) | `member123` |

> Change the default admin password before going live. To do that, edit the admin block in `scripts/seed.ts` and re-seed into a fresh database, or update the bcrypt hash directly in MongoDB.

### Environment variables (`.env.local`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `NEXTAUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode: `sk_test_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (reserved for client-side Stripe use) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint (`whsec_…`) |
| `STRIPE_CURRENCY` | Checkout currency, default `lkr` (use `inr`/`pkr` as needed) |

The app runs without Stripe keys. In that case "Pay Now" shows a friendly message and cash payments still work.

---

## Stripe setup (online payments)

1. Put your test keys in `.env.local`.
2. Forward webhooks locally with the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
3. Pay with test card `4242 4242 4242 4242`, any future date, any CVC.

Flow: **Pay Now** → `POST /api/payments` creates a Checkout Session → Stripe → redirect back to `/member/payments?status=success&session_id=…`. The page calls `/api/payments/verify`, which marks the payment paid immediately, and the webhook (`checkout.session.completed`) confirms it server-to-server. Both paths are idempotent.

---

## Features

### Public
- Animated landing page: gradient hero, floating SVG gym equipment, typewriter tagline, scroll reveals, live pricing, info cards.
- 4-step registration (personal → physical → plan → review) with Zod validation, live BMI, progress bar, and a success animation with confetti. It auto-creates the first month's pending payment and signs the member in.
- Glassmorphism login with role-based redirect. "Forgot password" tells the member to contact the front desk.

### Admin (`/admin`)
- **Dashboard:** animated stat counters, 6-month revenue chart (area/bar), activity feed, membership mix, quick actions.
- **Members:** search, filter by category, payment status and active state, server-side sort and pagination, mobile card layout. Add members via the same 4-step form.
- **Member detail:** profile, body details and weight trend, attendance calendar, payment history, workout plan summary. Edit, change category, reset password, deactivate/reactivate, delete (with confirmation), mark cash payment, manual check-in.
- **Payments:** month picker with a prominent collected total, collection rate, expected/pending/overdue totals, per-category breakdown, status tabs and category/method/search filters, "Mark cash" per row, "Generate dues".
- **Attendance:** day view with date picker and manual check-in, average daily attendance, busiest day, heatmap calendar, most active members, member lookup.
- **Workout plans** (`/admin/charts`): every member gets their own plan; there is no shared template library.
  - The overview lists every active member with plan status. "Need a plan" shows who still needs one.
  - The editor (`/admin/charts/[memberId]`) has plan title, gym name, start date and trainer notes, then Day 1…N with a title (e.g. "Chest & Biceps") and exercise rows of name, free-form sets/reps (`12 10 8`, `10-3`, `4 x 12`, `Till failure`) and notes.
  - Days can be added, duplicated, reordered and collapsed. Pressing Enter in the sets/reps or notes field jumps to the next row. Exercise names and day titles autocomplete.
  - **Import from WhatsApp:** paste a routine exactly as sent on WhatsApp. "1 day" / "Day 2 - Legs" headings, sets and bracketed notes are detected, and WhatsApp copy prefixes like `[18:30, 06/11/2026] Sachin Gym:` are stripped.
  - **Copy from another member** gives you a starting point to tweak.
  - **Send on WhatsApp** opens a chat with the member, with the plan pre-formatted. You can also copy the text or print it.
  - A live preview shows exactly what the member will see.
- **Settings:** edit membership pricing, optionally re-pricing this month's pending dues.

### Member (`/member`)
- **Dashboard:** greeting and daily motivational quote, stats, a large animated **Mark Attendance** button ("Already Checked In Today ✅"), workout plan preview with day switcher, payment-due banner.
- **Payments:** big PAID ✅ / PAYMENT DUE ⚠️ card, Stripe **Pay Now**, overdue alerts, full history.
- **My Workout Plan:** day tabs (or all days at once), each exercise with its sets/reps and notes, plus the trainer's notes. It has a print-friendly layout and checks for trainer edits every 30 s, so changes appear without a refresh. An animated empty state shows until a plan is created.
- **Attendance:** streak counter, monthly calendar (attended days in green), check-in times, history by month.
- **Profile:** contact and body details (weight changes are logged and charted), profile photo upload, membership info.

### Payment status rules
- Current month, unpaid → **pending** (yellow)
- Past month, unpaid → **overdue** (red)
- Confirmed (online or cash) → **paid** (green)

Pending records for every active member are generated automatically for the current month. This happens at login and on admin dashboard and payments requests, throttled and idempotent through a unique `(member, year, month)` index. Leftover pending records from past months are flipped to overdue.

---

## API

All endpoints return `{ success: true, data }` or `{ success: false, error }` with proper HTTP status codes.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/members` | admin | List (search, category, paymentStatus, active, sort, page) · `?lite=1` for dropdowns |
| POST | `/api/members` | public/admin | Register a member (+ first pending payment) |
| GET/PUT | `/api/members/:id` | admin or self | Get or update (members can edit a limited set of fields) |
| DELETE | `/api/members/:id` | admin | Permanently delete with payments and attendance |
| GET | `/api/payments` | admin / member | Admin: filtered list · Member: own history |
| POST | `/api/payments` | member / admin | Member: Stripe Checkout session · Admin: generate dues for a month |
| POST | `/api/payments/mark-cash` | admin | Mark a month paid in cash |
| GET | `/api/payments/monthly-summary` | admin | Expected / collected / pending / overdue totals |
| GET | `/api/payments/verify` | member | Confirm a Checkout Session on return |
| POST | `/api/payments/stripe-webhook` | Stripe | Webhook handler (signature verified) |
| GET | `/api/attendance` | admin | Day list + monthly stats (heatmap, top members, average) |
| POST | `/api/attendance` | member / admin | Check in (one per day, enforced by unique index) |
| GET | `/api/attendance/member/:id` | admin or self | History, streaks, totals |
| GET | `/api/workout-plans` | admin | Active members with plan summary (search, category, status=with/without) |
| GET | `/api/workout-plans/:memberId` | admin or self | The member's plan (or `null`) |
| PUT | `/api/workout-plans/:memberId` | admin | Create or replace the member's plan |
| DELETE | `/api/workout-plans/:memberId` | admin | Delete the member's plan |
| GET | `/api/dashboard/stats` | admin / member | Role-specific dashboard data |
| GET/PUT | `/api/settings` | public / admin | Membership pricing |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/login, register          # public auth pages
│   ├── (dashboard)/admin/...           # admin pages (+ settings)
│   ├── (dashboard)/member/...          # member pages
│   ├── api/...                         # route handlers
│   ├── layout.tsx, page.tsx, providers.tsx, globals.css
├── components/
│   ├── ui/          # Button, Input/Select/Textarea, Card, Modal/ConfirmModal, Table/Pagination,
│   │                # Badge, Loader/Skeletons, Avatar, Sidebar, AnimatedCounter, EmptyState,
│   │                # PageHeader/Breadcrumbs, MonthPicker, SuccessBurst/Confetti
│   ├── layout/      # Navbar, AdminSidebar, MemberSidebar, DashboardShell, Footer, Logo
│   ├── landing/     # Hero sections, SVG gym shapes, Typewriter, Reveal
│   ├── forms/       # RegisterForm, LoginForm, PaymentForm, MemberEditForm
│   ├── dashboard/   # StatsCard, RevenueChart, MemberTable, PaymentStatusBadge,
│   │                # AttendanceCalendar, ActivityFeed, CheckInButton, WeightChart
│   └── workout/     # WorkoutPlanForm, ImportWhatsAppModal, PlanViewer, PlanPreview
├── lib/             # db, auth, api helpers, stripe, payments, settings, validations, utils, constants,
│                    # workoutPlan (WhatsApp parser/formatter)
├── models/          # User, Payment, Attendance, MemberWorkoutPlan, Settings
├── hooks/           # useAuth, useFetch (SWR), useDebounce
├── store/           # Zustand UI store
├── types/           # shared TS types + next-auth augmentation
└── middleware.ts    # route protection (auth + role)
scripts/seed.ts      # admin + sample data
```

## Security notes
- Passwords are hashed with bcrypt (12 rounds). Sessions are signed JWTs, and NextAuth handles CSRF on sign-in.
- Middleware protects `/admin/*` (admins only) and `/member/*` (members only). Every API route also checks auth and role on the server.
- JSON bodies are stripped of `$`-prefixed and dotted keys to prevent operator injection. All inputs are validated with Zod.
- Comments mark where to add **rate limiting** (login, registration) before going to production.
- Uploaded profile photos are compressed client-side and size-checked server-side. They are stored as data URLs in MongoDB. Move them to object storage (S3, Cloudinary) if you expect many large images.
