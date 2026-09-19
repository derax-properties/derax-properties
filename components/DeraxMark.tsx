/**
 * Flat gold "D + house" logo mark, vectorized from the brand logo so it
 * renders crisply at any size with no circular crop or photo background —
 * matching the clean, flat icon treatment used in the site header design.
 */
export function DeraxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      role="img"
      aria-label="Derax Properties"
    >
      <path
        fillRule="evenodd"
        fill="#c9a24b"
        d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
           M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
      />
      <path
        d="M35,195 L110,80 L178,150"
        fill="none"
        stroke="#c9a24b"
        strokeWidth="20"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect x="92" y="137" width="16" height="16" fill="#c9a24b" />
      <rect x="112" y="137" width="16" height="16" fill="#c9a24b" />
      <rect x="92" y="157" width="16" height="16" fill="#c9a24b" />
      <rect x="112" y="157" width="16" height="16" fill="#c9a24b" />
    </svg>
  );
}
