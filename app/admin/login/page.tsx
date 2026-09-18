import { signIn } from "./actions";

export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center leading-none">
          <span className="font-display text-xl font-bold text-ink">DERAX</span>
          <span className="text-[10px] font-semibold tracking-[0.35em] text-gold-dark">
            PROPERTIES
          </span>
        </div>
        <h1 className="text-center font-display text-xl font-semibold text-ink">Admin Login</h1>

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirectTo ?? "/admin"} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
            />
          </div>

          {searchParams.error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {searchParams.error}
            </p>
          )}

          <button
            type="submit"
            className="focus-gold mt-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/40">
          Admin accounts are created in the Supabase dashboard. Contact your site administrator
          for access.
        </p>
      </div>
    </div>
  );
}
