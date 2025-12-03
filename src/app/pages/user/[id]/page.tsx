"use client";

import imageCompression from "browser-image-compression";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { format } from "date-fns";
import { useUser } from "@/app/context/Usercontext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

//==================== TYPES ====================
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

//==================== MODAL COMPONENT ====================

export function ConfirmDeleteModal({ open, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>

        <p className="text-gray-700 dark:text-gray-300">
          This action cannot be undone. All your data including rooms, reviews, and images will be permanently deleted.
        </p>

        <DialogFooter className="mt-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Profile
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//==================== MAIN COMPONENT ====================
export default function UserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setLoading, logout } = useUser();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  //Custom file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const [disabledButton, setDisabledButton] = useState<boolean>(false);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  //Fetch current logged-in user to check ownership
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

  //Fetch target user data, reviews, and rooms
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
          .select("*, room_images(img_url)")
          .eq("landlord_id", id)
          .order("created_at", { ascending: false });
        if (roomsError) throw roomsError;

        //Extract the first image URL for room cover
        const roomsList: Room[] = roomsData?.map(r => ({
            ...r,
            image_url: r.room_images?.[0]?.img_url || null
        })) || [];


        setUser(userData);
        setReviews((reviewsData as unknown as ReviewWithRoom[]) || []);
        setRooms(roomsList);
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

  //==================== FILTER & SORT LOGIC ====================
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

  //==================== HANDLE PROFILE UPDATE ====================
  const handleSaveProfile = async () => {
    setDisabledButton(true)
    try {
      let avatarUrl = user?.avatar_url || null;
      let shouldDeleteOldAvatar = false;

      //1. Check for Delete action: No new file, but user had an old avatar, AND preview is set to default image.
      if (!newAvatarFile && user.avatar_url && previewAvatar === "/avatar_default.jpg") {
          shouldDeleteOldAvatar = true;
          avatarUrl = null; 
      }

      //2. Handle New File Upload
      if (newAvatarFile) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("file", newAvatarFile);

        const res = await fetch("/api/avatar", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        avatarUrl = data.avatarUrl;
        shouldDeleteOldAvatar = false; //Uploading new file overrides delete command
      }
      
      //3. Execute Storage Deletion
      if (shouldDeleteOldAvatar) {
          //Call API DELETE to remove the physical file from Supabase Storage
          await fetch("/api/avatar", {
              method: "DELETE",
              body: (() => {
                  const formData = new FormData();
                  formData.append("userId", user.id);
                  return formData;
              })(),
          });
      }

      //4. Update Profile in Database
      const { data, error } = await supabase
        .from("users")
        .update({ name: editName, email: editEmail, phone_number: editPhone, avatar_url: avatarUrl })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      
      setUser({
        ...data,
        avatar_url: data.avatar_url ? data.avatar_url + `?t=${Date.now()}` : null
      });
      setEditing(false);
      setNewAvatarFile(null);
      setPreviewAvatar(null); //Reset preview
      
      //Reset input file ref sau khi lưu
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
    setDisabledButton(false)
  };

  //==================== HANDLE PROFILE DELETION ====================
  const handleDeleteProfile = () => {
    if (!user) return;
    setOpenConfirmDelete(true);
  };

  const confirmDelete = async () => {
    setOpenConfirmDelete(false);
    if (!user) return;

    try {
      setLoading(true);

      //1. Get rooms listed by user
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .eq("landlord_id", user.id);
      if (roomsError) throw roomsError;

      //2. Delete related data if user is a landlord
      if (roomsData?.length) {
        for (const room of roomsData) {
          //2a. Delete room images (Storage & DB)
          await fetch("/api/storage/room_images", {
            method: "DELETE",
            body: (() => {
              const formData = new FormData();
              formData.append("action", "delete-all");
              formData.append("idRoom", room.id);
              return formData;
            })(),
          });

          //2b. Delete room verifications (Storage & DB)
          await fetch("/api/storage/verification", {
            method: "DELETE",
            body: (() => {
                const formData = new FormData();
                formData.append("action", "delete-all");
                formData.append("idRoom", room.id);
                return formData;
            })(),
          });
          
          //Xóa records verifications trong DB
          await supabase
            .from("verifications")
            .delete()
            .eq("room_id", room.id);
        }
      }
      
      //3. Delete avatar (Storage)
      if (user.avatar_url) {
        await fetch("/api/avatar", {
          method: "DELETE",
          body: (() => {
            const formData = new FormData();
            formData.append("userId", user.id);
            return formData;
          })(),
        });
      }

      //4. Delete user record
      const { error: deleteUserError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      if (deleteUserError) throw deleteUserError;

      //5. Sign out & redirect
      alert("User and all related data deleted.");
      logout();
      router.push("/");
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Failed to delete user. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 pt-32">
      {/* ==================== USER INFO ==================== */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
        <Image
          src={previewAvatar || user.avatar_url || "/avatar_default.jpg"}
          unoptimized
          width={140}
          height={140}
          alt={user.name}
          className="rounded-full object-cover shadow-lg w-36 h-36"
        />
        <div className="text-center sm:text-left w-full max-w-md">
          {isOwner && editing ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border rounded px-3 py-2 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Name"
              />
              <label className="block text-sm font-medium">Email:</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="border rounded px-3 py-2 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Email"
              />
              <label className="block text-sm font-medium">Phone number:</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="border rounded px-3 py-2 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Phone Number"
              />
              
              {/* CUSTOM INPUT FILE */}
              <div>
                <label className="block mb-1 text-sm font-medium">New Avatar (Optional):</label>
                
                {/* Ẩn input file gốc và gán ref */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {

                      //Compress image before setting
                      const compressed = await imageCompression(file, {
                        maxSizeMB: 0.15,
                        maxWidthOrHeight: 256,
                        useWebWorker: true,
                      });

                      setNewAvatarFile(compressed);
                      setPreviewAvatar(URL.createObjectURL(compressed));
                    } else {
                      setNewAvatarFile(null);
                      setPreviewAvatar(null);
                    }
                  }}
                />

                {/* Button tùy chỉnh để kích hoạt input file */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  {/* Hiển thị tên file nếu đã chọn, hoặc text mặc định */}
                  {newAvatarFile ? `Selected: ${newAvatarFile.name}` : "Click to choose a new image"}
                </button>
              </div>
              
              {/* NÚT XÓA AVATAR HIỆN TẠI */}
              {(user.avatar_url || newAvatarFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setNewAvatarFile(null); 
                    setPreviewAvatar("/avatar_default.jpg"); 
                    //Reset input file ref
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                  }}
                  className="text-red-500 hover:text-red-600 text-sm underline -mt-2 block"
                >
                  Clear current Avatar
                </button>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold"
                  disabled={disabledButton}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    //Reset edit states to current user data
                    setEditName(user.name);
                    setEditEmail(user.email);
                    setEditPhone(user.phone_number);
                    setNewAvatarFile(null);
                    setPreviewAvatar(null);
                    //Reset input file ref
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                  }}
                  className="border px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-600 mt-2 dark:text-gray-300 flex items-center gap-2">
                📧 {user.email}
              </p>
              <p className="text-gray-600 mt-1 dark:text-gray-300 flex items-center gap-2">
                📞 {user.phone_number}
              </p>
              <p className="mt-2 text-gray-400 text-sm">
                Joined on {format(new Date(user.created_at || ""), "dd/MM/yyyy")}
              </p>
              {isOwner && (
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    ✏️ Edit Profile
                  </button>
                  <ConfirmDeleteModal
                    open={openConfirmDelete}
                    onCancel={() => setOpenConfirmDelete(false)}
                    onConfirm={confirmDelete}
                  />

                  <button
                    onClick={handleDeleteProfile}
                    className="text-red-600 hover:text-red-700 font-medium transition"
                  >
                    🗑️ Delete Profile
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <hr className="dark:border-gray-700" />

      {/* ==================== ROOMS ==================== */}
      {rooms.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6">
            🏠 Rooms listed by {user.name} ({rooms.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg cursor-pointer transition-all duration-300"
                onClick={() => router.push(`/pages/room/${room.id}`)}
              >
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 relative">
                  <Image
                    src={room.image_url || "/placeholder_room.jpg"}
                    alt={room.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-1 text-gray-900 dark:text-white">{room.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
                    📍 {room.city}
                  </p>
                  <p className="mt-2 font-bold text-lg text-blue-600 dark:text-blue-400">
                    ${room.price.toLocaleString()} / night
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="dark:border-gray-700" />

      {/* ==================== REVIEWS ==================== */}
      <div>
        <h2 className="text-3xl font-bold mb-6">
          ⭐ Reviews written by {user.name} ({reviews.length})
        </h2>

        {/* Filter & sort controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <label className="font-medium text-sm">Filter:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
            className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {star} stars
              </option>
            ))}
          </select>

          <label className="font-medium text-sm ml-4">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="high">Highest rating</option>
            <option value="low">Lowest rating</option>
          </select>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            Showing {sortedReviews.length} review(s)
          </span>
        </div>

        {/* Reviews list */}
        {sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <div key={review.id} className="border p-4 rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <h3
                  className="font-semibold text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() =>
                    review.rooms && router.push(`/pages/room/${review.rooms.id}`)
                  }
                >
                  {review.rooms?.title || "Unknown room"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {review.rooms?.city} | ${review.rooms?.price?.toLocaleString()} / night
                </p>
                <p className="text-yellow-500 font-bold text-xl mt-2 mb-2">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {review.comment}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Reviewed on {format(new Date(review.created_at), "dd/MM/yyyy")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            {filterRating ? `No ${filterRating}-star reviews found.` : "No reviews yet."}
          </p>
        )}
      </div>
    </div>
  );
}