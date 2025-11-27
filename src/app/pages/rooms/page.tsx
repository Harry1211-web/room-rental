// app/dashboard/rooms/page.tsx
"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import { toast } from "sonner";

/**
 * Rooms Dashboard
 * Schema-Aligned Version
 */

// 1. Updated Interfaces to match DB Schema
interface Tag {
  tag_id: string; // Changed from 'id' to 'tag_id'
  name: string;
  value_type: string; 
  value?: string;
  amount?: number;
}

interface Room {
  id: string;
  title: string;
  description: string;
  city: string;
  price: number; // Schema says integer
  area: string;  // Schema says text
  address: string;
  average_rating: number;
  room_images: { id: string; img_url: string; order_index: number }[];
  rooms_tags: { tag_id: string; tags: Tag }[]; // Join table structure
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string; // bookings_status_enum
  total_price: number;
  tenant_id: string;
  users: { name: string; email: string };
}

interface RoomImage {
  id: string;
  img_url: string;
}

export default function RoomsDashboardPage() {
  const router = useRouter();
  const { idUser, loading } = useUser();

  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  
  // Selection State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // UI State
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  
  // Tag Creation State
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState("Amenities");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [hasFocused, setHasFocused] = useState(false);

  // Form State
  const [form, setForm] = useState({
    id: "",
    landlord_id: "",
    title: "",
    description: "",
    city: "",
    price: "",
    area: "",
    address: "",
  });

  useEffect(() => {
    if (!loading && idUser) {
      setForm((prev) => ({ ...prev, landlord_id: idUser }));
    }
  }, [loading, idUser]);

  useEffect(() => {
    if (loading) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (showNewModal && !hasFocused) {
      titleInputRef.current?.focus();
      setHasFocused(true);
    }
    if (!showNewModal) setHasFocused(false);
  }, [showNewModal, hasFocused]);

  // -------------------------------------------
  // Tag Grouping Logic
  // -------------------------------------------
  const groupedTags = useMemo(() => {
    return tags.reduce((acc, tag) => {
      const category = tag.value_type || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(tag);
      return acc;
    }, {} as Record<string, Tag[]>);
  }, [tags]);

  const availableCategories = useMemo(() => {
    const cats = Object.keys(groupedTags);
    return cats.length > 0 ? cats : ["Amenities", "Rules", "Safety"];
  }, [groupedTags]);

  async function loadAll() {
    await Promise.all([fetchRooms(), fetchTags()]);
  }

  // ---------- DATA FETCHING (Corrected) ----------

  async function fetchRooms() {
    // Note: nested select for tags needs to call 'tag_id' inside 'tags()'
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        id, title, description, city, price, area, address, average_rating,
        room_images(id, img_url, order_index),
        rooms_tags(
          tag_id, 
          tags(tag_id, name, value_type, value)
        )
      `)
      .eq("landlord_id", idUser)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchRooms error:", error);
      toast.error("Failed to load rooms");
    }
    setRooms(data as unknown as Room[] || []);
  }

  async function fetchTags() {
    // Corrected: Select 'tag_id' instead of 'id'
    const { data, error } = await supabase
      .from("tags")
      .select("tag_id, name, value_type, value, amount") 
      .order("value_type", { ascending: true })
      .order("name", { ascending: true });
      
    if (error) console.error("fetchTags error:", error);
    setTags(data as unknown as Tag[] || []);
  }

  // ---------- CRUD OPERATIONS ----------

  async function createRoom() {
    const payload = {
      landlord_id: idUser,
      title: form.title,
      description: form.description,
      city: form.city,
      price: Number(form.price) || 0,
      area: form.area, // DB is text, passing string is correct
      address: form.address,
    };

    const { data, error } = await supabase
      .from("rooms")
      .insert([payload])
      .select()
      .single();

    if (error) return toast.error("Error creating room: " + error.message);
    
    const roomId = data.id;

    // Attach tags
    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: roomId,
        tag_id: tag_id, // Explicit mapping
      }));
      await supabase.from("rooms_tags").insert(rows);
    }
    
    toast.success("Room created successfully");
    resetForm();
    await fetchRooms();
    setShowNewModal(false);
  }

  async function startEdit(room: Room) {
    setSelectedRoom(room);
    setForm({
      id: room.id,
      title: room.title || "",
      description: room.description || "",
      city: room.city || "",
      price: room.price?.toString() || "",
      landlord_id: idUser!,
      address: room.address || "",
      area: room.area || "", // DB is text
    });
    
    // Extract existing tag IDs from the join table
    const sel = (room.rooms_tags || []).map((rt) => rt.tag_id);
    setSelectedTagIds(sel);
    setShowEditModal(true);
  }

  async function updateRoom() {
    const payload = {
      title: form.title,
      description: form.description,
      city: form.city,
      price: Number(form.price) || 0,
      area: form.area,
      address: form.address,
    };

    const { error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", form.id);

    if (error) return toast.error("Update error: " + error.message);

    // Update tags: delete all then insert new
    await supabase.from("rooms_tags").delete().eq("room_id", form.id);
    
    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: form.id,
        tag_id: tag_id,
      }));
      await supabase.from("rooms_tags").insert(rows);
    }

    toast.success("Room updated successfully");
    resetForm();
    await fetchRooms();
    setShowEditModal(false);
  }

  async function deleteRoom(id: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    // Delete dependencies first (though cascade might handle it, better explicit)
    await supabase.from("room_images").delete().eq("room_id", id);
    await supabase.from("rooms_tags").delete().eq("room_id", id);
    await supabase.from("bookings").delete().eq("room_id", id);
    await supabase.from("rooms").delete().eq("id", id);
    
    await fetchRooms();
    toast.success("Room deleted");
  }

  function resetForm() {
    setForm({
      id: "",
      landlord_id: idUser || "",
      title: "",
      description: "",
      city: "",
      price: "",
      area: "",
      address: "",
    });
    setSelectedTagIds([]);
    setSelectedRoom(null);
  }

  // ---------- TAGS LOGIC ----------
  
  async function createTag() {
    if (!newTagName) return;
    const { error } = await supabase.from("tags").insert([{ 
      name: newTagName,
      value_type: newTagCategory,
      value: newTagName // Optional: filling value same as name for now
    }]);
    
    if (error) return toast.error("Create tag error: " + error.message);
    
    setNewTagName("");
    await fetchTags();
    toast.success("Tag created");
  }

  function toggleTagSelection(tag_id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tag_id)
        ? prev.filter((t) => t !== tag_id)
        : [...prev, tag_id]
    );
  }

  // ---------- IMAGES LOGIC ----------
  async function openImages(room: Room) {
    setSelectedRoom(room);
    const { data } = await supabase
      .from("room_images")
      .select("*")
      .eq("room_id", room.id)
      .order("order_index");
    setRoomImages(data || []);
    setShowImagesModal(true);
  }

  async function uploadImage(file?: File) {
    if (!selectedRoom || !file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("idRoom", selectedRoom.id);

    try {
      const res = await fetch("/api/room_img", { method: "POST", body: formData });
      const data = await res.json();
      
      await supabase
        .from("room_images")
        .insert([{ room_id: selectedRoom.id, img_url: data.url }]);
      
      setRoomImages(await fetchRoomImages(selectedRoom.id));
      await fetchRooms(); 
      toast.success("Image uploaded");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    }
  }

  async function fetchRoomImages(room_id: string) {
    const { data } = await supabase
      .from("room_images")
      .select("*")
      .eq("room_id", room_id)
      .order("order_index");
    return data || [];
  }

  async function deleteImage(imgId: string) {
    if (!confirm("Delete this image?")) return;
    if (!selectedRoom) return;

    const formData = new FormData();
    formData.append("action", "delete-one");
    formData.append("idRoom", selectedRoom.id);
    formData.append("img_id", imgId);

    const res = await fetch("/api/room_img", { method: "DELETE", body: formData });
    const data = await res.json();
    if (data.error) return toast.error(data.error);

    setRoomImages(await fetchRoomImages(selectedRoom.id));
    await fetchRooms();
    toast.success("Image deleted");
  }

  // ---------- BOOKINGS LOGIC ----------
  async function openBookings(room: Room) {
    setSelectedRoom(room);
    // Note: Schema 'bookings' has 'tenant_id'. 
    // The relationship 'users' usually relies on FK 'bookings_tenant_id_fkey' being detected.
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, start_time, end_time, status, tenant_id, created_at, total_price,
        users(name, email)
      `)
      .eq("room_id", room.id)
      .order("created_at", { ascending: false });

    if(error) console.error("fetchBookings error", error);
    setBookings(data as unknown as Booking[] || []);
    setShowBookingsModal(true);
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (selectedRoom) {
      openBookings(selectedRoom); // Refresh list
      toast.success(`Booking ${status}`);
    }
  }

  // ---------- COMPONENTS ----------

  // TagSelector using tag_id
  const TagSelector = ({ 
    readonly = false 
  }: { 
    readonly?: boolean 
  }) => (
    <div className="space-y-4 max-h-[300px] overflow-y-auto border p-2 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      {Object.keys(groupedTags).map((category) => (
        <div key={category}>
          <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 mt-1 border-b dark:border-gray-700 pb-1">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {groupedTags[category].map((t) => (
              <button
                key={t.tag_id} // Changed to tag_id
                type="button"
                disabled={readonly}
                onClick={() => !readonly && toggleTagSelection(t.tag_id)} // Changed to tag_id
                className={`px-2 py-1 rounded text-xs border transition-all duration-200 ${
                  readonly 
                    ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-default"
                    : selectedTagIds.includes(t.tag_id) // Changed to tag_id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                }`}
              >
                {t.name}
                {!readonly && selectedTagIds.includes(t.tag_id) && <span className="ml-1 opacity-70">✓</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const Sheet = ({ open, onClose, title, children }: any) => (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity bg-black/40 backdrop-blur-sm ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[720px] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div>{children}</div>
        </div>
      </aside>
    </>
  );

  const Btn = ({ children, onClick, className }: any) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  if (loading) return <div className="p-6 pt-32 animate-pulse text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 pt-32 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Rooms Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your listings, bookings, and content.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => { resetForm(); setShowNewModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white border-transparent"
          >
            + New Room
          </Btn>
          <Btn
            onClick={() => setShowTagsModal(true)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Manage Tags
          </Btn>
          <Btn
            onClick={() => fetchRooms()}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ↻ Refresh
          </Btn>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div key={r.id} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            {/* Image */}
            <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
              {r.room_images?.[0]?.img_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.room_images[0].img_url}
                  alt={r.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm">No cover image</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                {r.price?.toLocaleString()} vnđ
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{r.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                📍 {r.city}
              </p>

              {/* Mini Tags Display */}
              <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                {(r.rooms_tags || []).slice(0, 4).map((rt) => (
                  <span
                    key={rt.tag_id}
                    className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border dark:border-gray-600"
                  >
                    {rt.tags?.name}
                  </span>
                ))}
                {(r.rooms_tags?.length || 0) > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-gray-400">+{(r.rooms_tags?.length || 0) - 4} more</span>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Btn onClick={() => startEdit(r)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  Edit Details
                </Btn>
                <Btn onClick={() => openImages(r)} className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                  Photos
                </Btn>
                <Btn onClick={() => openBookings(r)} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                  Bookings
                </Btn>
                <Btn onClick={() => deleteRoom(r.id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
                  Delete
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Create Room Sheet */}
      <Sheet
        open={showNewModal}
        onClose={() => { resetForm(); setShowNewModal(false); }}
        title="Create New Room"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
               <input
                 ref={titleInputRef}
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 placeholder="e.g. Sunny Apartment in D1"
                 value={form.title}
                 onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
               />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <input
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g. Ho Chi Minh City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              rows={4}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Describe the room..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price (VND)</label>
               <input
                 type="number"
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.price}
                 onChange={(e) => setForm({ ...form, price: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Area (Text)</label>
               <input
                 type="text" 
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.area}
                 onChange={(e) => setForm({ ...form, area: e.target.value })}
                 placeholder="e.g. 45m2"
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
               <input
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.address}
                 onChange={(e) => setForm({ ...form, address: e.target.value })}
               />
             </div>
          </div>

          {/* Categorized Tag Selector */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Features & Tags</label>
            <TagSelector />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Btn onClick={createRoom} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              Create Room
            </Btn>
            <Btn onClick={() => { resetForm(); setShowNewModal(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* 2. Edit Room Sheet */}
      <Sheet
        open={showEditModal}
        onClose={() => { resetForm(); setShowEditModal(false); }}
        title="Edit Room"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Title</label>
               <input
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.title}
                 onChange={(e) => setForm({ ...form, title: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">City</label>
               <input
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.city}
                 onChange={(e) => setForm({ ...form, city: e.target.value })}
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={4}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Price</label>
               <input
                 type="number"
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.price}
                 onChange={(e) => setForm({ ...form, price: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Area</label>
               <input
                 type="text"
                 className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                 value={form.area}
                 onChange={(e) => setForm({ ...form, area: e.target.value })}
               />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
             </div>
          </div>

          {/* Categorized Tag Selector */}
          <div>
            <label className="block mb-2 text-sm font-medium">Features & Tags</label>
            <TagSelector />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Btn onClick={updateRoom} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Btn>
            <Btn onClick={() => { resetForm(); setShowEditModal(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* 3. Manage Tags Sheet */}
      <Sheet
        open={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        title="Manage Tags"
      >
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
           <h4 className="text-sm font-semibold mb-3">Add New Tag</h4>
           <div className="flex flex-col gap-3">
             <div className="flex gap-2">
                <input 
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag Name (e.g. WiFi, Pool)"
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {!availableCategories.includes("Amenities") && <option value="Amenities">Amenities</option>}
                  {!availableCategories.includes("Rules") && <option value="Rules">Rules</option>}
                </select>
             </div>
             <Btn onClick={createTag} className="bg-blue-600 text-white w-full">
               Add Tag
             </Btn>
           </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Existing Tags</h4>
          <div className="space-y-6">
            {Object.keys(groupedTags).map((category) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-300">
                    {category}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupedTags[category].map((t) => (
                    <div
                      key={t.tag_id}
                      className="flex justify-between items-center px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded text-sm"
                    >
                      <span className="dark:text-gray-300">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      {/* 4. Images Sheet */}
      <Sheet
        open={showImagesModal}
        onClose={() => { setSelectedRoom(null); setShowImagesModal(false); }}
        title={selectedRoom ? `Gallery: ${selectedRoom.title}` : "Images"}
      >
        <div className="mb-6">
          <Btn onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 text-white flex justify-center items-center gap-2 py-3">
            <span>☁️</span> Upload New Image
          </Btn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await uploadImage(f);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {roomImages.map((img) => (
            <div key={img.id} className="relative group border rounded-lg overflow-hidden dark:border-gray-700">
              <img
                src={img.img_url}
                alt="room"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => deleteImage(img.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm shadow-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {roomImages.length === 0 && (
            <div className="col-span-2 text-center py-10 text-gray-500 border-2 border-dashed rounded-lg dark:border-gray-700">
              No images uploaded yet.
            </div>
          )}
        </div>
      </Sheet>

      {/* 5. Bookings Sheet */}
      <Sheet
        open={showBookingsModal}
        onClose={() => { setShowBookingsModal(false); setSelectedRoom(null); }}
        title="Bookings History"
      >
        <div className="space-y-4">
          {bookings.length === 0 && (
             <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
               No bookings found for this room.
             </div>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h5 className="font-bold text-gray-900 dark:text-white">{b.users?.name || "Unknown User"}</h5>
                   <p className="text-xs text-gray-500">{b.users?.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                  b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {b.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 my-3">
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span className="font-medium">{new Date(b.start_time).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span className="font-medium">{new Date(b.end_time).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1 dark:border-gray-700">
                  <span>Total Price:</span>
                  <span className="font-bold text-blue-600">{b.total_price?.toLocaleString()} VND</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t dark:border-gray-700">
                <button
                  className="flex-1 py-1.5 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-700 rounded dark:bg-green-900/20 dark:text-green-400"
                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                >
                  Confirm
                </button>
                <button
                  className="flex-1 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 rounded dark:bg-red-900/20 dark:text-red-400"
                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}