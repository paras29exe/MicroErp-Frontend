export function UnauthorizedState() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-red-50 via-white to-rose-100 px-6 py-10">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-red-200/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-rose-200/60 blur-3xl" aria-hidden="true" />

      <div className="relative text-center">
        <p className="text-[7rem] font-black leading-none tracking-tight text-red-700/90 sm:text-[9rem]">403</p>
        <h1 className="mt-2 text-2xl font-bold text-red-800 sm:text-3xl">Unauthorized</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-900/80 sm:text-base">
          You do not have permission to access this page. Contact your administrator if you think this should be allowed.
        </p>
      </div>
    </section>
  )
}

export function NotFoundState() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-red-50 via-white to-orange-100 px-6 py-10">
      <div className="pointer-events-none absolute -left-24 top-14 h-72 w-72 rounded-full bg-red-200/55 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-2 h-80 w-80 rounded-full bg-orange-200/60 blur-3xl" aria-hidden="true" />

      <div className="relative text-center">
        <p className="text-[7rem] font-black leading-none tracking-tight text-red-700/90 sm:text-[9rem]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-red-800 sm:text-3xl">Page Not Found</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-900/80 sm:text-base">
          The page you requested does not exist, may have moved, or is no longer available.
        </p>
      </div>
    </section>
  )
}
