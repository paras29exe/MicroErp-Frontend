import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getMyProfile, updateMyProfile } from '@/features/users/users.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { getApiMessage } from '@/lib/api-response'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isStrongPassword(value) {
  if (!value || value.length < 8) return false
  if (!/[A-Z]/.test(value)) return false
  if (!/[a-z]/.test(value)) return false
  if (!/\d/.test(value)) return false
  if (!/[^A-Za-z0-9]/.test(value)) return false
  return true
}

export function ProfilePage() {
  const setUser = useAuthStore((state) => state.setUser)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [original, setOriginal] = useState(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  })

  async function loadProfile() {
    setLoading(true)
    setError('')

    try {
      const data = await getMyProfile()
      setOriginal(data)
      setUser(data)
      setForm((prev) => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }))
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load profile'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const summaryRole = useMemo(() => {
    return String(original?.role || '')
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase())
  }, [original?.role])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (!name) {
      setError('Name is required')
      return
    }

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    const shouldChangePassword = showPasswordFields && Boolean(form.password || form.currentPassword || form.confirmPassword)

    if (shouldChangePassword && form.password && !isStrongPassword(form.password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number and special character')
      return
    }

    if (shouldChangePassword && form.password && form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match')
      return
    }

    if (shouldChangePassword && form.password && !form.currentPassword) {
      setError('Current password is required to set a new password')
      return
    }

    const payload = {}

    if (name !== (original?.name || '')) {
      payload.name = name
    }

    if (email !== (original?.email || '')) {
      payload.email = email
    }

    if (shouldChangePassword && form.password) {
      payload.password = form.password
      payload.currentPassword = form.currentPassword
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No profile changes to save')
      return
    }

    setSaving(true)
    try {
      const updated = await updateMyProfile(payload)
      setOriginal(updated)
      setUser(updated)
      setForm((prev) => ({
        ...prev,
        name: updated.name || '',
        email: updated.email || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }))
      setShowPasswordFields(false)
      toast.success('Profile updated successfully')
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading profile...</div>
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">My Profile</h2>
        <p className="text-xs text-slate-500">Update your personal account details</p>
      </header>

      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="border border-slate-300 bg-white p-3">
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
            <p className="text-slate-500">Employee ID</p>
            <p className="font-semibold text-slate-800">{original?.employeeId || '-'}</p>
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
            <p className="text-slate-500">Role</p>
            <p className="font-semibold text-slate-800">{summaryRole || '-'}</p>
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
            <p className="text-slate-500">Status</p>
            <p className="font-semibold text-slate-800">{original?.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <form className="grid gap-2 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Full name"
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <div className="md:col-span-2 flex items-center justify-between rounded-sm border border-slate-200 bg-slate-50 px-2 py-2">
            <p className="text-xs text-slate-600">Need to change password?</p>
            <button
              type="button"
              onClick={() => {
                setShowPasswordFields((prev) => {
                  const next = !prev
                  if (!next) {
                    setForm((current) => ({
                      ...current,
                      currentPassword: '',
                      password: '',
                      confirmPassword: '',
                    }))
                  }
                  return next
                })
              }}
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            >
              {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
            </button>
          </div>

          {showPasswordFields && (
            <>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                placeholder="Current password"
                className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="New password"
                className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
              />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Confirm new password"
                className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
              />
              <p className="text-[11px] text-slate-500 md:col-span-2">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>
    </section>
  )
}
