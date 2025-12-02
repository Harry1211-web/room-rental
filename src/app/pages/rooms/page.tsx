// app/dashboard/rooms/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import { toast } from "sonner";

// --- 1. Types & Interfaces ---
interface Tag {
  tag_id: string;
  name: string;
  value_type: string;
  value?: string;
  amount?: number; // Ensure amount is here
}

interface Room {
  id: string;
  title: string;
  description: string;
  city: string;
  price: number;
  area: string;
  address: string;
  average_rating: number;
  room_images: { id: string; img_url: string; order_index: number }[];
  rooms_tags: { tag_id: string; tags: Tag }[];
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  tenant_id: string;
  created_at: string,
  users: { name: string; email: string; phone_number: string };
}

interface RoomImage {
  id: string;
  img_url: string;
}

interface Verification {
  id: string;
  proof: string;
  verified: boolean;
}

interface RoomFormState {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  city: string;
  price: string;
  area: string;
  address: string;
}

const INITIAL_FORM: RoomFormState = {
  id: "",
  landlord_id: "",
  title: "",
  description: "",
  city: "",
  price: "",
  area: "",
  address: "",
};

// --- 2. Sub-Components ---

const Btn = ({ children, onClick, className = "", disabled = false }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
  >
    {children}
  </button>
);

const Sheet = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => (
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
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

// --- UPDATED TAG SELECTOR ---
const TagSelector = ({
  groupedTags,
  selectedTagIds,
  onToggle,
  readonly = false,
}: {
  groupedTags: Record<string, Tag[]>;
  selectedTagIds: string[];
  onToggle: (id: string) => void;
  readonly?: boolean;
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
              key={t.tag_id}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onToggle(t.tag_id)}
              className={`px-3 py-1.5 rounded text-xs border transition-all duration-200 flex items-center gap-1.5 ${
                readonly
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-default"
                  : selectedTagIds.includes(t.tag_id)
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
              }`}
            >
              <span className="font-medium">{t.name}</span>

              {/* --- Format Update: Name (Amount) --- */}
              <span
                className={`text-[10px] ${
                  selectedTagIds.includes(t.tag_id)
                    ? "opacity-80 text-blue-100"
                    : "text-gray-400"
                }`}
              >
                ({t.amount || 0})
              </span>

              {!readonly && selectedTagIds.includes(t.tag_id) && (
                <span className="font-bold ml-0.5">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- 3. Main Component ---

export default function RoomsDashboardPage() {
  const { idUser, loading } = useUser();

  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [verification, setVerification] = useState<Verification[]>([]);

  // Selection State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // UI State
  const [modals, setModals] = useState({
    new: false,
    edit: false,
    images: false,
    tags: false,
    bookings: false,
    verification: false,
  });

  // Tag Creation State
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState("Amenities");

  const fileInputRefImages = React.useRef<HTMLInputElement>(null);
  const fileInputRefVerification = React.useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState<RoomFormState>(INITIAL_FORM);

  // --- Effects ---
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

  // --- Computed ---
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

  // --- Data Operations ---
  async function loadAll() {
    await Promise.all([fetchRooms(), fetchTags()]);
  }

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
        id, title, description, city, price, area, address, average_rating,
        room_images(id, img_url, order_index),
        rooms_tags(tag_id, tags(tag_id, name, value_type, value))
      `
      )
      .eq("landlord_id", idUser)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load rooms");
    setRooms((data as unknown as Room[]) || []);
  }

  async function fetchTags() {
    const { data } = await supabase
      .from("tags")
      .select("tag_id, name, value_type, value, amount")
      .order("value_type", { ascending: true })
      .order("name", { ascending: true });
    setTags((data as unknown as Tag[]) || []);
  }

  // --- Actions ---

  const toggleModal = (key: keyof typeof modals, val: boolean) => {
    setModals((prev) => ({ ...prev, [key]: val }));
    if (!val && (key === "new" || key === "edit")) resetForm();
  };

  function resetForm() {
    setForm({ ...INITIAL_FORM, landlord_id: idUser || "" });
    setSelectedTagIds([]);
    setSelectedRoom(null);
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleTagSelection(tag_id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tag_id)
        ? prev.filter((t) => t !== tag_id)
        : [...prev, tag_id]
    );
  }

  // --- CRUD ---

  async function createRoom() {
    const payload = {
      landlord_id: idUser,
      title: form.title,
      description: form.description,
      city: form.city,
      price: Number(form.price) || 0,
      area: Number(form.area) || 0,
      address: form.address,
    };

    if (
      !form.title ||
      !form.city ||
      !form.area ||
      Number(form.area) <= 0 ||
      Number(form.price) <= 0
    ) {
      return toast.error(
        "Title, City, Price (>0), Area  (>0), and Address are required."
      );
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert([payload])
      .select()
      .single();
    if (error) return toast.error("Error creating room: " + error.message);

    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: data.id,
        tag_id: tag_id,
      }));
      await supabase.from("rooms_tags").insert(rows);
    }

    toast.success("Room created successfully");
    await Promise.all([fetchRooms(), fetchTags()]);
    toggleModal('new', false);
  }

  async function startEdit(room: Room) {
    setSelectedRoom(room);
    setForm({
      id: room.id,
      landlord_id: idUser!,
      title: room.title || "",
      description: room.description || "",
      city: room.city || "",
      price: room.price?.toString() || "",
      area: room.area || "",
      address: room.address || "",
    });

    const sel = (room.rooms_tags || []).map((rt) => rt.tag_id);
    setSelectedTagIds(sel);
    toggleModal("edit", true);
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

    // Sync tags
    await supabase.from("rooms_tags").delete().eq("room_id", form.id);
    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: form.id,
        tag_id: tag_id,
      }));
      await supabase.from("rooms_tags").insert(rows);
    }

    toast.success("Room updated");
    Promise.all([fetchRooms(), fetchTags()]);
    toggleModal('edit', false);
  }

  async function deleteRoom(id: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const formData = new FormData();
    formData.append("action", "delete-all");
    formData.append("idRoom", selectedRoom.id);

    await fetch("/api/room_img", { method: "DELETE", body: formData });
    await supabase.from("room_images").delete().eq("room_id", id);
    await supabase.from("rooms_tags").delete().eq("room_id", id);
    await supabase.from("bookings").delete().eq("room_id", id);
    await supabase.from("rooms").delete().eq("id", id);
    Promise.all([fetchRooms(), fetchTags()]);
    toast.success("Room deleted");
  }

  async function createTag() {
    if (!newTagName) return;
    const { error } = await supabase
      .from("tags")
      .insert([
        { name: newTagName, value_type: newTagCategory, value: newTagName },
      ]);
    if (error) return toast.error(error.message);
    setNewTagName("");
    await fetchTags();
    toast.success("Tag created");
  }

  // --- Image & Verification & Booking Handlers ---
  async function openImages(room: Room) {
    setSelectedRoom(room);
    const { data } = await supabase
      .from("room_images")
      .select("*")
      .eq("room_id", room.id)
      .order("order_index");
    setRoomImages(data || []);
    toggleModal("images", true);
  }

  async function uploadImage(file?: File) {
    if (!selectedRoom || !file) return;

    try {
      const { data: rowData, error: insertError } = await supabase
        .from("room_images")
        .insert([{ room_id: selectedRoom.id, img_url: "" }])
        .select("id")
        .single();

      if (insertError || !rowData)
        throw insertError || new Error("Cannot create image row");

      const img_id = rowData.id;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("idRoom", selectedRoom.id);
      formData.append("img_id", img_id);

      const res = await fetch("/api/room_img", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      await supabase
        .from("room_images")
        .update({ img_url: data.url })
        .eq("id", img_id);

      setRoomImages(await fetchRoomImages(selectedRoom.id));
      await fetchRooms();
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    }
  }

  async function fetchRoomImages(roomId: string) {
    const { data } = await supabase
      .from("room_images")
      .select("*")
      .eq("room_id", roomId)
      .order("order_index");
    return data || [];
  }

  async function deleteImage(imgId: string) {
    if (!selectedRoom || !confirm("Delete image?")) return;
    const formData = new FormData();
    formData.append("action", "delete-one");
    formData.append("idRoom", selectedRoom.id);
    formData.append("img_id", imgId);
    await fetch("/api/room_img", { method: "DELETE", body: formData });
    await supabase.from("room_images").delete().eq("id", imgId);
    setRoomImages(await fetchRoomImages(selectedRoom.id));
    await fetchRooms();
    toast.success("Deleted");
  }

  async function openVerifications(room: Room) {
    setSelectedRoom(room);
    const { data } = await supabase
      .from("verifications")
      .select("*")
      .eq("room_id", room.id)
      .order("verified");
    setVerification(data || []);
    toggleModal("verification", true);
  }

  async function uploadVerifications(file?: File) {
    if (!selectedRoom || !file) return;

    try {
      const { data: rowData, error: insertError } = await supabase
        .from("verifications")
        .insert([
          {
            room_id: selectedRoom.id,
            landlord_id: idUser,
            verified: false,
            proof: null,
          },
        ])
        .select("id")
        .single();

      if (insertError || !rowData)
        throw insertError || new Error("Cannot create image row");

      const verification_id = rowData.id;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("idRoom", selectedRoom.id);
      formData.append("verification_id", verification_id);

      const res = await fetch("/api/verification", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      await supabase
        .from("verifications")
        .update({ proof: data.url })
        .eq("id", verification_id);

      setVerification(await fetchVerifications(selectedRoom.id));
      await fetchRooms();
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    }
  }

  async function fetchVerifications(roomId: string) {
    const { data } = await supabase
      .from("verifications")
      .select("*")
      .eq("room_id", roomId)
      .order("verified");
    return data || [];
  }

  async function deleteVerifications(veriID: string) {
    if (!selectedRoom || !confirm("Delete verification?")) return;
    const formData = new FormData();
    formData.append("action", "delete-one");
    formData.append("idRoom", selectedRoom.id);
    formData.append("verification_id", veriID);
    await fetch("/api/verification", { method: "DELETE", body: formData });
    await supabase.from("verifications").delete().eq("id", veriID);
    setVerification(await fetchVerifications(selectedRoom.id));
    await fetchRooms();
    toast.success("Deleted");
  }

  async function openBookings(room: Room) {
  setSelectedRoom(room);
  
  // 1. Lấy dữ liệu như bình thường, vẫn giữ order theo created_at
  const { data } = await supabase
    .from("bookings")
    .select("*, users(name, email, phone_number)")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false });

  // Định nghĩa thứ tự ưu tiên của status
  const statusOrder = {
    pending: 1,
    approved: 2,
    refused: 3,
  };

  if (data) {
    // 2. Sắp xếp lại mảng dữ liệu bằng JavaScript (client-side)
    const sortedBookings = (data as unknown as Booking[]).sort((a, b) => {
      const orderA = statusOrder[a.status as keyof typeof statusOrder] || 99; // Gán 99 nếu status không xác định
      const orderB = statusOrder[b.status as keyof typeof statusOrder] || 99;

      // Sắp xếp chính: theo status (1, 2, 3...)
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Sắp xếp phụ (nếu status giống nhau): theo created_at
      // Dữ liệu đã lấy order("created_at", { ascending: false }), nên nếu muốn giữ thứ tự mới nhất (DESC) thì đảo ngược:
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setBookings(sortedBookings);
  } else {
    setBookings([]);
  }

  toggleModal("bookings", true);
}

  async function updateBookingStatus(bid: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", bid);
    if (selectedRoom) openBookings(selectedRoom);
    toast.success(`Booking ${status}`);
  }

  // --- Render ---

  if (loading)
    return (
      <div className="p-6 pt-32 animate-pulse text-gray-500">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="p-6 pt-32 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Rooms Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your listings, bookings, and content.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => {
              resetForm();
              toggleModal("new", true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white border-transparent"
          >
            + New Room
          </Btn>
          <Btn
            onClick={() => toggleModal("tags", true)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
          >
            Manage Tags
          </Btn>
          <Btn
            onClick={() => fetchRooms()}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
          >
            ↻ Refresh
          </Btn>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div
            key={r.id}
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          >
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
                {r.price?.toLocaleString()} $
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                {r.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                📍 {r.city}
              </p>

              <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                {(r.rooms_tags || []).slice(0, 4).map((rt) => (
                  <span
                    key={rt.tag_id}
                    className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border dark:border-gray-600"
                  >
                    {rt.tags?.name}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Btn
                  onClick={() => startEdit(r)}
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                  Edit
                </Btn>
                <Btn
                  onClick={() => openImages(r)}
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                >
                  Photos
                </Btn>
                <Btn
                  onClick={() => openBookings(r)}
                  className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                >
                  Bookings
                </Btn>
                <Btn
                  // --- Bổ sung: Nút Verification ---
                  onClick={() => openVerifications(r)}
                  className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                >
                  Verification
                </Btn>
                <Btn
                  onClick={() => deleteRoom(r.id)}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 col-span-2"
                >
                  Delete
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CREATE MODAL --- */}
      <Sheet
        open={modals.new}
        onClose={() => toggleModal("new", false)}
        title="Create New Room"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                name="title"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g. Sunny Apartment"
                value={form.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                name="city"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.city}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={form.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Price
              </label>
              <input
                name="price"
                type="number"
                step="any"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.price}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Area
              </label>
              <input
                name="area"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.area}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                name="address"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Features
            </label>
            <TagSelector
              groupedTags={groupedTags}
              selectedTagIds={selectedTagIds}
              onToggle={toggleTagSelection}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Btn
              onClick={createRoom}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Create Room
            </Btn>
            <Btn
              onClick={() => toggleModal("new", false)}
              className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
            >
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* --- EDIT MODAL --- */}
      <Sheet
        open={modals.edit}
        onClose={() => toggleModal("edit", false)}
        title="Edit Room"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                name="title"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input
                name="city"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.city}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={form.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input
                name="price"
                type="number"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.price}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Area</label>
              <input
                name="area"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.area}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Features</label>
            <TagSelector
              groupedTags={groupedTags}
              selectedTagIds={selectedTagIds}
              onToggle={toggleTagSelection}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Btn
              onClick={updateRoom}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Btn>
            <Btn
              onClick={() => toggleModal("edit", false)}
              className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
            >
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* --- TAGS MODAL --- */}
      <Sheet
        open={modals.tags}
        onClose={() => toggleModal("tags", false)}
        title="Manage Tags"
      >
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-3">Add New Tag</h4>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag Name"
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value)}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!availableCategories.includes("Amenities") && (
                  <option value="Amenities">Amenities</option>
                )}
              </select>
            </div>
            <Btn onClick={createTag} className="bg-blue-600 text-white w-full">
              Add Tag
            </Btn>
          </div>
        </div>
        <TagSelector
          groupedTags={groupedTags}
          selectedTagIds={[]}
          onToggle={() => {}}
          readonly
        />
      </Sheet>

      {/* --- IMAGES MODAL --- */}
      <Sheet
        open={modals.images}
        onClose={() => toggleModal("images", false)}
        title="Gallery"
      >
        <div className="mb-6">
          <Btn
            onClick={() => fileInputRefImages.current?.click()}
            className="w-full bg-blue-600 text-white flex justify-center gap-2 py-3"
          >
            <span>☁️</span> Upload New Image
          </Btn>
          <input
            ref={fileInputRefImages}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await uploadImage(f);
              if (fileInputRefImages.current) fileInputRefImages.current.value = "";
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {roomImages.map((img) => (
            <div
              key={img.id}
              className="relative group border rounded-lg overflow-hidden dark:border-gray-700"
            >
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
            <div className="col-span-2 text-center py-10 text-gray-500">
              No images yet.
            </div>
          )}
        </div>
      </Sheet>

      {/* --- BOOKINGS MODAL --- */}
      <Sheet
        open={modals.bookings}
        onClose={() => toggleModal("bookings", false)}
        title="Bookings History"
      >
        <div className="space-y-4">
          {bookings.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No bookings found.
            </div>
          )}
          {bookings.map((b) => (
            <div
              key={b.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-bold text-gray-900 dark:text-white">
                    {b.users?.name || "Unknown"}
                  </h5>
                  <p className="text-xs text-gray-500">{b.users?.email}</p>
                  <p className="text-xs text-gray-500">
                    {b.users?.phone_number}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                    b.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : b.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 my-3">
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span className="font-medium">
                    {new Date(b.start_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span className="font-medium">
                    {new Date(b.end_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Total:</span>
                  <span className="font-bold text-blue-600">
                    {b.total_price?.toLocaleString()} $
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                  className="flex-1 py-1.5 text-xs bg-green-50 text-green-700 rounded"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                  className="flex-1 py-1.5 text-xs bg-red-50 text-red-700 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
      {/* --- VERIFICATION MODAL --- */}
      <Sheet
        open={modals.verification}
        onClose={() => toggleModal("verification", false)}
        title="Verification Documents"
      >
        <div className="mb-6">
          <Btn
            onClick={() => fileInputRefVerification.current?.click()}
            className="w-full bg-purple-600 text-white flex justify-center gap-2 py-3"
          >
            <span>📜</span> Upload New Proof
          </Btn>
          <input
            ref={fileInputRefVerification}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await uploadVerifications(f);
              if (fileInputRefVerification.current) fileInputRefVerification.current.value = "";
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {verification.map((v) => (
            <div
              key={v.id}
              className="flex justify-between items-center p-3 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {v.proof.endsWith(".pdf") ? "📄" : "🖼️"}
                </span>
                <div className="flex flex-col">
                  <a
                    href={v.proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-1"
                    title={v.proof.split("/").pop()}
                  >
                    {v.proof.split("/").pop() || "Document"}
                  </a>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      v.verified
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {v.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteVerifications(v.id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs shadow-lg hover:bg-red-700 active:scale-95"
              >
                Delete
              </button>
            </div>
          ))}
          {verification.length === 0 && (
            <div className="col-span-1 text-center py-10 text-gray-500">
              No verification documents uploaded.
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
