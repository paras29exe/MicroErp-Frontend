import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/auth.store'
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
    <div className="erp-desktop-min flex min-h-screen items-center justify-center bg-slate-100 px-8 py-10">
      <section className="grid w-full max-w-6xl grid-cols-[1.25fr_1fr] overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <div className="relative border-r border-slate-300 bg-slate-900">
          <img
            src={loginOfficeImage}
            alt="Operations dashboard illustration"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 border-t border-blue-300/30 bg-slate-950/75 px-8 py-6">
            <div className="mb-2 text-xs font-semibold tracking-widest text-blue-200 uppercase">
              MicroERP
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-white">
              Business Operations Workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Sign in to continue with daily transactions and management workflows.
            </p>
          </div>
        </div>

        <div className="px-10 py-12">
          <h2 className="mb-1 text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mb-8 text-sm text-slate-600">Enter your credentials to access your account.</p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="identifier">
                Email or Employee ID
              </label>
              <input
                id="identifier"
                type="text"
                className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
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
              <input
                id="password"
                type="password"
                className="w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-sm bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
