"use client";

import { useId } from "react";

/**
 * Premium 3D "D + house" logo mark. Glossy emerald-to-forest gradient with a
 * thin gold rim and soft drop shadow, harmonized with the site's green/gold
 * brand palette. Used everywhere the logo appears (header, footer, CTA band).
 */
export function DeraxMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const faceId = `dm-face-${uid}`;
  const highlightId = `dm-highlight-${uid}`;
  const edgeId = `dm-edge-${uid}`;
  const rimId = `dm-rim-${uid}`;
  const glowId = `dm-glow-${uid}`;
  const shadowId = `dm-shadow-${uid}`;

  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      role="img"
      aria-label="Derax Properties"
    >
      <defs>
        <linearGradient id={faceId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eafff6" />
          <stop offset="22%" stopColor="#7fe0c0" />
          <stop offset="50%" stopColor="#1f9e7a" />
          <stop offset="75%" stopColor="#155c42" />
          <stop offset="100%" stopColor="#0a2019" />
        </linearGradient>
        <linearGradient id={highlightId} x1="10%" y1="0%" x2="70%" y2="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f2921" />
          <stop offset="55%" stopColor="#081a14" />
          <stop offset="100%" stopColor="#020a07" />
        </linearGradient>
        <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6e2a8" />
          <stop offset="50%" stopColor="#c9a24b" />
          <stop offset="100%" stopColor="#8a6521" />
        </linearGradient>
        <radialGradient id={glowId} cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#040a2e" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {/* Extruded depth layer */}
        <g transform="translate(7,9)">
          <path
            fillRule="evenodd"
            fill={`url(#${edgeId})`}
            d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
               M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
          />
          <path d="M35,195 L110,80 L178,150" fill="none" stroke={`url(#${edgeId})`} strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter" />
          <rect x="92" y="137" width="16" height="16" fill={`url(#${edgeId})`} />
          <rect x="112" y="137" width="16" height="16" fill={`url(#${edgeId})`} />
          <rect x="92" y="157" width="16" height="16" fill={`url(#${edgeId})`} />
          <rect x="112" y="157" width="16" height="16" fill={`url(#${edgeId})`} />
        </g>

        {/* Thin gold rim beneath face */}
        <g transform="translate(1.5,2)">
          <path
            fillRule="evenodd"
            fill={`url(#${rimId})`}
            d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
               M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
          />
          <path d="M35,195 L110,80 L178,150" fill="none" stroke={`url(#${rimId})`} strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter" />
          <rect x="92" y="137" width="16" height="16" fill={`url(#${rimId})`} />
          <rect x="112" y="137" width="16" height="16" fill={`url(#${rimId})`} />
          <rect x="92" y="157" width="16" height="16" fill={`url(#${rimId})`} />
          <rect x="112" y="157" width="16" height="16" fill={`url(#${rimId})`} />
        </g>

        {/* Main glossy face */}
        <path
          fillRule="evenodd"
          fill={`url(#${faceId})`}
          d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
             M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
        />
        <path d="M35,195 L110,80 L178,150" fill="none" stroke={`url(#${faceId})`} strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter" />
        <rect x="92" y="137" width="16" height="16" fill={`url(#${faceId})`} />
        <rect x="112" y="137" width="16" height="16" fill={`url(#${faceId})`} />
        <rect x="92" y="157" width="16" height="16" fill={`url(#${faceId})`} />
        <rect x="112" y="157" width="16" height="16" fill={`url(#${faceId})`} />

        {/* Glossy highlight sweep */}
        <path
          fillRule="evenodd"
          fill={`url(#${highlightId})`}
          d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
             M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
        />

        {/* Soft radial sheen */}
        <path
          fillRule="evenodd"
          fill={`url(#${glowId})`}
          d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
             M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
        />

        {/* Fine gold edge outline */}
        <path
          fillRule="evenodd"
          fill="none"
          stroke="#c9a24b"
          strokeWidth="1.2"
          strokeOpacity="0.8"
          d="M20,20 L58,20 C138,20 172,62 172,120 C172,178 138,220 58,220 L20,220 Z
             M55,48 L68,48 C122,48 150,78 150,120 C150,162 122,192 68,192 L55,192 Z"
        />
      </g>
    </svg>
  );
}
