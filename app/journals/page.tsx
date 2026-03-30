import Link from "next/link";
import { redirect } from "next/navigation";
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

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function getDateRange(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
}

type JournalListItem = {
  id: string;
  profileId: string;
  title: string;
  content: string;
  moodScore: number | null;
  energyScore: number | null;
  stressScore: number | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default async function JournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q = "", date = "" } = await searchParams;
  const keyword = q.trim();
  const trimmedDate = date.trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!profile) {
    redirect("/dashboard");
  }

  const dateRange = trimmedDate ? getDateRange(trimmedDate) : null;

  const journals: JournalListItem[] = await prisma.journalEntry.findMany({
    where: {
      profileId: profile.id,
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { content: { contains: keyword, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(dateRange
        ? {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasFilters = Boolean(keyword || trimmedDate);

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <section className="journal-paper journal-grain rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="hand-accent text-sm text-[var(--gold-soft)]">
                A quiet place for your inner notes
              </p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl md:text-6xl">
                Nhật ký của {profile.username}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                Một góc nhỏ ấm và riêng để nhìn lại những gì mình đã viết. Mỗi bài
                journal nằm ở đây như một trang giấy được giữ lại sau những ngày đã qua.
              </p>
            </div>

            <div className="flex w-full justify-start md:w-auto md:justify-end">
              <div className="flex w-full max-w-[20rem] flex-col gap-3">
                <Link
                  href="/dashboard"
                  className="soft-button inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition"
                >
                  Về dashboard
                </Link>
                <Link
                  href="/journals/new"
                  className="accent-button inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium shadow-[0_16px_40px_rgba(111,133,117,0.16)] transition"
                >
                  Viết journal mới
                </Link>
              </div>
            </div>
          </div>

          <form className="mt-8 grid gap-4 md:grid-cols-[1.4fr_0.7fr_auto] md:items-end">
            <div className="space-y-2">
              <label
                htmlFor="q"
                className="text-sm font-medium text-[#5f554b]"
              >
                Tìm theo từ khóa
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={keyword}
                placeholder="Tiêu đề, nội dung, một câu bạn nhớ..."
                className="w-full rounded-[20px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3 text-[#312c27] outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="date"
                className="text-sm font-medium text-[#5f554b]"
              >
                Lọc theo ngày
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={trimmedDate}
                className="w-full rounded-[20px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3 text-[#312c27] outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                className="accent-button rounded-full px-5 py-3 text-sm font-medium transition"
              >
                Tìm journal
              </button>
              {hasFilters ? (
                <Link
                  href="/journals"
                  className="soft-button rounded-full px-5 py-3 text-sm font-medium transition"
                >
                  Xóa lọc
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="mt-8">
          {journals.length === 0 ? (
            <div className="journal-paper rounded-[24px] px-5 py-10 text-center sm:rounded-[30px] sm:px-8 sm:py-14">
              <p className="serif-display text-3xl font-semibold text-[#342c26]">
                {hasFilters
                  ? "Không tìm thấy journal phù hợp"
                  : "Trang này vẫn còn trống"}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                {hasFilters
                  ? "Thử đổi từ khóa hoặc chọn ngày khác để tìm lại bài viết bạn muốn xem."
                  : "Hãy viết bài journal đầu tiên để bắt đầu lưu lại cảm xúc, suy nghĩ và những khoảnh khắc riêng của bạn."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {hasFilters ? (
                  <Link
                    href="/journals"
                    className="soft-button inline-flex rounded-full px-5 py-3 text-sm font-medium transition"
                  >
                    Xóa lọc để xem tất cả
                  </Link>
                ) : null}
                <Link
                  href="/journals/new"
                  className="accent-button inline-flex rounded-full px-5 py-3 text-sm font-medium transition"
                >
                  Viết journal mới
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5">
              {journals.map((journal: JournalListItem) => (
                <Link
                  key={journal.id}
                  href={`/journals/${journal.id}`}
                  className="journal-paper block rounded-[24px] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(77,63,46,0.09)] sm:rounded-[30px] sm:p-6"
                >
                  <article>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="hand-accent text-sm text-[var(--gold-soft)]">
                          {formatDate(journal.createdAt)}
                        </p>
                        <h2 className="serif-display mt-2 text-3xl font-semibold text-[#2f2924]">
                          {journal.title}
                        </h2>
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

                    <p className="mt-5 text-[15px] leading-8 text-[#564d45]">
                      {truncate(journal.content, 240)}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
