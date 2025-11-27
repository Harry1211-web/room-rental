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

export async function GET(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reportId = formData.get("reportId") as string;

    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const { data: files, error } = await supabaseAdmin.storage
      .from("proof")
      .list(reportId + "/");

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const result = files.map((file) => {
      const path = `${reportId}/${file.name}`;
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
  try {
    const formData = await req.formData();
    const reportId = formData.get("reportId") as string;

    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("proof")
      .list(reportId + "/");

    if (listError) throw listError;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, message: "No files to delete" });
    }

    const paths = files.map((f) => `${reportId}/${f.name}`);
    const { error: removeError } = await supabaseAdmin.storage.from("proof").remove(paths);

    if (removeError) throw removeError;

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


