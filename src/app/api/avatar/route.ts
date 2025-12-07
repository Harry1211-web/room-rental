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

export async function GET(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Tự động assume ảnh tên avatar.(jpg/png/webp)
    // Nếu muốn strict thì lưu loại file vào DB, còn đây thì lấy mọi file trong folder và pick ảnh đầu.
    const { data: files } = await supabaseAdmin.storage
      .from("avatars")
      .list(userId + "/", { limit: 1 });

    if (!files || files.length === 0) {
      return NextResponse.json({ avatarUrl: null }); // user chưa có avatar
    }

    const path = `${userId}/${files[0].name}`;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    return NextResponse.json({ avatarUrl: data.publicUrl });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Get avatar error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId");
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const { data: files } = await supabaseAdmin.storage
      .from("avatars")
      .list(userId + "/");

    if (!files || files.length === 0) {
      return NextResponse.json({ success: true }); // Không có gì để xóa
    }

    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from("avatars").remove(paths);

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Delete avatar error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
