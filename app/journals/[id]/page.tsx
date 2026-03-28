import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteJournalButton from "@/app/journals/delete-journal-button";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const journal = await prisma.journalEntry.findFirst({
    where: {
      id,
      profileId: user.id,
    },
  });

  if (!journal) {
    notFound();
  }

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/journals"
            className="soft-button rounded-full px-4 py-2 text-sm font-medium transition"
          >
            ← Quay lại list journal
          </Link>
          <Link
            href={`/journals/${journal.id}/edit`}
            className="soft-button rounded-full px-4 py-2 text-sm font-medium transition"
          >
            Sửa journal
          </Link>
          <Link
            href="/journals/new"
            className="accent-button rounded-full px-4 py-2 text-sm font-medium transition"
          >
            Viết journal mới
          </Link>
          <DeleteJournalButton journalId={journal.id} />
        </div>

        <article className="journal-paper journal-grain mt-6 rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="hand-accent text-sm text-[var(--gold-soft)]">
                {formatDate(journal.createdAt)}
              </p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl">
                {journal.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-ink)]">
                Mood {journal.moodScore ?? "-"}
              </span>
              <span className="rounded-full bg-[#efe8dc] px-3 py-1 text-xs font-medium text-[#77685a]">
                {journal.isPrivate ? "Riêng tư" : "Mở"}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-[22px] bg-[rgba(255,251,245,0.72)] px-4 py-5 sm:rounded-[28px] sm:px-6 sm:py-6">
            <p className="whitespace-pre-wrap text-[15px] leading-8 text-[#4c433b] sm:leading-9">
              {journal.content}
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
