import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute, OnboardingRoute } from './components/routing/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import GoalsPage from './pages/dashboard/GoalsPage'
import HabitsPage from './pages/dashboard/HabitsPage'
import JournalPage from './pages/dashboard/JournalPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import TasksPage from './pages/dashboard/TasksPage'
import FocusPage from './pages/dashboard/FocusPage'
import CoachPage from './pages/dashboard/CoachPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public root → Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth (redirects to dashboard if already signed in) */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Onboarding (requires auth, redirects away if already completed) */}
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingPage />
              </OnboardingRoute>
            }
          />

          {/* Protected dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="focus" element={<FocusPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
