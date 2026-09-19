/**
 * Decorative mountain + city skyline silhouette used behind the closing CTA
 * band. Pure inline SVG so no external image asset is needed.
 */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 220"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {/* Back mountain range */}
      <path
        d="M0 180 L90 100 L160 150 L230 70 L300 150 L380 90 L460 160 L540 110 L620 170 L700 95 L790 155 L870 115 L960 165 L1040 105 L1120 160 L1200 130 L1200 220 L0 220 Z"
        fill="currentColor"
        opacity="0.18"
      />
      {/* City skyline */}
      <g fill="currentColor" opacity="0.32">
        <rect x="60" y="150" width="26" height="70" />
        <rect x="96" y="120" width="20" height="100" />
        <rect x="126" y="160" width="30" height="60" />
        <rect x="170" y="130" width="18" height="90" />
        <rect x="198" y="150" width="24" height="70" />
        <rect x="700" y="140" width="22" height="80" />
        <rect x="732" y="110" width="26" height="110" />
        <rect x="768" y="150" width="18" height="70" />
        <rect x="796" y="125" width="24" height="95" />
        <rect x="830" y="155" width="20" height="65" />
        <rect x="960" y="135" width="22" height="85" />
        <rect x="992" y="105" width="28" height="115" />
        <rect x="1030" y="150" width="18" height="70" />
      </g>
    </svg>
  );
}
