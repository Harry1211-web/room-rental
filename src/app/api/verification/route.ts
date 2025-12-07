import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const verificationId = formData.get("verificationId") as string;
    const file = formData.get("file") as File;

    if (!verificationId || !file) {
      return NextResponse.json(
        { error: "Missing file or verificationId" },
        { status: 400 }
      );
    }

    const filePath = `${verificationId}/${file.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("proof")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from("proof").getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const formData = await req.formData();
    const verificationId = formData.get("verificationId") as string;

    if (!verificationId) {
      return NextResponse.json({ error: "Missing verificationId" }, { status: 400 });
    }

    const { data: files, error } = await supabaseAdmin.storage
      .from("proof")
      .list(verificationId + "/");

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const result = files.map((file) => {
      const path = `${verificationId}/${file.name}`;
      const { data } = supabaseAdmin.storage.from("proof").getPublicUrl(path);
      return { name: file.name, url: data.publicUrl };
    });

    return NextResponse.json({ files: result });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const formData = await req.formData();
    const verificationId = formData.get("verificationId") as string;
    const filename = formData.get("filename") as string;

  if (!verificationId || !filename) {
    return NextResponse.json({ error: "Missing verificationId or filename" }, { status: 400 });
  }

  const path = `${verificationId}/${filename}`;

  const { error } = await supabaseAdmin.storage.from("proof").remove([path]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

