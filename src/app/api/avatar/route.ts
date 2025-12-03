import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid or missing file." }, { status: 400 });
    }
    if (typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    //Always upload to a fixed key = avatar.webp
    const filePath = `${userId}/avatar.webp`;

    //Convert to ArrayBuffer (FAST, reliable)
    const buffer = await file.arrayBuffer();

    //Upload once — supabaseAdmin only (no need for public client)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        upsert: true,
        contentType: "image/webp",
        cacheControl: "0",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    //Generate public URL *with cache-busting*
    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

    const cacheBustedURL = `${data.publicUrl}?t=${Date.now()}`;

    return NextResponse.json({
      success: true,
      avatarUrl: cacheBustedURL,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const filePath = `${userId}/avatar.webp`;

    //Delete exact known path
    await supabaseAdmin.storage.from("avatars").remove([filePath]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
