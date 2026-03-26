export function UnauthorizedState() {
  return (
    <section className="border border-red-300 bg-red-50 p-3 text-sm text-red-700">
      You do not have permission to access this page.
    </section>
  )
}

export function NotFoundState() {
  return (
    <section className="border border-slate-300 bg-white p-3 text-sm text-slate-700">
      Page not found.
    </section>
  )
}
