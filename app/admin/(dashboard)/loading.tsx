/**
 * Shown instantly by Next.js the moment a link inside the admin dashboard
 * is clicked, while the destination page's Server Component still awaits
 * its Supabase queries — this is what actually makes navigation feel fast:
 * something appears immediately instead of the browser sitting on the old
 * page until the new one is fully ready. Works alongside PageTransition's
 * slide-in animation, not instead of it: this covers the gap before the
 * real content exists, PageTransition animates the real content once it
 * arrives.
 */
export default function AdminSectionLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-ink/10" />
        <div>
          <div className="h-6 w-40 rounded bg-ink/10" />
          <div className="mt-2 h-3 w-64 rounded bg-ink/10" />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-xl bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
