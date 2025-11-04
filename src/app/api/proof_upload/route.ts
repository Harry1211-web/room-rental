import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reportId = formData.get("reportId") as string;
    const file = formData.get("file") as File;

    if (!reportId || !file) {
      return NextResponse.json(
        { error: "Missing file or reportId" },
        { status: 400 }
      );
    }

    const filePath = `${reportId}/${file.name}`;

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
