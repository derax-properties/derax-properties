import Image from "next/image";
import { cx } from "@/lib/utils";

/**
 * The DERAX REAL ESTATE LLC logo mark — a "D" formed with a house roofline.
 * The artwork's own background has been removed (transparent PNG), so it
 * sits directly on whatever surface it's placed on — no circle, card, or
 * white box behind it — on both light (header, footer-on-cream) and dark
 * (footer, CTA band, hero badge) surfaces alike. `object-contain` keeps the
 * mark's own proportions instead of cropping it to a square. Used
 * everywhere the logo appears (header, footer, CTA band, homepage hero
 * badge) — update the artwork at public/derax-mark.png and every usage
 * picks it up.
 */
export function DeraxMark({ className }: { className?: string }) {
  return (
    <span className={cx("relative inline-block shrink-0", className)}>
      <Image
        src="/derax-mark.png"
        alt="DERAX REAL ESTATE LLC"
        fill
        sizes="96px"
        className="object-contain"
      />
    </span>
  );
}
