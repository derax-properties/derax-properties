/**
 * Flat, on-brand house illustration used in the homepage hero. Built as
 * inline SVG (no external stock photo dependency) so it always renders
 * crisply and matches the site's forest/gold/cream palette.
 */
export function HouseIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} role="img" aria-label="Illustration of a house">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbf6ea" />
          <stop offset="100%" stopColor="#f0e4c8" />
        </linearGradient>
      </defs>

      <rect width="640" height="480" rx="24" fill="url(#skyGrad)" />

      {/* Sun */}
      <circle cx="510" cy="90" r="46" fill="#c9a24b" opacity="0.85" />

      {/* Ground */}
      <path d="M0 380 H640 V480 H0 Z" fill="#22503f" opacity="0.9" />
      <path d="M0 372 C120 350 220 400 340 372 C440 350 540 392 640 366 V400 H0 Z" fill="#173a2e" />

      {/* Tree */}
      <rect x="86" y="290" width="14" height="90" rx="4" fill="#0f2921" />
      <circle cx="93" cy="270" r="46" fill="#22503f" />
      <circle cx="55" cy="295" r="32" fill="#22503f" />
      <circle cx="130" cy="295" r="32" fill="#22503f" />

      {/* House body */}
      <rect x="220" y="230" width="260" height="150" fill="#fbf6ea" stroke="#173a2e" strokeWidth="3" />
      {/* Roof */}
      <path d="M195 240 L350 130 L505 240 Z" fill="#173a2e" />
      <path d="M195 240 L350 130 L505 240 L505 250 L350 148 L195 250 Z" fill="#0f2921" />

      {/* Chimney */}
      <rect x="430" y="150" width="24" height="60" fill="#0f2921" />

      {/* Porch roof */}
      <path d="M270 240 L350 200 L430 240 Z" fill="#22503f" />

      {/* Door */}
      <rect x="330" y="300" width="40" height="80" rx="3" fill="#173a2e" />
      <circle cx="360" cy="342" r="2.5" fill="#c9a24b" />

      {/* Windows */}
      <g fill="#c9e0d4" stroke="#173a2e" strokeWidth="2.5">
        <rect x="245" y="270" width="46" height="46" />
        <rect x="409" y="270" width="46" height="46" />
      </g>
      <g stroke="#173a2e" strokeWidth="2.5">
        <line x1="268" y1="270" x2="268" y2="316" />
        <line x1="245" y1="293" x2="291" y2="293" />
        <line x1="432" y1="270" x2="432" y2="316" />
        <line x1="409" y1="293" x2="455" y2="293" />
      </g>

      {/* Path */}
      <path d="M335 380 L340 420 L360 420 L365 380 Z" fill="#e0c584" opacity="0.7" />

      {/* Gold accent ring */}
      <circle cx="350" cy="255" r="4" fill="#c9a24b" />
    </svg>
  );
}
