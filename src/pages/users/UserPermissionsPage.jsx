import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import {
  createUserOverride,
  getUserById,
  getUserEffectivePermissions,
  getUserOverrides,
  revokeUserOverride,
} from '@/features/users/users.api'
import { PageLoader } from '@/components/common/page-loader'
import { getApiMessage } from '@/lib/api-response'
import { formatDateTimeDDMMYYYY } from '@/lib/date-format'

function formatRoleLabel(role) {
  return String(role || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function UserPermissionsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const userId = Number.parseInt(id || '', 10)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [user, setUser] = useState(null)
  const [effectiveData, setEffectiveData] = useState(null)
  const [overrideItems, setOverrideItems] = useState([])

  const [grantForm, setGrantForm] = useState({
    expiresAt: '',
    reason: '',
  })
  const [selectedGrantPermissions, setSelectedGrantPermissions] = useState([])
  const [selectedRevokeOverrideIds, setSelectedRevokeOverrideIds] = useState([])

  async function loadData() {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Invalid user id')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [userData, permissionsData, overridesData] = await Promise.all([
        getUserById(userId),
        getUserEffectivePermissions(userId),
        getUserOverrides(userId),
      ])

      setUser(userData)
      setEffectiveData(permissionsData)
      setOverrideItems(Array.isArray(overridesData) ? overridesData : [])

      setSelectedGrantPermissions([])
      setSelectedRevokeOverrideIds([])
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load permission details'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const effectivePermissions = useMemo(() => {
    return Array.isArray(effectiveData?.effectivePermissions)
      ? effectiveData.effectivePermissions
      : []
  }, [effectiveData])

  const permissionCatalog = useMemo(() => {
    return Array.isArray(effectiveData?.permissionCatalog)
      ? effectiveData.permissionCatalog
      : []
  }, [effectiveData])

  const grantedOverrides = useMemo(
    () => overrideItems.filter((override) => override.effect === 'GRANT'),
    [overrideItems],
  )

  const ungrantedPermissions = useMemo(
    () => permissionCatalog.filter((permission) => !effectivePermissions.includes(permission)),
    [permissionCatalog, effectivePermissions],
  )

  function toggleGrantPermission(permission) {
    setSelectedGrantPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    )
  }

  function toggleRevokeOverride(overrideId) {
    setSelectedRevokeOverrideIds((current) =>
      current.includes(overrideId)
        ? current.filter((item) => item !== overrideId)
        : [...current, overrideId],
    )
  }

  async function handleGrantPermission(event) {
    event.preventDefault()

    if (selectedGrantPermissions.length === 0) {
      setError('Please select at least one permission to grant')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const results = await Promise.allSettled(
        selectedGrantPermissions.map((permission) =>
          createUserOverride(userId, {
            permission,
            effect: 'GRANT',
            expiresAt: grantForm.expiresAt || null,
            reason: grantForm.reason.trim() || null,
          }),
        ),
      )

      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failedCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`${successCount} permission(s) granted successfully`)
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} permission(s) failed to grant`)
      }

      setGrantForm({ expiresAt: '', reason: '' })
      setSelectedGrantPermissions([])
      await loadData()
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to grant permission'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevokeGranted() {
    if (selectedRevokeOverrideIds.length === 0) {
      setError('Please select at least one granted permission to revoke')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const results = await Promise.allSettled(
        selectedRevokeOverrideIds.map((overrideId) => revokeUserOverride(userId, overrideId)),
      )

      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failedCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`${successCount} granted permission(s) revoked successfully`)
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} revoke operation(s) failed`)
      }

      setSelectedRevokeOverrideIds([])
      await loadData()
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to revoke granted permission'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading permission management..." />
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">User Permissions</h2>
          <p className="text-xs text-slate-500">
            Manage permission access for {user?.name || 'user'} ({user?.employeeId || '-'})
          </p>
          <p className="text-xs text-slate-400">
            Role: {formatRoleLabel(user?.role)} | Effective permissions: {effectivePermissions.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={loadData}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="border border-slate-300 bg-white p-3">
          <h3 className="text-xs font-semibold text-slate-700">Grant Ungranted Permission</h3>
          <p className="mt-1 text-xs text-slate-500">
            Select a permission the user currently does not have and grant it.
          </p>

          <form className="mt-3 space-y-3" onSubmit={handleGrantPermission}>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Ungranted Permissions Checklist
              </label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-sm border border-slate-200 bg-slate-50 p-2">
                {ungrantedPermissions.length === 0 && (
                  <p className="text-xs text-slate-500">All permissions are already granted.</p>
                )}
                {ungrantedPermissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedGrantPermissions.includes(permission)}
                      onChange={() => toggleGrantPermission(permission)}
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Expiry (Optional)
              </label>
              <input
                type="datetime-local"
                value={grantForm.expiresAt}
                onChange={(event) =>
                  setGrantForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                }
                className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={grantForm.reason}
                onChange={(event) =>
                  setGrantForm((prev) => ({ ...prev, reason: event.target.value }))
                }
                placeholder="Enter reason for granting"
                className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
              />
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-3">
              <button
                type="submit"
                disabled={submitting || ungrantedPermissions.length === 0}
                className="rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Granting...' : 'Grant Selected Permissions'}
              </button>
            </div>
          </form>
        </article>

        <article className="border border-slate-300 bg-white p-3">
          <h3 className="text-xs font-semibold text-slate-700">Revoke Granted Permission</h3>
          <p className="mt-1 text-xs text-slate-500">
            Revoke permissions that were explicitly granted as overrides.
          </p>

          <div className="mt-3 space-y-3">
            {grantedOverrides.length === 0 && (
              <p className="text-xs text-slate-500">No granted overrides available to revoke.</p>
            )}

            {grantedOverrides.length > 0 && (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-sm border border-slate-200 bg-slate-50 p-2">
                {grantedOverrides.map((override) => (
                  <label
                    key={override.id}
                    className="flex items-start gap-2 rounded-sm border border-slate-200 bg-white px-2 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRevokeOverrideIds.includes(override.id)}
                      onChange={() => toggleRevokeOverride(override.id)}
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">{override.permission}</span>
                      <span className="block text-slate-600">
                        Expires: {override.expiresAt ? formatDateTimeDDMMYYYY(override.expiresAt) : 'Never'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-200 pt-3">
              <button
                type="button"
                disabled={submitting || grantedOverrides.length === 0}
                onClick={handleRevokeGranted}
                className="rounded-sm border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Revoking...' : 'Revoke Selected Permissions'}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="border border-slate-300 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700">Current Effective Permissions</h3>
          <Link to="/users" className="text-xs text-blue-700 hover:underline">
            Back to User List
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {effectivePermissions.length === 0 && (
            <p className="text-xs text-slate-500">No effective permissions available.</p>
          )}
          {effectivePermissions.map((permission) => (
            <span
              key={permission}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800"
            >
              {permission}
            </span>
          ))}
        </div>
      </section>
    </section>
  )
}
