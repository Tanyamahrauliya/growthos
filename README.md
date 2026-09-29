# 🌱 GrowthOS — Personal Growth OS

Your Personal Growth Operating System. Track goals, build habits, and journal — all in one beautifully designed workspace.

## Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + custom design system
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Routing**: React Router v7

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.jsx       # Auth state, signIn/signUp/signOut/updateProfile
├── components/
│   └── routing/
│       └── ProtectedRoute.jsx # ProtectedRoute + PublicRoute guards
├── layouts/
│   └── DashboardLayout.jsx   # Sidebar shell with nav
├── lib/
│   └── supabase.js           # Supabase client singleton
├── pages/
│   ├── AuthPage.jsx          # Sign in / Sign up
│   └── dashboard/
│       ├── DashboardHome.jsx
│       ├── GoalsPage.jsx
│       ├── HabitsPage.jsx
│       ├── JournalPage.jsx
│       └── ProfilePage.jsx
├── App.jsx                   # Router + route definitions
├── main.jsx                  # Entry point
└── index.css                 # Full design system
supabase/
└── schema.sql                # Full DB schema + RLS policies
```

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon/public key**

### 2. Configure Environment Variables

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Database Schema

1. In the Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- `profiles` — extended user profiles (auto-created on signup via trigger)
- `goals` — goal tracking
- `habits` — habit definitions
- `habit_logs` — habit completion records
- `journal_entries` — private journal entries

All tables have **Row Level Security** — users can only access their own data.

### 4. Run Locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profiles (linked to `auth.users`) |
| `goals` | User goals with status, progress, target date |
| `habits` | Recurring habits (daily/weekly/monthly) |
| `habit_logs` | Per-day completion records |
| `journal_entries` | Private journal with mood tracking |

All tables have `user_id → auth.users(id)` foreign keys and RLS policies so users only see their own data.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to `/auth` |
| `/auth` | Public only | Sign in / Sign up |
| `/dashboard` | Protected | Dashboard home |
| `/dashboard/goals` | Protected | Goals |
| `/dashboard/habits` | Protected | Habits |
| `/dashboard/journal` | Protected | Journal |
| `/dashboard/profile` | Protected | User profile |
