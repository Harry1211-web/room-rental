"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import { HoverCard } from "../../components/HoverCard";
import { useRouter } from "next/navigation";

interface SupabaseRoom {
  id: string;
  title: string | null;
  status: string | null;
  created_at?: string | null;
  landlord_id?: string | null;
  users?: { name: string | null; email?: string | null }[] | null;
  rooms_tags?:
    | {
        tags: { name: string } | { name: string }[] | null;
      }[]
    | null;
  total_confirm_booking?: number | null;
}

interface Room {
  id: string;
  title: string;
  status: string;
  landlordName: string;
  landlordEmail?: string;
  tags: string[];
  total_confirm_booking: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [bookingSort, setBookingSort] = useState<"asc" | "desc" | null>(null);
  
  const router = useRouter();
  
  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          title,
          status,
          created_at,
          landlord_id,
          users(name, email),
          rooms_tags(tags(name)),
          total_confirm_booking
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized: Room[] = (data as any[]).map((r) => {
        const userObj = Array.isArray(r.users) ? r.users[0] ?? null : r.users;
        const landlordName = userObj?.name ?? "—";
        const landlordEmail = userObj?.email;

        return {
          id: r.id,
          title: r.title ?? "—",
          status: r.status ?? "available",
          landlordName,
          landlordEmail,
          tags:
            r.rooms_tags?.flatMap((rt: any) => {
              if (!rt?.tags) return [];
              return Array.isArray(rt.tags) ? rt.tags.map((t: any) => t.name) : [rt.tags.name];
            }) ?? [],
          total_confirm_booking: r.total_confirm_booking ?? 0,
        };
      });

      setRooms(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load room list!");
    }
  }, []);

  const fetchTags = useCallback(async () => {
    const { data, error } = await supabase.from("tags").select("*").order("created_at", { ascending: false });
    if (error) return toast.error("Unable to load tags!");
    setTags(data);
  }, []);

  const addTag = async (name: string) => {
    const { error } = await supabase.from("tags").insert({ name });
    if (error) return toast.error("Unable to add tag!");
    toast.success("Added tag!");
    fetchTags();
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error(`Unable to delete tag! ${error.message ?? ""}`);
      return;
    }
    toast.success("Deleted tag!");
    fetchTags();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error("Unable to delete room!");
    toast.success("Deleted room!");
    fetchRooms();
  };

  useEffect(() => {
    fetchRooms();
    fetchTags();
  }, [fetchRooms, fetchTags]);

  const filteredRooms = rooms
    .filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.landlordName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      const matchesTag = filterTag === "all" || r.tags.includes(filterTag);
      return matchesSearch && matchesStatus && matchesTag;
    })
    .sort((a, b) => {
      if (!bookingSort) return 0;
      return bookingSort === "asc"
        ? a.total_confirm_booking - b.total_confirm_booking
        : b.total_confirm_booking - a.total_confirm_booking;
    });

  return (
    <div className="p-6 space-y-10">
      {/* ROOM MANAGEMENT */}
      <div>
        <h1 className="text-2xl font-bold mb-4">🏠 Room management</h1>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="🔍 Search by room title or landlord"
            className="border p-2 rounded w-128"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
          <select
            className="border p-2 rounded"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="border p-2 rounded"
            value={bookingSort ?? ""}
            onChange={(e) =>
              setBookingSort(e.target.value ? (e.target.value as "asc" | "desc") : null)
            }
          >
            <option value="">No arrangement</option>
            <option value="desc">Booking high → low</option>
            <option value="asc">Booking low → high</option>
          </select>
        </div>

        <DataTable<Room>
          columns={[
            { key: "id", label: "ID" },
            {
              key: "title",
              label: "Room title",
              render: (row) => (
                <HoverCard
                  content={
                    <div className="space-y-1 text-sm">
                      <p><strong>Title:</strong> {row.title}</p>
                      <p><strong>Status:</strong> {row.status}</p>
                      <p><strong>Tags:</strong> {row.tags.join(", ") || "—"}</p>
                      <p><strong>Total bookings:</strong> {row.total_confirm_booking}</p>
                    </div>
                  }
                >
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => router.push(`/pages/room/${row.id}`)}
                  >
                    {row.title}
                  </button>
                </HoverCard>
              ),
            },
            {
              key: "landlordName",
              label: "Landlord",
              render: (row) => (
                <HoverCard
                  content={
                    <div className="space-y-1">
                      <p><strong>Name:</strong> {row.landlordName}</p>
                      {row.landlordEmail && <p><strong>Email:</strong> {row.landlordEmail}</p>}
                    </div>
                  }
                >
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => router.push(`/pages/user/${row.id}`)}
                  >
                    {row.landlordName}
                  </button>
                </HoverCard>
              ),
            },
            { key: "status", label: "Status" },
            { key: "tags", label: "Tags", render: (row) => row.tags.join(", ") },
            { key: "total_confirm_booking", label: "Total booking" },
          ]}
          data={filteredRooms}
          onDelete={(r) => deleteRoom(r.id)}
        />
      </div>

      {/* TAG MANAGEMENT */}
      <div>
        <h2 className="text-xl font-semibold mb-3">🏷️ Tag management</h2>
        <TagManager tags={tags} addTag={addTag} deleteTag={deleteTag} />
      </div>
    </div>
  );
}

function TagManager({
  tags,
  addTag,
  deleteTag,
}: {
  tags: { id: string; name: string }[];
  addTag: (name: string) => void;
  deleteTag: (id: string) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const [searchTag, setSearchTag] = useState("");

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchTag.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="border p-2 rounded w-128"
          placeholder="🔍 Search tag by name or id"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
        />
        <input
          className="border p-2 rounded w-64"
          placeholder="Add new tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded"
          onClick={() => {
            if (newTag.trim()) {
              addTag(newTag.trim());
              setNewTag("");
            }
          }}
        >
          ➕ Add
        </button>
      </div>

      <DataTable
        columns={[{ key: "id", label: "ID" }, { key: "name", label: "Name" }]}
        data={filteredTags}
        onDelete={(t) => deleteTag(t.id)}
      />
    </div>
  );
}
