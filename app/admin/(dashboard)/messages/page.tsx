import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { MessageStatusSelect } from "@/components/admin/MessageStatusSelect";
import { updateMessageStatus } from "./actions";

export const metadata = { title: "Contact Messages", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  const messages = (data as ContactMessage[]) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Contact Messages</h1>
      <p className="mt-1 text-sm text-ink/50">Messages submitted from the general contact form.</p>

      <div className="mt-6 flex flex-col gap-4">
        {messages.map((m) => (
          <div key={m.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-sm text-ink/50">
                  <a href={`mailto:${m.email}`} className="text-gold-dark hover:underline">
                    {m.email}
                  </a>
                  {m.phone && <span> · {m.phone}</span>}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gold-dark">{m.interest}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink/40">{formatDate(m.created_at)}</span>
                <MessageStatusSelect id={m.id} status={m.status} action={updateMessageStatus} />
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/70">{m.message}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-ink/40 shadow-sm">
            No contact messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
