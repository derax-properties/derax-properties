import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

export const metadata = { title: "Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink/50">
        Company details shown across the public site and used for notifications.
      </p>

      {searchParams.saved && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Settings saved.
        </p>
      )}

      <form action={updateSettings} className="mt-6 flex max-w-xl flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
        <TextField label="Company Name" name="company_name" defaultValue={settings?.company_name} />
        <TextField label="Phone" name="phone" defaultValue={settings?.phone ?? ""} placeholder="(XXX) XXX-XXXX" />
        <TextField
          label="Notification Email"
          name="notification_email"
          type="email"
          defaultValue={settings?.notification_email}
        />
        <TextField label="Facebook URL" name="facebook_url" defaultValue={settings?.facebook_url ?? ""} />
        <TextField label="Instagram URL" name="instagram_url" defaultValue={settings?.instagram_url ?? ""} />
        <TextField label="LinkedIn URL" name="linkedin_url" defaultValue={settings?.linkedin_url ?? ""} />
        <TextField label="YouTube URL" name="youtube_url" defaultValue={settings?.youtube_url ?? ""} />

        <button
          type="submit"
          className="focus-gold self-start rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
      />
    </div>
  );
}
