"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

function averageMood(moods: Array<number | null>) {
  const values = moods.filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMoodTrend(average: number | null) {
  if (average === null) {
    return "Chưa có đủ dữ liệu mood để nhận ra xu hướng rõ ràng.";
  }

  if (average >= 8) {
    return "Tâm trạng chung khá sáng và ổn định.";
  }

  if (average >= 6) {
    return "Tâm trạng tuần này tương đối cân bằng, có những điểm sáng xen kẽ.";
  }

  if (average >= 4) {
    return "Tuần này có vẻ hơi chùng xuống và cần thêm nghỉ ngơi.";
  }

  return "Cảm xúc tuần này có phần nặng hơn bình thường, bạn có thể cần dịu lại với chính mình.";
}

function collectKeywordHits(entries: Array<{ title: string; content: string }>) {
  const keywordGroups = [
    {
      label: "công việc",
      words: ["cong viec", "deadline", "hop", "du an", "khach hang", "task", "meeting"],
    },
    {
      label: "gia đình",
      words: ["gia dinh", "me", "ba", "bo", "chi", "em", "nha"],
    },
    {
      label: "bản thân",
      words: ["ban than", "nghi ngoi", "met", "cham soc", "suc khoe", "tap trung"],
    },
    {
      label: "biết ơn",
      words: ["biet on", "cam on", "gratitude", "may man"],
    },
    {
      label: "cảm xúc",
      words: ["vui", "buon", "lo", "ap luc", "yen", "binh yen", "co don"],
    },
  ];

  const normalizedText = entries
    .map((entry) => `${entry.title} ${entry.content}`.toLowerCase())
    .join(" ");

  return keywordGroups
    .map((group) => ({
      label: group.label,
      count: group.words.reduce(
        (sum, word) => sum + (normalizedText.includes(word) ? 1 : 0),
        0,
      ),
    }))
    .filter((group) => group.count > 0)
    .sort((a, b) => b.count - a.count);
}

function buildSummary(params: {
  entryCount: number;
  daysWritten: number;
  average: number | null;
  topThemes: string[];
}) {
  const moodSentence =
    params.average === null
      ? "Bạn đã viết đều nhưng chưa chấm mood đủ để nhìn ra nhịp cảm xúc thật rõ."
      : `Mood trung bình của bạn tuần này là ${params.average.toFixed(1)}/10, cho thấy một nhịp cảm xúc ${params.average >= 6 ? "khá ổn định" : "cần được dịu lại"}.`;

  const themeSentence =
    params.topThemes.length > 0
      ? `Những chủ đề nổi lên nhiều nhất là ${params.topThemes.join(", ")}.`
      : "Tuần này journal của bạn trải rộng nhiều chủ đề nhỏ, chưa có một chủ đề nào lặp lại quá mạnh.";

  return [
    `Trong 7 ngày gần nhất, bạn đã viết ${params.entryCount} journal trong ${params.daysWritten} ngày khác nhau.`,
    moodSentence,
    themeSentence,
    "Nhìn chung, đây là một tuần có nhiều dấu hiệu để nhìn lại nhẹ nhàng và chăm sóc bản thân đều đặn hơn.",
  ].join(" ");
}

function buildWins(entries: Array<{ moodScore: number | null; content: string }>, daysWritten: number) {
  const highMoodEntries = entries.filter(
    (entry) => entry.moodScore !== null && entry.moodScore >= 7,
  ).length;

  if (highMoodEntries > 0) {
    return `Bạn đã giữ được một vài điểm sáng trong tuần, với ${highMoodEntries} bài có mood từ 7 trở lên. Việc vẫn dành thời gian viết lại suy nghĩ của mình trong ${daysWritten} ngày khác nhau cũng là một tín hiệu rất tốt.`;
  }

  if (daysWritten >= 3) {
    return `Điểm đáng quý nhất là bạn vẫn quay lại với journal khá đều. Chỉ riêng việc dừng lại để viết và quan sát bản thân trong ${daysWritten} ngày đã là một bước tiến rất tử tế rồi.`;
  }

  return "Tuần này dù nhịp viết còn thưa, bạn vẫn giữ được một khoảng riêng cho bản thân. Việc không bỏ hẳn thói quen này là một điều rất đáng ghi nhận.";
}

function buildChallenges(average: number | null, topThemes: string[]) {
  if (average !== null && average < 5) {
    return "Tuần này cảm xúc có vẻ nặng hơn bình thường. Có thể bạn đang mang theo khá nhiều áp lực hoặc mệt mỏi, nên cần thêm nghỉ ngơi và những khoảng dừng thật mềm.";
  }

  if (topThemes.includes("công việc")) {
    return "Chủ đề công việc xuất hiện khá rõ, nên có thể đây đang là nguồn chiếm nhiều năng lượng tinh thần nhất của bạn trong tuần này.";
  }

  if (topThemes.includes("cảm xúc")) {
    return "Các ghi chép thiên nhiều về cảm xúc nội tâm, cho thấy bạn đang ở giai đoạn cần được lắng nghe và sắp xếp lại suy nghĩ nhiều hơn.";
  }

  return "Khó khăn lớn nhất có lẽ chưa nằm ở một sự kiện cụ thể, mà ở việc cảm xúc và suy nghĩ đang hơi rải ra. Một chút chậm lại có thể sẽ giúp bạn nhìn mọi thứ rõ hơn.";
}

type WeeklyEntry = {
  title: string;
  content: string;
  moodScore: number | null;
  createdAt: Date;
};

export async function generateWeeklySummary() {
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
    throw new Error("Không tìm thấy profile của người dùng hiện tại.");
  }

  const today = startOfDay(new Date());
  const weekStart = addDays(today, -6);
  const weekEnd = addDays(today, 1);

  const entries: WeeklyEntry[] = await prisma.journalEntry.findMany({
    where: {
      profileId: profile.id,
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      title: true,
      content: true,
      moodScore: true,
      createdAt: true,
    },
  });

  if (entries.length === 0) {
    throw new Error("Bạn chưa có journal nào trong 7 ngày gần nhất để tạo weekly summary.");
  }

  const daysWritten = new Set(
    entries.map((entry) => startOfDay(entry.createdAt).toISOString()),
  ).size;
  const average = averageMood(entries.map((entry) => entry.moodScore));
  const topThemes = collectKeywordHits(entries)
    .slice(0, 2)
    .map((item) => item.label);

  const summary = buildSummary({
    entryCount: entries.length,
    daysWritten,
    average,
    topThemes,
  });
  const moodTrend = buildMoodTrend(average);
  const wins = buildWins(entries, daysWritten);
  const challenges = buildChallenges(average, topThemes);

  await prisma.weeklyAISummary.deleteMany({
    where: {
      profileId: profile.id,
      weekStart,
    },
  });

  await prisma.weeklyAISummary.create({
    data: {
      profileId: profile.id,
      weekStart,
      weekEnd: today,
      summary,
      moodTrend,
      wins,
      challenges,
    },
  });

  revalidatePath("/dashboard");
}
