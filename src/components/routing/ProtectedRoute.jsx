import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading GrowthOS…</p>
    </div>
  )
}

// Requires auth. If onboarding not completed, redirects to /onboarding
export function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />

  // If profile loaded and onboarding not done, redirect (only from /dashboard)
  if (profile && !profile.onboarding_completed && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

// Only for unauthenticated users. Authenticated users go to dashboard.
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// Onboarding: requires auth. If already completed, skip to dashboard.
export function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />
  return children
}
