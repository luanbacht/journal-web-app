"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function createJournal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const moodScoreValue = String(formData.get("moodScore") ?? "").trim();

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const moodScore = moodScoreValue ? Number(moodScoreValue) : null;

  if (moodScore !== null && (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 10)) {
    throw new Error("Mood score must be an integer from 1 to 10.");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!profile) {
    throw new Error("Profile not found.");
  }

  await prisma.journalEntry.create({
    data: {
      profileId: profile.id,
      title,
      content,
      moodScore,
    },
  });

  redirect("/dashboard");
}

export async function updateJournal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const journalId = String(formData.get("journalId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const moodScoreValue = String(formData.get("moodScore") ?? "").trim();

  if (!journalId) {
    throw new Error("Journal id is required.");
  }

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const moodScore = moodScoreValue ? Number(moodScoreValue) : null;

  if (
    moodScore !== null &&
    (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 10)
  ) {
    throw new Error("Mood score must be an integer from 1 to 10.");
  }

  const journal = await prisma.journalEntry.findFirst({
    where: {
      id: journalId,
      profileId: user.id,
    },
  });

  if (!journal) {
    throw new Error("Journal not found.");
  }

  await prisma.journalEntry.update({
    where: {
      id: journalId,
    },
    data: {
      title,
      content,
      moodScore,
    },
  });

  redirect(`/journals/${journalId}`);
}

export async function deleteJournal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const journalId = String(formData.get("journalId") ?? "").trim();

  if (!journalId) {
    throw new Error("Journal id is required.");
  }

  const journal = await prisma.journalEntry.findFirst({
    where: {
      id: journalId,
      profileId: user.id,
    },
  });

  if (!journal) {
    throw new Error("Journal not found.");
  }

  await prisma.journalEntry.delete({
    where: {
      id: journalId,
    },
  });

  redirect("/journals");
}
