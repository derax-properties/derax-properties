import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function HouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function CoinsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="9" cy="6" rx="6" ry="3" />
      <path d="M3 6v5c0 1.66 2.69 3 6 3s6-1.34 6-3V6" />
      <path d="M3 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      <ellipse cx="17" cy="13" rx="4" ry="2" />
      <path d="M13 13v3.5c0 1.1 1.79 2 4 2s4-.9 4-2V13" />
    </svg>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.9 7.5 9 4.3-1.1 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function HandshakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m3 12 4-4 4 3 3-3 3 3 4-4" />
      <path d="M3 12v3l4 3 4-3 2 2 2-2 4 3 4-3v-3" />
    </svg>
  );
}

export function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 13.3c1.9.4 3.4 1.9 3.9 4.2" />
    </svg>
  );
}

export function TrendUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16.5 9.5 11l3.5 3.5L20 7" />
      <path d="M14.5 7H20v5.5" />
    </svg>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function SupportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M19.5 19v.5a3 3 0 0 1-3 3H13" />
      <path d="M11 22.5h2a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2Z" />
    </svg>
  );
}

export function CircleArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15l6-6" />
      <path d="M10 9h5v5" />
    </svg>
  );
}
