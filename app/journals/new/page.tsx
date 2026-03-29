import { redirect } from "next/navigation";
import JournalWorkspace from "@/app/journals/new/journal-workspace";
import {
  defaultCardFields,
  defaultTemplates,
} from "@/app/journals/new/journal-composer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let settings:
    | {
        journalThemeMode: string | null;
        journalWritingMode: string | null;
        journalBackgroundImage: string | null;
        journalTemplates: unknown;
        journalCardFields: unknown;
      }
    | null = null;

  try {
    settings = await prisma.userSettings.findUnique({
      where: {
        profileId: user.id,
      },
      select: {
        journalThemeMode: true,
        journalWritingMode: true,
        journalBackgroundImage: true,
        journalTemplates: true,
        journalCardFields: true,
      },
    });
  } catch {
    settings = null;
  }

  return (
    <JournalWorkspace
      initialSettings={{
        themeMode:
          settings?.journalThemeMode === "dark" ? "dark" : "light",
        writingMode:
          settings?.journalWritingMode === "notebook" ||
          settings?.journalWritingMode === "cards"
            ? settings.journalWritingMode
            : "focus",
        backgroundImage: settings?.journalBackgroundImage ?? null,
        templates: Array.isArray(settings?.journalTemplates)
          ? (settings?.journalTemplates as typeof defaultTemplates)
          : defaultTemplates,
        cardFields: Array.isArray(settings?.journalCardFields)
          ? (settings?.journalCardFields as typeof defaultCardFields)
          : defaultCardFields,
      }}
    />
  );
}
