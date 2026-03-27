import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiMessage } from '@/lib/api-response'
import loginOfficeImage from '@/assets/login-office.svg'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or employee ID is required'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [errorMessage, setErrorMessage] = useState('')
  const trustSignals = ['Role-based access control', 'Encrypted session management', 'Real-time operational sync']

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
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(getApiMessage(error, 'Login failed'))
    }
  }

  return (
    <div className="erp-desktop-min relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute right-8 bottom-0 h-64 w-64 rounded-full bg-green-200/40 blur-3xl" />
      </div>

      <section className="relative grid min-h-screen grid-cols-1 md:grid-cols-[1.25fr_1fr]">
        <div className="relative hidden border-r border-slate-300/80 md:block">
          <img
            src={loginOfficeImage}
            alt="Operations dashboard illustration"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-slate-900/10 via-slate-900/25 to-slate-900/80" />
          <div className="absolute inset-x-0 bottom-0 px-10 py-10">
            <div className="mb-4 inline-flex items-center rounded-sm border border-blue-200/80 bg-blue-50/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-700 uppercase">
              MicroERP Operations
            </div>
            <h1 className="max-w-md text-3xl font-semibold leading-tight text-white">
              Unified workspace for finance, inventory, and sales operations
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-100/95">
              Keep your team aligned with one operational source of truth across purchasing, production, and billing workflows.
            </p>

            <div className="mt-7 grid gap-2">
              {trustSignals.map((signal) => (
                <div
                  key={signal}
                  className="inline-flex w-fit items-center rounded-sm border border-slate-300/90 bg-white/90 px-3 py-1.5 text-xs text-slate-700 shadow-sm"
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white/95 px-5 py-8 sm:px-8 md:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 border-b border-slate-200 pb-5">
              <h2 className="mb-1 text-2xl font-semibold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-600">Enter your credentials to continue to your workspace.</p>
            </div>

            <div className="mb-6 rounded-sm border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              Secure login with role-based access enabled.
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
          </div>
        </div>
      </section>
    </div>
  )
}
