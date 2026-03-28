import { redirect } from "next/navigation";
import JournalWorkspace from "@/app/journals/new/journal-workspace";
import { createClient } from "@/lib/supabase/server";

export default async function NewJournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <JournalWorkspace />;
}
