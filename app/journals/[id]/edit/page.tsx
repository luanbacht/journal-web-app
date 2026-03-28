import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteJournalButton from "@/app/journals/delete-journal-button";
import { updateJournal } from "@/app/journals/actions";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function EditJournalPage({
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
            href={`/journals/${journal.id}`}
            className="soft-button rounded-full px-4 py-2 text-sm font-medium transition"
          >
            ← Quay lại chi tiết
          </Link>
          <Link
            href="/journals"
            className="soft-button rounded-full px-4 py-2 text-sm font-medium transition"
          >
            Về list journal
          </Link>
          <DeleteJournalButton journalId={journal.id} />
        </div>

        <section className="journal-paper journal-grain mt-6 rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <p className="hand-accent text-sm text-[var(--gold-soft)]">
            Gentle revision
          </p>
          <h1 className="serif-display mt-3 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl">
            Sửa lại bài viết của bạn
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
            Giữ nguyên tinh thần của bài viết, chỉ chạm nhẹ vào những chỗ bạn muốn
            rõ hơn, đúng hơn hoặc dịu dàng hơn.
          </p>

          <form action={updateJournal} className="mt-8 space-y-6">
            <input type="hidden" name="journalId" value={journal.id} />

            <div className="space-y-2">
              <label htmlFor="title" className="block text-lg font-semibold text-[#2f2924]">
                Tiêu đề
              </label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue={journal.title}
                className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#2f2924] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                spellCheck={false}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-lg font-semibold text-[#2f2924]">
                Nội dung
              </label>
              <textarea
                id="content"
                name="content"
                defaultValue={journal.content}
                rows={14}
                className="w-full rounded-[22px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-4 text-[#4c433b] outline-none transition focus:border-[var(--accent)] sm:rounded-[28px] sm:px-5 sm:py-5"
                spellCheck={false}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="moodScore" className="block text-lg font-semibold text-[#2f2924]">
                Mood score (1-10)
              </label>
              <input
                id="moodScore"
                name="moodScore"
                type="number"
                min="1"
                max="10"
                defaultValue={journal.moodScore ?? ""}
                className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#2f2924] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                className="accent-button w-full rounded-full px-5 py-3 text-sm font-medium transition sm:w-auto"
              >
                Lưu cập nhật
              </button>
              <Link
                href={`/journals/${journal.id}`}
                className="soft-button w-full rounded-full px-5 py-3 text-sm font-medium transition sm:w-auto"
              >
                Hủy
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
