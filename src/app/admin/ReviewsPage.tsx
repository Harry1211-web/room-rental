"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import { HoverCard } from "../../components/HoverCard";

interface ReviewRow {
  id: string;
  created_at: string;
  comment: string | null;
  rating: number | null;
  reviewer_id: string | null;
  room_id: string | null;
}

interface Review {
  id: string;
  created_at: string;
  comment: string | null;
  rating: number | null;
  reviewer_id: string | null;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  room_id: string | null;
  room_name?: string | null;
  landlord_id?: string | null;
  landlord_name?: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [ratingSort, setRatingSort] = useState<"asc" | "desc" | null>(null);

  const router = useRouter();

  const fetchEntities = useCallback(
    async <T,>(table: string, ids: string[], select: string): Promise<T[]> => {
      if (!ids.length) return [];
      const { data, error } = await supabase.from(table).select(select).in("id", ids);
      if (error) throw error;
      return (data as T[]) ?? [];
    },
    []
  );

  const fetchReviews = useCallback(async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("id, created_at, comment, rating, reviewer_id, room_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!reviewsData?.length) return setReviews([]);

      const reviewRows = reviewsData as ReviewRow[];
      const reviewerIds = Array.from(new Set(reviewRows.map(r => r.reviewer_id).filter(Boolean) as string[]));
      const roomIds = Array.from(new Set(reviewRows.map(r => r.room_id).filter(Boolean) as string[]));

      const usersData = await fetchEntities<{ id: string; name?: string | null; email?: string | null }>(
        "users",
        reviewerIds,
        "id, name, email"
      );

      const roomsData = await fetchEntities<{ id: string; title?: string | null; landlord_id?: string | null }>(
        "rooms",
        roomIds,
        "id, title, landlord_id"
      );

      const landlordIds = Array.from(new Set(roomsData.map(r => r.landlord_id).filter(Boolean) as string[]));

      const landlordsData = await fetchEntities<{ id: string; name?: string | null }>(
        "users",
        landlordIds,
        "id, name"
      );

      const userById = new Map(usersData.map(u => [u.id, { name: u.name ?? null, email: u.email ?? null }]));
      const roomById = new Map(roomsData.map(r => [r.id, { name: r.title ?? null, landlord_id: r.landlord_id ?? null }]));
      const landlordById = new Map(landlordsData.map(l => [l.id, { name: l.name ?? null }]));

      const normalized: Review[] = reviewRows.map(r => {
        const user = r.reviewer_id ? userById.get(r.reviewer_id) : null;
        const room = r.room_id ? roomById.get(r.room_id) : null;
        const landlord = room?.landlord_id ? landlordById.get(room.landlord_id) : null;

        return {
          ...r,
          reviewer_name: user?.name ?? null,
          reviewer_email: user?.email ?? null,
          room_name: room?.name ?? null,
          landlord_id: room?.landlord_id ?? null,
          landlord_name: landlord?.name ?? null,
        };
      });

      setReviews(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load review list!");
    }
  }, [fetchEntities]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Review deleted!");
      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete review!");
    }
  };

  const filteredReviews = reviews
    .filter(r => {
      const searchLower = search.toLowerCase();
      const matchUser = r.reviewer_name?.toLowerCase().includes(searchLower) || r.reviewer_email?.toLowerCase().includes(searchLower);
      const matchRoom = r.room_name?.toLowerCase().includes(searchLower);
      const matchRating = ratingFilter ? r.rating === ratingFilter : true;
      return (matchUser || matchRoom) && matchRating;
    })
    .sort((a, b) => {
      if (ratingSort === "asc") return (a.rating ?? 0) - (b.rating ?? 0);
      if (ratingSort === "desc") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">⭐ Reviews Management</h1>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by reviewer or room"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border dark:border-gray-700 rounded w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <select
          value={ratingFilter ?? ""}
          onChange={e => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">All rating</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{r} stars</option>
          ))}
        </select>
        <select
          value={ratingSort ?? ""}
          onChange={e => setRatingSort(e.target.value ? (e.target.value as "asc" | "desc") : null)}
          className="px-3 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">No sort</option>
          <option value="desc">Rating high → low</option>
          <option value="asc">Rating low → high</option>
        </select>
      </div>

      <DataTable<Review>
        columns={[
          {
            key: "reviewer_id",
            label: "Reviewer",
            width: "w-[120px]",
            render: r => r.reviewer_name || r.reviewer_email ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {r.reviewer_name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Email:</strong> {r.reviewer_email ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">ID:</strong> {r.reviewer_id}</p>
                </div>
              }>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => r.reviewer_id && router.push(`pages/user/${r.reviewer_id}`)}
                >
                  {r.reviewer_name ?? r.reviewer_email ?? "No name"}
                </button>
              </HoverCard>
            ) : "—",
          },
          {
            key: "room_id",
            label: "Room",
            render: r => r.room_id ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Room:</strong> {r.room_name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Landlord:</strong> {r.landlord_name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Room ID:</strong> {r.room_id}</p>
                </div>
              }>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => router.push(`pages/room/${r.room_id}`)}
                >
                  {r.room_name ?? "No name"} {r.landlord_name ? `(${r.landlord_name})` : ""}
                </button>
              </HoverCard>
            ) : "—",
          },
          { key: "comment", label: "Comment" },
          { key: "rating", label: "Rating", width: "w-[80px]", render: r => r.rating?.toString() ?? "—" },
          { 
            key: "created_at", 
            label: "Date Sent", 
            width: "w-[100px]", 
            render: r => {
              const date = new Date(r.created_at);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          },
        ]}
        data={filteredReviews}
        onDelete={row => deleteReview(row.id)}
        rowsPerPage={10}
        rowKey="id"
      />
    </div>
  );
}
