import Link from "next/link";
import { redirect } from "next/navigation";
import GenerateSummaryButton from "@/app/dashboard/generate-summary-button";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

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

function countStreak(entryDates: Date[]) {
  const uniqueDays = new Set(
    entryDates.map((date) => startOfDay(date).toISOString()),
  );

  let streak = 0;
  let cursor = startOfDay(new Date());

  if (!uniqueDays.has(cursor.toISOString())) {
    cursor = addDays(cursor, -1);
  }

  while (uniqueDays.has(cursor.toISOString())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function averageMood(moods: Array<number | null>) {
  const values = moods.filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: user.email ?? "",
      username: user.user_metadata?.username ?? user.email ?? user.id,
    },
    create: {
      id: user.id,
      email: user.email ?? "",
      username: user.user_metadata?.username ?? user.email ?? user.id,
      fullName: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
  });

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = addDays(today, -6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allEntries, weekEntries, monthEntries, recentJournals, latestSummary] =
    await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          profileId: profile.id,
        },
        select: {
          createdAt: true,
          moodScore: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.journalEntry.findMany({
        where: {
          profileId: profile.id,
          createdAt: {
            gte: weekStart,
          },
        },
        select: {
          createdAt: true,
          moodScore: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: {
          profileId: profile.id,
          createdAt: {
            gte: monthStart,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: {
          profileId: profile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      }),
      prisma.weeklyAISummary.findFirst({
        where: {
          profileId: profile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  const weeklyMoodAverage = averageMood(weekEntries.map((entry) => entry.moodScore));
  const currentStreak = countStreak(allEntries.map((entry) => entry.createdAt));
  const daysWrittenThisWeek = new Set(
    weekEntries.map((entry) => startOfDay(entry.createdAt).toISOString()),
  ).size;

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="journal-paper journal-grain rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="hand-accent text-sm text-[var(--gold-soft)]">
                Nhịp viết của bạn, được giữ lại thật dịu dàng
              </p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl md:text-6xl">
                Viết gì đó đi, {profile.username}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                Đây là góc nhìn lại nhịp viết, cảm xúc và những bài journal gần đây của bạn.
                Nhẹ nhàng thôi, chỉ đủ để bạn thấy mình đang ở đâu.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href="/journals"
                className="soft-button rounded-full px-5 py-3 text-sm font-medium transition"
              >
                Xem tất cả journal
              </Link>
              <Link
                href="/journals/new"
                className="accent-button rounded-full px-5 py-3 text-sm font-medium transition"
              >
                Viết journal mới
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Tuần này
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              {weekEntries.length}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              bài journal trong 7 ngày gần nhất
            </p>
          </article>

          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Tháng này
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              {monthEntries.length}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              bài viết được giữ lại trong tháng hiện tại
            </p>
          </article>

          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Streak
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              {currentStreak}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              ngày viết liên tiếp
            </p>
          </article>

          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Mood trung bình
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              {weeklyMoodAverage ? weeklyMoodAverage.toFixed(1) : "-"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              trong {daysWrittenThisWeek} ngày bạn đã viết tuần này
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[30px] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="hand-accent text-sm text-[var(--gold-soft)]">
                  Những trang gần đây
                </p>
                <h2 className="serif-display mt-2 text-4xl font-semibold text-[#2f2924]">
                  Journal gần đây
                </h2>
              </div>
              <Link
                href="/journals"
                className="soft-button rounded-full px-4 py-2 text-sm font-medium transition"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {recentJournals.length === 0 ? (
                <p className="text-sm leading-7 text-[var(--muted)]">
                  Bạn chưa có bài journal nào để hiển thị ở đây.
                </p>
              ) : (
                recentJournals.map((journal) => (
                  <Link
                    key={journal.id}
                    href={`/journals/${journal.id}`}
                    className="rounded-[24px] bg-[rgba(255,251,245,0.78)] px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(77,63,46,0.07)]"
                  >
                    <p className="hand-accent text-sm text-[var(--gold-soft)]">
                      {formatDate(journal.createdAt)}
                    </p>
                    <h3 className="serif-display mt-2 text-3xl font-semibold text-[#2f2924]">
                      {journal.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#5a5047]">
                      {truncate(journal.content, 180)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className="journal-paper rounded-[24px] p-5 sm:rounded-[30px] sm:p-7">
            <p className="hand-accent text-sm text-[var(--gold-soft)]">
              Góc nhìn cuối tuần
            </p>
            <h2 className="serif-display mt-2 text-4xl font-semibold text-[#2f2924]">
              Tổng hợp tuần
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Một góc tổng hợp nhanh để bạn nhìn lại tuần vừa qua bằng một bản tóm tắt dịu
              dàng, gọn gàng và miễn phí ngay trong app.
            </p>

            {latestSummary ? (
              <div className="mt-6 rounded-[24px] bg-[rgba(255,251,245,0.78)] px-5 py-5">
                <p className="text-sm leading-7 text-[#5a5047]">
                  {truncate(latestSummary.summary, 280)}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Xu hướng cảm xúc: {latestSummary.moodTrend ?? "Đang cập nhật"}
                </p>
                {latestSummary.wins ? (
                  <p className="mt-4 text-sm leading-7 text-[#5a5047]">
                    <span className="font-medium text-[#3f352d]">Điều tích cực:</span>{" "}
                    {latestSummary.wins}
                  </p>
                ) : null}
                {latestSummary.challenges ? (
                  <p className="mt-3 text-sm leading-7 text-[#5a5047]">
                    <span className="font-medium text-[#3f352d]">Điều còn khó:</span>{" "}
                    {latestSummary.challenges}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] bg-[rgba(255,251,245,0.78)] px-5 py-5">
                <p className="text-sm leading-7 text-[var(--muted)]">
                  Bạn chưa có tổng hợp tuần nào cả. Bấm nút bên dưới để tạo một bản tổng hợp
                  nhẹ nhàng từ những journal trong 7 ngày gần nhất.
                </p>
              </div>
            )}

            <GenerateSummaryButton
              hasGeminiKey={Boolean(process.env.GEMINI_API_KEY)}
              latestSummaryCreatedAt={latestSummary?.createdAt.toISOString()}
            />
          </article>
        </section>
      </div>
    </main>
  );
}
