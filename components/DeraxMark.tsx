import Image from "next/image";
import { cx } from "@/lib/utils";

/**
 * The DERAX REAL ESTATE LLC logo mark — a "D" formed with a house roofline.
 * Rendered as a circular badge so the source artwork's own light background
 * reads as an intentional coin/seal shape rather than a stray white square,
 * on both light (header, footer-on-cream) and dark (footer, hero badge)
 * surfaces alike. Used everywhere the logo appears (header, footer, CTA
 * band, homepage hero badge) — update the artwork at
 * public/derax-mark.png and every usage picks it up.
 */
export function DeraxMark({ className }: { className?: string }) {
  return (
    <span className={cx("relative inline-block shrink-0 overflow-hidden rounded-full", className)}>
      <Image
        src="/derax-mark.png"
        alt="DERAX REAL ESTATE LLC"
        fill
        sizes="96px"
        className="object-cover"
      />
    </span>
  );
}
