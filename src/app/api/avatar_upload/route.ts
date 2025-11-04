import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid or missing file." },
        { status: 400 }
      );
    }

    if (typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId." },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Cannot upload avatar." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
