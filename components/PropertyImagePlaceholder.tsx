import Image from "next/image";
import { HouseIcon } from "./icons";
import { cx } from "@/lib/utils";

/**
 * Renders a property's cover photo when one has been uploaded through the
 * admin dashboard (stored in Supabase Storage / property_photos), and falls
 * back to a tasteful branded placeholder otherwise so the site never shows
 * a broken image before real inventory photos exist.
 */
export function PropertyImage({
  src,
  alt,
  className,
  seed = 0,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  seed?: number;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
      </div>
    );
  }

  const angle = 135 + ((seed * 17) % 60);
  return (
    <div
      className={cx(
        "relative flex items-center justify-center overflow-hidden bg-ink",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, #17140f 0%, #322a1c 55%, #6b4f22 100%)`,
      }}
      role="img"
      aria-label={alt}
    >
      <HouseIcon className="h-12 w-12 text-gold/40" />
      <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-cream/40">
        Photo pending
      </span>
    </div>
  );
}
