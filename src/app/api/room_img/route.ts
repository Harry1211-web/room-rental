import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function listFiles(folder: string) {
  const { data, error } = await supabaseAdmin.storage
    .from("room_images")
    .list(folder);
  if (error) throw error;
  return data || [];
}

async function removeFiles(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin.storage.from("room_images").remove(paths);
  if (error) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const idRoom = formData.get("idRoom") as string;
    const img_id = formData.get("img_id") as string;
    const file = formData.get("file") as File;

    if (!idRoom || !img_id || !file) {
      return NextResponse.json({ error: "Missing idRoom/img_id/file" }, { status: 400 });
    }

    const filePath = `${idRoom}/${img_id}/${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("room_images")
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from("room_images").getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl, path: filePath });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get("action") as string;
    const idRoom = formData.get("idRoom") as string;
    const img_id = formData.get("img_id") as string;

    if (action === "delete-one") {
      if (!idRoom || !img_id) {
        return NextResponse.json({ error: "Missing idRoom/img_id" }, { status: 400 });
      }
      const files = await listFiles(img_id + "/");
      const paths = files.map(f => `${img_id}/${f.name}`);
      await removeFiles(paths);
      return NextResponse.json({ success: true });
    }

    if (action === "delete-all") {
      if (!idRoom) {
        return NextResponse.json({ error: "Missing idRoom" }, { status: 400 });
      }
      const subfolders = await listFiles(idRoom); // list room subfolders
      const allPaths: string[] = [];
      for (const folder of subfolders) {
        const files = await listFiles(`${idRoom}/${folder.name}`);
        allPaths.push(...files.map(f => `${idRoom}/${folder.name}/${f.name}`));
      }
      await removeFiles(allPaths);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid DELETE action" }, { status: 400 });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
