import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', end: true, id: 'nav-dashboard' },
  { to: '/dashboard/goals', icon: '🎯', label: 'Goals', id: 'nav-goals' },
  { to: '/dashboard/habits', icon: '🔁', label: 'Habits', id: 'nav-habits' },
  { to: '/dashboard/tasks', icon: '✅', label: 'Tasks', id: 'nav-tasks' },
  { to: '/dashboard/focus', icon: '⏱️', label: 'Focus', id: 'nav-focus' },
  { to: '/dashboard/journal', icon: '📓', label: 'Journal', id: 'nav-journal' },
  { to: '/dashboard/coach', icon: '🧠', label: 'Coach', id: 'nav-coach' },
  { to: '/dashboard/profile', icon: '👤', label: 'Profile', id: 'nav-profile' },
]


export default function DashboardLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/auth', { replace: true })
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarInitial = (profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="dashboard-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-logo">🌱</span>
          <span className="sidebar-brand-name">GrowthOS</span>
          <button
            id="btn-close-sidebar"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{avatarInitial}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{displayName}</p>
            <p className="sidebar-user-email">{user?.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <ul className="sidebar-nav-list">
            {NAV_ITEMS.map(({ to, icon, label, end, id }) => (
              <li key={to}>
                <NavLink
                  id={id}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{icon}</span>
                  <span className="nav-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="sidebar-footer">
          <button
            id="btn-signout"
            className="btn-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <span>🚪</span>
            <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <button
            id="btn-open-sidebar"
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div className="topbar-right">
            <div className="topbar-avatar">{avatarInitial}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content" id="main-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
