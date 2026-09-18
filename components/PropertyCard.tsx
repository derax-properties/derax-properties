import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PropertyImage } from "./PropertyImagePlaceholder";
import { ArrowRightIcon } from "./icons";

export function PropertyCard({ property, seed = 0 }: { property: Property; seed?: number }) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="focus-gold group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative">
        <PropertyImage
          src={property.cover_image_url}
          alt={`${property.title} in ${property.city}, ${property.state}`}
          className="aspect-[4/3] w-full"
          seed={seed}
        />
        {property.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-ink shadow">
            {property.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-sm text-ink/60">
          {property.city}, {property.state}
        </p>
        <p className="font-display text-xl font-semibold text-ink">
          {formatCurrency(property.price)}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark group-hover:text-gold">
          Learn More <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
