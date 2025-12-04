import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PAGE_SIZE = 100;
const CHUNK_DELETE = 100; //number of paths to remove per request

async function listAllFiles(bucket: string, prefix: string) {
  const results: string[] = [];
  let page = 0;

  while (true) {
    //v2 list signature: .list(prefix, { limit, offset, sortBy })
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data as any[]) {
      if (item.type === "folder") {
        //recurse into folder
        const nested = await listAllFiles(bucket, `${prefix}/${item.name}`);
        results.push(...nested);
      } else {
        //file: construct full key relative to bucket root
        results.push(`${prefix}/${item.name}`);
      }
    }

    if (data.length < PAGE_SIZE) break;
    page += 1;
  }

  return results;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const buckets = ["avatars", "room_images", "proof"]; //adjust as needed
    const results: Record<string, { deleted: number; error?: string }> = {};

    for (const bucket of buckets) {
      try {
        const prefix = userId;
        const files = await listAllFiles(bucket, prefix);

        const placeholders = [`${prefix}/`, `${prefix}/.keep`];
        const toDelete = Array.from(new Set([...files, ...placeholders]));

        if (toDelete.length === 0) {
          results[bucket] = { deleted: 0 };
          continue;
        }

        let totalDeleted = 0;
        for (let i = 0; i < toDelete.length; i += CHUNK_DELETE) {
          const chunk = toDelete.slice(i, i + CHUNK_DELETE);
          const { data: removed, error: removeError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(chunk);

          if (removeError) {
            //record and continue
            results[bucket] = { deleted: totalDeleted, error: removeError.message || String(removeError) };
            console.error("Remove error", bucket, removeError);
            continue;
          }

          if (Array.isArray(removed)) totalDeleted += removed.length;
        }

        if (!results[bucket]) results[bucket] = { deleted: totalDeleted };
      } catch (e: any) {
        console.error("Bucket processing failed", bucket, e);
        results[bucket] = { deleted: 0, error: e.message || String(e) };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Delete-user-files error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}