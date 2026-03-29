import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type WorkspacePayload = {
  themeMode?: string;
  writingMode?: string;
  backgroundImage?: string | null;
  templates?: unknown;
  cardFields?: unknown;
};

function toJsonValue(value: unknown) {
  return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

async function getCurrentProfileId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user.id;
}

export async function GET() {
  const profileId = await getCurrentProfileId();

  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: {
        profileId,
      },
      select: {
        journalThemeMode: true,
        journalWritingMode: true,
        journalBackgroundImage: true,
        journalTemplates: true,
        journalCardFields: true,
      },
    });

    return NextResponse.json({
      themeMode: settings?.journalThemeMode ?? null,
      writingMode: settings?.journalWritingMode ?? null,
      backgroundImage: settings?.journalBackgroundImage ?? null,
      templates: settings?.journalTemplates ?? null,
      cardFields: settings?.journalCardFields ?? null,
    });
  } catch {
    return NextResponse.json({
      themeMode: null,
      writingMode: null,
      backgroundImage: null,
      templates: null,
      cardFields: null,
    });
  }
}

export async function PUT(request: Request) {
  const profileId = await getCurrentProfileId();

  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as WorkspacePayload;

  try {
    await prisma.userSettings.upsert({
      where: {
        profileId,
      },
      update: {
        journalThemeMode: body.themeMode ?? null,
        journalWritingMode: body.writingMode ?? null,
        journalBackgroundImage: body.backgroundImage ?? null,
        journalTemplates: toJsonValue(body.templates),
        journalCardFields: toJsonValue(body.cardFields),
      },
      create: {
        profileId,
        journalThemeMode: body.themeMode ?? null,
        journalWritingMode: body.writingMode ?? null,
        journalBackgroundImage: body.backgroundImage ?? null,
        journalTemplates: toJsonValue(body.templates),
        journalCardFields: toJsonValue(body.cardFields),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Workspace settings sync is not ready yet.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
