"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { format } from "date-fns";
import { useUser } from "@/app/context/Usercontext";

// ==================== TYPES ====================
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  avatar_url?: string | null;
  created_at?: string;
}

interface ReviewWithRoom {
  id: string;
  room_id: string;
  rating: number;
  comment: string;
  created_at: string;
  rooms?: {
    id: string;
    title: string;
    city: string;
    price: number;
  } | null;
}

interface Room {
  id: string;
  title: string;
  city: string;
  price: number;
  image_url?: string | null;
}

// ==================== COMPONENT ====================
export default function UserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setLoading } = useUser();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewWithRoom[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading1] = useState(true);

  const [filterRating, setFilterRating] = useState(0);
  const [sortOrder, setSortOrder] = useState("newest");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    setLoading(false);
  });

  // ==================== FETCH CURRENT USER ====================
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      if (sessionData?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", sessionData.user.id)
          .single();
        setCurrentUser(profile || null);
      }
    };
    fetchCurrentUser();
  }, []);

  // ==================== FETCH USER DATA ====================
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading1(true);
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();
        if (userError) throw userError;

        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select(
            `
            id,
            room_id,
            rating,
            comment,
            created_at,
            rooms(id, title, city, price)
          `
          )
          .eq("reviewer_id", id)
          .order("created_at", { ascending: false });
        if (reviewsError) throw reviewsError;

        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .eq("landlord_id", id)
          .order("created_at", { ascending: false });
        if (roomsError) throw roomsError;

        setUser(userData);
        setReviews((reviewsData as unknown as ReviewWithRoom[]) || []);
        setRooms((roomsData as unknown as Room[]) || []);
        setEditName(userData?.name || "");
        setEditEmail(userData?.email || "");
        setEditPhone(userData?.phone_number || "");
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading1(false);
      }
    };

    fetchUser();
  }, [id]);

  // ==================== FILTER & SORT ====================
  const filteredReviews = reviews.filter((r) =>
    filterRating ? r.rating === filterRating : true
  );

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "high":
        return b.rating - a.rating;
      case "low":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!user) return <div className="p-8 text-red-500">User not found!</div>;

  const isOwner = currentUser?.id === user.id;

  // ==================== HANDLE UPDATE ====================
  const handleSaveProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ name: editName, email: editEmail, phone_number: editPhone })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setUser(data);
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  //================Delete Profile=======================
  const handleDeleteProfile = async () => {
    if (!confirm("Are you sure you want to delete your profile?")) return;
    if (!user) return;

    try {
      setLoading1(true);

      // 1️⃣ Check if user is landlord (has rooms)
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .eq("landlord_id", user.id);

      if (roomsError) throw roomsError;

      // 2️⃣ Delete all room images via API
      if (roomsData?.length) {
        for (const room of roomsData) {
          await fetch("/api/storage/room_images", {
            method: "DELETE",
            body: (() => {
              const formData = new FormData();
              formData.append("action", "delete-all");
              formData.append("idRoom", room.id);
              return formData;
            })(),
          });

          const { data: verifiData, error: verifiError } = await supabase
            .from("verifications")
            .select("id")
            .eq("room_id", room.id);

          if (verifiData?.length) {
            for (const veri of verifiData) {
              await fetch("/api/storage/verification", {
                method: "DELETE",
                body: (() => {
                  const formData = new FormData();
                  formData.append("action", "delete-all");
                  formData.append("idRoom", veri.id);
                  return formData;
                })(),
              });
            }
          }
        }
      }

      // 3️⃣ Delete avatar via API
      if (user.avatar_url) {
        await fetch("/api/storage/avatar", {
          method: "DELETE",
          body: (() => {
            const formData = new FormData();
            formData.append("userId", user.id);
            return formData;
          })(),
        });
      }

      // 5️⃣ Delete user
      const { error: deleteUserError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      if (deleteUserError) throw deleteUserError;

      alert("User and all related data deleted.");
      router.push("/"); // redirect
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Failed to delete user.");
    } finally {
      setLoading1(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 pt-32">
      {/* ==================== USER INFO ==================== */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
        <Image
          src={user.avatar_url || "/avatar_default.jpg"}
          width={140}
          height={140}
          alt={user.name}
          className="rounded-full object-cover shadow-lg"
        />
        <div className="text-center sm:text-left w-full max-w-md">
          {isOwner && editing ? (
            <div className="space-y-2">
              <label htmlFor="">Name: </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border rounded px-3 py-1 w-full"
                placeholder="Name"
              />
              <label htmlFor="">Email: </label>
              <input
                type="text"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Email"
              />
              <label htmlFor="">Phone number: </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Phone Number"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border px-4 py-1 rounded hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold">{user.name}</h1>
              <p className="text-gray-600 mt-1 dark:text-gray-300">
                Email: {user.email}
              </p>
              <p className="text-gray-600 mt-1 dark:text-gray-300">
                Phone number: {user.phone_number}
              </p>
              <p className="mt-1 text-gray-400 text-sm">
                Joined {format(new Date(user.created_at || ""), "dd/MM/yyyy")}
              </p>
              {isOwner && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-2 flex text-red-600 hover:underline"
                  >
                    Delete Profile
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================== ROOMS ==================== */}
      {rooms.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            🏠 Rooms listed by {user.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer transition transform hover:-translate-y-1"
                onClick={() => router.push(`/room/${room.id}`)}
              >
                {room.image_url && (
                  <Image
                    src={room.image_url}
                    alt={room.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{room.title}</h3>
                  <p className="text-gray-500 dark:text-gray-300">
                    {room.city}
                  </p>
                  <p className="mt-1 font-bold">
                    ${room.price.toLocaleString()} / night
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== REVIEWS ==================== */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          ⭐ Reviews by {user.name}
        </h2>

        {/* Filter & sort */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option
                className="text-gray-700 dark:text-gray-300"
                key={star}
                value={star}
              >
                {star} stars
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option className="text-gray-700 dark:text-gray-300" value="newest">
              Newest
            </option>
            <option className="text-gray-700 dark:text-gray-300" value="oldest">
              Oldest
            </option>
            <option className="text-gray-700 dark:text-gray-300" value="high">
              Highest rating
            </option>
            <option className="text-gray-700 dark:text-gray-300" value="low">
              Lowest rating
            </option>
          </select>
        </div>

        {/* Reviews list */}
        {sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <div key={review.id} className="border p-4 rounded-lg shadow-sm">
                <h3
                  className="font-semibold text-lg text-blue-600 hover:underline cursor-pointer"
                  onClick={() =>
                    review.rooms && router.push(`/room/${review.rooms.id}`)
                  }
                >
                  {review.rooms?.title || "Unknown room"}
                </h3>
                <p className="text-gray-500 dark:text-gray-300 text-sm">
                  {review.rooms?.city} | $
                  {review.rooms?.price?.toLocaleString()}
                </p>
                <p className="text-yellow-500 font-semibold mt-1">
                  ⭐ {review.rating}/5
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {review.comment}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(review.created_at), "dd/MM/yyyy")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
