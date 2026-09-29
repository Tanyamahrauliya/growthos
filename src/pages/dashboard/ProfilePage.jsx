import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    timezone: profile?.timezone || 'UTC',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setMessage(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { error } = await updateProfile(form)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile saved successfully!' })
    }
    setSaving(false)
  }

  const avatarInitial = (profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-large">{avatarInitial}</div>
          <p className="profile-avatar-name">{profile?.full_name || '—'}</p>
          <p className="profile-avatar-email">{user?.email}</p>
          <div className="profile-meta">
            <div className="profile-meta-row">
              <span className="profile-meta-label">User ID</span>
              <span className="profile-meta-value profile-meta-mono">{user?.id?.slice(0, 8)}…</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-label">Member since</span>
              <span className="profile-meta-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="profile-form-card">
          <h2 className="profile-form-title">Edit Profile</h2>

          {message && (
            <div className={`auth-alert ${message.type === 'error' ? 'auth-alert-error' : 'auth-alert-success'}`}>
              {message.type === 'error' ? '⚠️' : '✅'} {message.text}
            </div>
          )}

          <form id="form-profile" onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="profile-name" className="form-label">Full name</label>
              <input
                id="profile-name"
                name="full_name"
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email" className="form-label">Email</label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                title="Email cannot be changed here"
              />
              <p className="form-hint">Email cannot be changed from this form.</p>
            </div>
            <div className="form-group">
              <label htmlFor="profile-bio" className="form-label">Bio</label>
              <textarea
                id="profile-bio"
                name="bio"
                className="form-input form-textarea"
                placeholder="Tell us a little about yourself…"
                rows={3}
                value={form.bio}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-timezone" className="form-label">Timezone</label>
              <input
                id="profile-timezone"
                name="timezone"
                type="text"
                className="form-input"
                placeholder="UTC"
                value={form.timezone}
                onChange={handleChange}
              />
            </div>
            <button
              id="btn-save-profile"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
