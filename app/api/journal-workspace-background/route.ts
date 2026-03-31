import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const BACKGROUND_BUCKET = "journal-backgrounds";

function extractStoragePath(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  const bucketPrefix = `${supabaseUrl}/storage/v1/object/public/${BACKGROUND_BUCKET}/`;

  if (!url.startsWith(bucketPrefix)) {
    return null;
  }

  return url.slice(bucketPrefix.length);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Không tìm thấy file ảnh nền." },
      { status: 400 },
    );
  }

  const nextPath = `${user.id}/background-${Date.now()}.webp`;

  const previousSettings = await prisma.userSettings.findUnique({
    where: {
      profileId: user.id,
    },
    select: {
      journalBackgroundImage: true,
    },
  });

  const previousPath =
    previousSettings?.journalBackgroundImage != null
      ? extractStoragePath(previousSettings.journalBackgroundImage)
      : null;

  const { error: uploadError } = await supabase.storage
    .from(BACKGROUND_BUCKET)
    .upload(nextPath, file, {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      {
        error:
          uploadError.message ||
          "Không tải ảnh nền lên Supabase Storage được.",
      },
      { status: 503 },
    );
  }

  if (previousPath && previousPath !== nextPath) {
    const { error: removeError } = await supabase.storage
      .from(BACKGROUND_BUCKET)
      .remove([previousPath]);

    if (removeError) {
      console.warn("Không xóa được ảnh nền cũ:", removeError.message);
    }
  }

  const { data } = supabase.storage
    .from(BACKGROUND_BUCKET)
    .getPublicUrl(nextPath);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
