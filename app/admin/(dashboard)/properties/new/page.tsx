import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "../actions";

export const metadata = { title: "Add Property", robots: { index: false, follow: false } };

export default function NewPropertyPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Add Property</h1>
      <p className="mt-1 text-sm text-ink/50">
        New properties are saved as &quot;Coming Soon&quot; by default — set status to
        &quot;Available&quot; to publish on the site.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="mt-6 max-w-2xl">
        <PropertyForm action={createProperty} submitLabel="Create Property" />
      </div>
    </div>
  );
}
