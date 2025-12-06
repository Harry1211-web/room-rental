//app/api/admin/delete-leftovers/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PAGE_SIZE = 100;
const CHUNK_DELETE = 100;

//Recursively list all files in a bucket under a prefix
async function listAllFiles(bucket: string, prefix: string): Promise<string[]> {
  const results: string[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data as any[]) {
      if (item.type === "folder" && item.name) {
        const nested = await listAllFiles(bucket, `${prefix}/${item.name}`);
        results.push(...nested);
      } else if (item.type === "file" && item.name) {
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

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    //-----------------------------
    //🔐 Verify admin user via supabaseAdmin
    //-----------------------------
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    //-----------------------------
    //🔥 Safe to delete files
    //-----------------------------
    const buckets = ["avatars", "room_images", "proof"];
    const results: Record<string, { deleted: number; error?: string }> = {};

    for (const bucket of buckets) {
      try {
        const prefix = userId;
        const files = await listAllFiles(bucket, prefix);

        //Include .keep files just in case
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
            console.error(`Remove error in bucket ${bucket}:`, removeError);
            results[bucket] = {
              deleted: totalDeleted,
              error: removeError.message || String(removeError)
            };
            continue;
          }

          if (Array.isArray(removed)) totalDeleted += removed.length;
        }

        if (!results[bucket]) results[bucket] = { deleted: totalDeleted };
      } catch (e: any) {
        console.error("Bucket processing failed:", bucket, e);
        results[bucket] = { deleted: 0, error: e.message || String(e) };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Delete-user-files error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
