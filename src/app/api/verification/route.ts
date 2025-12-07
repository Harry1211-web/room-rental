import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const idRoom = formData.get("idRoom") as string;
    const verification_id = formData.get("verification_id") as string;
    const file = formData.get("file") as File;

    if (!idRoom || !verification_id || !file) {
      return NextResponse.json({ error: "Missing idRoom/verification_id/file" }, { status: 400 });
    }

    const filePath = `${idRoom}/${verification_id}/${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("proof").upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from("proof").getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl, path: filePath });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get("action") as string;
    const idRoom = formData.get("idRoom") as string;
    const verification_id = formData.get("verification_id") as string;

    if (action === "delete-one") {
      if (!idRoom || !verification_id) return NextResponse.json({ error: "Missing idRoom/verification_id" }, { status: 400 });

      const { data: files } = await supabaseAdmin.storage.from("proof").list(`${verification_id}/`);
      if (files && files.length > 0) {
        const paths = files.map(f => `${verification_id}/${f.name}`);
        await supabaseAdmin.storage.from("proof").remove(paths);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "delete-all") {
      if (!idRoom) return NextResponse.json({ error: "Missing idRoom" }, { status: 400 });

      const { data: subfolders, error: listFolderError } = await supabaseAdmin.storage.from("proof").list(idRoom);
      if (listFolderError) throw listFolderError;

      for (const folder of subfolders) {
        const { data: files, error: listFilesError } = await supabaseAdmin.storage.from("proof").list(`${idRoom}/${folder.name}`);
        if (listFilesError) throw listFilesError;

        const paths = files.map(f => `${idRoom}/${folder.name}/${f.name}`);
        if (paths.length > 0) {
          const { error: removeError } = await supabaseAdmin.storage.from("proof").remove(paths);
          if (removeError) throw removeError;
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid DELETE action" }, { status: 400 });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
