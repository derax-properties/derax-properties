import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/lib/types";
import { MessagesList } from "@/components/admin/MessagesList";
import { updateMessageStatus } from "./actions";
import { PageHeader } from "@/components/admin/PageHeader";
import { ChatIcon } from "@/components/admin/icons";

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
      <PageHeader
        icon={<ChatIcon className="h-5 w-5" />}
        title="Contact Messages"
        subtitle="Messages submitted from the general contact form."
      />

      <div className="mt-6">
        <MessagesList messages={messages} action={updateMessageStatus} />
      </div>
    </div>
  );
}
