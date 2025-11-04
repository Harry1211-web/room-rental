"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/Usercontext";
import { format } from "date-fns";
import ReportModal from "@/components/ReportModel";

// ==================== TYPES ====================
interface Room {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  area: number;
  status: string;
  total_confirmation_booking: number | null;
}

interface RoomImage {
  img_url: string;
}

interface ReviewWithUser {
  id: string;
  room_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  users?: {
    name?: string;
    avatar_url?: string | null;
  } | null;
}

// ==================== COMPONENT ====================
export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { idUser } = useUser();

  const [room, setRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);

  const [filterRating, setFilterRating] = useState(0);
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const reviewsPerPage = 5;

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reportData, setReportData] = useState<
    | { type: "room"; idRoom: string; roomTitle: string }
    | { type: "user"; idTargetedUser: string; targetedName: string }
    | null
  >(null);

  const [submittingReview, setSubmittingReview] = useState(false);

  // ==================== FETCH ROOM DATA ====================
  useEffect(() => {
    if (!id) return;

    const fetchRoomDetail = async () => {
      setLoading(true);

      try {
        // Fetch room info
        const { data: roomData } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", id)
          .single();

        // Fetch images
        const { data: imgData } = await supabase
          .from("room_images")
          .select("img_url")
          .eq("room_id", id);

        // Fetch tags
        const { data: tagData } = await supabase
          .from("rooms_tags")
          .select("tags(name)")
          .eq("room_id", id);

        // Fetch reviews
        const { data: reviewsData, error: reviewErr } = await supabase
          .from("reviews")
          .select(
            `
            id,
            room_id,
            reviewer_id,
            rating,
            comment,
            created_at,
            users(name, avatar_url)
          `
          )
          .eq("room_id", id)
          .order("created_at", { ascending: false });

        if (reviewErr) console.error("❌ Review fetch error:", reviewErr);

        // Compute average rating
        const average =
          reviewsData && reviewsData.length > 0
            ? reviewsData.reduce((sum, r) => sum + Number(r.rating), 0) /
              reviewsData.length
            : null;

        setRoom(roomData as Room);
        setImages((imgData ?? []).map((i: RoomImage) => i.img_url));
        setTags(
          ((tagData as any[] | null) ?? []).map((t) => t.tags?.name ?? "")
        );
        setReviews(reviewsData ?? []);
        setAvgRating(average);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [id]);

  // ==================== FILTER & SORT ====================
  const filteredReviews = reviews.filter((r) =>
    filterRating ? r.rating === filterRating : true
  );

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "high":
        return b.rating - a.rating;
      case "low":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIdx = (page - 1) * reviewsPerPage;
  const paginatedReviews = sortedReviews.slice(
    startIdx,
    startIdx + reviewsPerPage
  );

  // ==================== SUBMIT REVIEW ====================
  const handleSubmitReview = async () => {
    if (!idUser) return alert("⚠️ You must log in to write a review!");
    if (!rating || !comment.trim()) return alert("Fill in rating & comment!");

    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: idUser,
      room_id: id,
      rating,
      comment,
    });
    setSubmittingReview(false);

    if (error) alert("Error submitting review!");
    else {
      alert("✅ Review submitted!");
      setComment("");
      setRating(5);
    }
  };

  // ==================== RENDER ====================
  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!room) return <div className="p-8 text-red-500">Room not found!</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pt-32">
      <h1 className="text-3xl font-bold">{room.title}</h1>
      <p className="text-gray-600">{room.city}</p>

      {/* Rating */}
      {avgRating ? (
        <p className="text-yellow-500 font-semibold">
          ⭐ {avgRating.toFixed(1)} / 5 ({reviews.length} reviews)
        </p>
      ) : (
        <p className="text-gray-400">No reviews yet</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {(images.length ? images : ["/room-img-default.jpg"]).map((url, idx) => (
          <div key={idx} className="relative w-full h-60 rounded-lg overflow-hidden">
            <Image
              src={url}
              alt="Room image"
              fill
              className="object-cover"
              priority
            />
          </div>
        ))}
      </div>

      {/* Room info */}
      <div className="text-lg space-y-2">
        <p><span className="font-semibold">📍 Address:</span> {room.address}</p>
        <p><span className="font-semibold">📏 Area:</span> {room.area} m²</p>
        <p><span className="font-semibold">📅 Total bookings:</span> {room.total_confirmation_booking ?? 0}</p>
        <p><span className="font-semibold">💰 Price:</span> {room.price.toLocaleString()} ₫ / night</p>
        <p className="text-gray-700">{room.description || "No description."}</p>
      </div>

      {/* Booking & Report buttons */}
      <div className="border-t pt-4 flex flex-col gap-4 relative">
        <div
          className={`absolute top-[-25px] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded-md ${idUser ? 'hidden' : 'block'}`}
          style={{ display: idUser ? 'none' : 'block' }}
        >
          Please login to book or report
        </div>
        <Button
          disabled={!idUser}
          className={`mt-3 ${idUser ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"} text-white px-6 py-2 rounded-lg`}
        >
          Book now
        </Button>

        <Button
          disabled={!idUser}
          onClick={() => setReportData({ type: "room", idRoom: id, roomTitle: room.title })}
          className={`mt-3 ${idUser ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"} text-white px-6 py-2 rounded-lg`}
        >
          🚩 Report this room
        </Button>
      </div>

      {/* Review section */}
      <div className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">Tenant Reviews</h2>

        {/* Filter & sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>{star} stars</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="high">Highest rating</option>
            <option value="low">Lowest rating</option>
          </select>
        </div>

        {/* Review list */}
        {paginatedReviews.length > 0 ? (
          paginatedReviews.map((review) => {
            const reviewerName = review.users?.name || "Anonymous user";
            const reviewerAvatar =
              review.users?.avatar_url?.trim() ||
              "https://bfohmdgcgylgbdmpqops.supabase.co/storage/v1/object/public/avatars/avatar_default.jpg";

            return (
              <div key={review.id} className="border p-4 rounded-lg relative">
                <div className="flex items-center gap-3">
                  <Image
                    src={reviewerAvatar}
                    alt={reviewerName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{reviewerName}</p>
                    <p className="text-yellow-500">⭐ {review.rating}/5</p>
                  </div>
                </div>
                <p className="mt-2 text-gray-700">{review.comment}</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(review.created_at), "dd/MM/yyyy")}
                </p>

                <button
                  onClick={() =>
                    setReportData({
                      type: "user",
                      idTargetedUser: review.reviewer_id,
                      targetedName: reviewerName,
                    })
                  }
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm"
                >
                  🚩 Report
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No matching reviews found.</p>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
          <span>Page {page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>

        {/* Report modal */}
        {reportData && (
          <ReportModal
            isOpen={!!reportData}
            onClose={() => setReportData(null)}
            idRoom={reportData.type === "room" ? reportData.idRoom : undefined}
            idTargetedUser={reportData.type === "user" ? reportData.idTargetedUser : undefined}
            roomTitle={reportData.type === "room" ? reportData.roomTitle : undefined}
            targetedName={reportData.type === "user" ? reportData.targetedName : undefined}
          />
        )}
      </div>
    </div>
  );
}
