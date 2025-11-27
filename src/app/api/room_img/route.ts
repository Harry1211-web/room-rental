import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const idRoom = formData.get("idRoom") as string;
    const img_id = formData.get("img_id") as string;
    const file = formData.get("file") as File;

    if (!idRoom || !img_id || !file) {
      return NextResponse.json(
        { error: "Missing idRoom/img_id/file" },
        { status: 400 }
      );
    }

    const filePath = `${idRoom}/${img_id}/${file.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("room_images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage
      .from("room_images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl, path: filePath });
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
    const action = formData.get("action") as string;
    const idRoom = formData.get("idRoom") as string;
    const img_id = formData.get("img_id") as string; // folder con

    // ---- Delete One Image ----
    if (action === "delete-one") {
      if (!idRoom || !img_id) {
        return NextResponse.json(
          { error: "Missing idRoom/img_id/" },
          { status: 400 }
        );
      }

      const { data: files } = await supabaseAdmin.storage
        .from("room_images")
        .list(img_id + "/");

      if (!files || files.length === 0) {
        return NextResponse.json({ success: true }); // Không có gì để xóa
      }
      const paths = files.map((f) => `${img_id}/${f.name}`);
      await supabaseAdmin.storage.from("room_images").remove(paths);

      return NextResponse.json({ success: true });
    }

    // ---- Delete All Images / Room Folder ----
    if (action === "delete-all") {
      if (!idRoom) {
        return NextResponse.json({ error: "Missing idRoom" }, { status: 400 });
      }

      // Liệt kê các folder con trong roomId
      const { data: subfolders, error: listFolderError } =
        await supabaseAdmin.storage.from("room_images").list(idRoom);

      if (listFolderError) throw listFolderError;

      for (const folder of subfolders) {
        const { data: files, error: listFilesError } =
          await supabaseAdmin.storage
            .from("room_images")
            .list(`${idRoom}/${folder.name}`);

        if (listFilesError) throw listFilesError;

        const paths = files.map((f) => `${idRoom}/${folder.name}/${f.name}`);
        if (paths.length > 0) {
          const { error: removeError } = await supabaseAdmin.storage
            .from("room_images")
            .remove(paths);
          if (removeError) throw removeError;
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid DELETE action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
