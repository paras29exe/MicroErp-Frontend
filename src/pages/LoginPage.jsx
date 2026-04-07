import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getMyEffectivePermissions, login } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiMessage } from '@/lib/api-response'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or employee ID is required'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function onSubmit(values) {
    setErrorMessage('')

    try {
      const payload = {
        password: values.password,
      }

      if (values.identifier.includes('@')) {
        payload.email = values.identifier.trim().toLowerCase()
      } else {
        payload.employeeId = values.identifier.trim()
      }

      const user = await login(payload)
      const permissionData = await getMyEffectivePermissions().catch(() => null)
      setUser({
        ...user,
        effectivePermissions: permissionData?.effectivePermissions || [],
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(getApiMessage(error, 'Login failed'))
    }
  }

  return (
    <div className="erp-desktop-min min-h-screen bg-slate-100 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] sm:p-8">
          <div className="mb-7 border-b border-slate-200 pb-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">MicroERP</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in to your workspace</h1>
            <p className="mt-1 text-sm text-slate-600">Use your email or employee ID credentials to continue.</p>
          </div>

          <div className="mb-6 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Secure access with role-based permissions.
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="identifier">
                Email or Employee ID
              </label>
              <Input
                id="identifier"
                type="text"
                className="h-10 rounded-sm border-slate-300 bg-white"
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-xs text-red-700">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                className="h-10 rounded-sm border-slate-300 bg-white"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-700">{errors.password.message}</p>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-sm bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="pt-1 text-center text-xs text-slate-500">
              Authorized access only. All activity is logged for audit compliance.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
