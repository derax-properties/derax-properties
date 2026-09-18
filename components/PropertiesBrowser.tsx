"use client";

import { useMemo, useState } from "react";
import type { Property } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";
import { FormSelect } from "./FormSelect";

const PROPERTY_TYPES = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Mobile/Manufactured",
  "Land",
  "Other",
];

const STRATEGIES = ["Fix & Flip", "Buy & Hold", "Wholesale", "Development", "Land"];

export function PropertiesBrowser({ properties }: { properties: Property[] }) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [strategy, setStrategy] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const states = useMemo(
    () => Array.from(new Set(properties.map((p) => p.state))).sort(),
    [properties]
  );
  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city))).sort(),
    [properties]
  );

  const filtered = properties.filter((p) => {
    if (state && p.state !== state) return false;
    if (city && p.city !== city) return false;
    if (propertyType && p.property_type !== propertyType) return false;
    if (strategy && p.strategy !== strategy) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;
    return true;
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-3 lg:grid-cols-5">
        <FormSelect
          id="filter-state"
          label="State"
          options={states}
          placeholder="All States"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <FormSelect
          id="filter-city"
          label="City"
          options={cities}
          placeholder="All Cities"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <FormSelect
          id="filter-type"
          label="Property Type"
          options={PROPERTY_TYPES}
          placeholder="All Types"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        />
        <FormSelect
          id="filter-strategy"
          label="Strategy"
          options={STRATEGIES}
          placeholder="All Strategies"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        />
        <FormSelect
          id="filter-price"
          label="Max Price"
          options={["50000", "100000", "150000", "250000", "400000"]}
          placeholder="Any Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      <p className="mt-6 text-sm text-ink/50">
        {filtered.length} {filtered.length === 1 ? "property" : "properties"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property, i) => (
            <PropertyCard key={property.id} property={property} seed={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No properties match those filters right now. Try adjusting your search, or check back
          soon — new opportunities are added regularly.
        </div>
      )}
    </div>
  );
}
