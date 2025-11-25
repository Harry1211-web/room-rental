// app/dashboard/rooms/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import { toast } from "sonner";

/**
 * Single-file dashboard for Rooms + Tags + Images + Bookings
 *
 * Converted views -> Slide-in Sheets (from right)
 * UI and logic preserved (only render flow changed)
 */

const BUCKET = "room_images";

type Room = any;
type Tag = any;
type Booking = any;
type RoomImage = any;
type Verification = any

export default function RoomsDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [verification, setVerification] = useState<Verification[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { idUser, loading, setLoading } = useUser();

  // modal / sheet visibility
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Form state (used for both create and edit)
  const [form, setForm] = useState({
    id: "",
    landlord_id: idUser,
    title: "",
    description: "",
    city: "",
    price: "",
    area: "",
    address: "",
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {setLoading(false)})

  useEffect(() => {
    if (loading) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function loadAll() {
    await Promise.all([fetchRooms(), fetchTags()]);
  }

  // ---------- ROOMS ----------
  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
        id, title, description, city, price, average_rating,
        room_images(id, img_url, order_index),
        rooms_tags(tag_id, tags(name))
      `
      )
      .eq("landlord_id", idUser)
      .order("created_at", { ascending: false });
    if (error) console.error("fetchRooms:", error);
    setRooms(data || []);
  }

  async function createRoom() {
    const payload = {
      landlord_id: idUser,
      title: form.title,
      description: form.description,
      city: form.city,
      price: Number(form.price) || 0,
      area: Number(form.area),
      address: form.address,
    };
    const { data, error } = await supabase
      .from("rooms")
      .insert([payload])
      .select()
      .single();
    if (error) return alert("Tạo phòng lỗi: " + error.message);
    const roomId = data.id;
    // attach tags
    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: roomId,
        tag_id,
      }));
      await supabase.from("rooms_tags").insert(rows);
    }
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
      landlord_id: idUser,
      address: room.address,
      area: room.area,
    });
    const sel = (room.rooms_tags || []).map((rt: any) => rt.tag_id);
    setSelectedTagIds(sel);
    setShowEditModal(true);
  }

  async function updateRoom() {
    const payload = {
      title: form.title,
      description: form.description,
      city: form.city,
      price: Number(form.price) || 0,
    };
    const { error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", form.id);
    if (error) return alert("Update lỗi: " + error.message);

    // update tags: simple approach -> delete existing room_tags then insert selected
    await supabase.from("rooms_tags").delete().eq("room_id", form.id);
    if (selectedTagIds.length) {
      const rows = selectedTagIds.map((tag_id) => ({
        room_id: form.id,
        tag_id,
      }));
      await supabase.from("rooms_tags").insert(rows);
    }

    resetForm();
    await fetchRooms();
    setShowEditModal(false);
  }

  async function deleteRoom(id: string) {
    if (!confirm("Xác nhận xóa phòng?")) return;
    // delete related rows first (room_images, rooms_tags, bookings) as needed
    await supabase.from("room_images").delete().eq("room_id", id);
    await supabase.from("rooms_tags").delete().eq("room_id", id);
    await supabase.from("bookings").delete().eq("room_id", id);
    await supabase.from("rooms").delete().eq("id", id);
    await fetchRooms();
  }

  function resetForm() {
    setForm({
      id: "",
      landlord_id: idUser,
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

  // ---------- TAGS ----------
  async function fetchTags() {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("fetchTags:", error);
    setTags(data || []);
  }

  async function createTag(name: string) {
    if (!name) return;
    const { error } = await supabase.from("tags").insert([{ name }]);
    if (error) return alert("Tạo tag lỗi: " + error.message);
    await fetchTags();
  }

  // ---------- IMAGES ----------
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
    if (!selectedRoom) return;
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("idRoom", selectedRoom.id);

    const res = await fetch("/api/room_img", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    await supabase
      .from("room_images")
      .insert([{ room_id: selectedRoom.id, img_url: data.url }]);
    setRoomImages(await fetchRoomImages(selectedRoom.id));
    await fetchRooms();
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
    if (!confirm("Delete this picture?")) return;
    const formData = new FormData();
    formData.append("action", "delete-one");
    formData.append("idRoom", selectedRoom.id);
    formData.append("img_id", imgId);

    const res = await fetch("/api/room_img", {
      method: "DELETE",
      body: formData,
    });

    const data = await res.json();
    if (data.error) return data.error;

    if (selectedRoom) setRoomImages(await fetchRoomImages(selectedRoom.id));
    await fetchRooms();
  }

  // ---------- BOOKINGS ----------
  async function openBookings(room: Room) {
    setSelectedRoom(room);
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, start_time, end_time, status, tenant_id, created_at, total_price, users(name, email)"
      )
      .eq("room_id", room.id)
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setShowBookingsModal(true);
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    await supabase
      .from("bookings")
      .update({ status: status })
      .eq("id", bookingId);
    if (selectedRoom) {
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, start_time, end_time, status, tenant_id, created_at, total_price, users(name, email)"
        )
        .eq("room_id", selectedRoom.id)
        .order("created_at", { ascending: false });
      setBookings(data || []);

      toast.success(`${status} booking`);
    }
  }

  //-----------Verification----------
  async function openVerification(room: Room) {
    setSelectedRoom(room);
    const { data } = await supabase
      .from("verifications")
      .select("*")
      .eq("room_id", room.id)
    setVerification(data || []);
    setShowVerificationModal(true);
  }

  async function uploadVerification(file?: File) {
    if (!selectedRoom) return;
    if (!file) {
      return;
    }

    const { data, error } = await supabase
      .from("verifications")
      .insert([
        {
          verified: false,
          type: "certificate",
          room_id: selectedRoom.id
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("❌ Error creating report:", error);
      alert("❌ Failed to submit the report!");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("verificationId", data.id);

    const res = await fetch("/api/verification", {
      method: "POST",
      body: formData,
    });

    const dataRespone = await res.json();
    await supabase
      .from("verifications")
      .update({proof: dataRespone.url})
      .eq("id", data.id);
    setVerification(await openVerification(selectedRoom));
    await fetchRooms();
  }

  // ---------- UI helpers ----------
  function toggleTagSelection(tag_id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tag_id)
        ? prev.filter((t) => t !== tag_id)
        : [...prev, tag_id]
    );
  }

  // Reusable small components:
  const Btn = ({ children, onClick, className }: any) => (
    <button
      onClick={onClick}
      className={
        "px-3 py-1 rounded-md border hover:opacity-90 text-sm " +
        (className || " bg-white border-gray-300")
      }
    >
      {children}
    </button>
  );
  if (loading) return <div>Loading...</div>; // hoặc skeleton UI
  // ---------- Sheet component (slide-in from right) ----------
  const Sheet = ({ open, onClose, title, children }: any) => {
    return (
      <>
        {/* overlay */}
        <div
          className={`fixed inset-0 z-40 transition-opacity ${
            open ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
          aria-hidden
          onClick={onClose}
          style={{
            transitionDuration: "200ms",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />
        {/* panel */}
        <aside
          className={`fixed top-0 right-0 z-50 h-full w-full max-w-[720px] transform bg-white shadow-2xl overflow-auto ${
            open ? "translate-x-0" : "translate-x-full"
          } transition-transform`}
          style={{ transitionDuration: "220ms" }}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button className="text-gray-500" onClick={onClose}>
                ✕
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
        </aside>
      </>
    );
  };

  // ---------- RENDER: main list + sheets ----------
  return (
    <div className="p-6 pt-32">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Rooms Management</h1>
        <div className="flex gap-2 dark:text-gray-700">
          <Btn
            onClick={() => {
              resetForm();
              setShowNewModal(true);
            }}
          >
            + New Room
          </Btn>
          <Btn onClick={() => setShowTagsModal(true)}>Manage Tags</Btn>
          <Btn onClick={() => fetchRooms()}>Refresh</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((r: Room) => (
          <div key={r.id} className="border rounded-lg p-3 shadow-sm">
            <div className="h-40 w-full bg-gray-100 rounded-md mb-2 relative">
              {r.room_images?.[0]?.img_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.room_images[0].img_url}
                  alt={r.title}
                  className="object-cover w-full h-40 rounded-md"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image
                </div>
              )}
            </div>

            <h2 className="text-lg font-medium">{r.title}</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              {r.city} · ${r.price}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 dark:text-gray-700">
              {(r.rooms_tags || []).map((rt: any) => (
                <span
                  key={rt.tag_id}
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                >
                  {rt.tags?.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 dark:text-gray-700">
              <Btn onClick={() => startEdit(r)}>Edit</Btn>
              <Btn onClick={() => openImages(r)}>Images</Btn>
              <Btn onClick={() => openBookings(r)}>Show Bookings</Btn>
              <Btn onClick={() => openVerification(r)}>Verification</Btn>
              <Btn
                className="bg-red-100 border-red-300 dark:bg-red-500 dark:border-b-red-800"
                onClick={() => deleteRoom(r.id)}
              >
                Delete
              </Btn>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- New Room Sheet ---------- */}
      <Sheet
        open={showNewModal}
        onClose={() => {
          resetForm();
          setShowNewModal(false);
        }}
        title="Create New Room"
      >
        <div className="space-y-2 dark:text-gray-700">
          <input
            className="w-full p-2 border rounded"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Area"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <div>
            <div className="mb-1 text-sm">Tags (click to toggle)</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t: Tag) => (
                <button
                  key={t.tag_id}
                  onClick={() => toggleTagSelection(t.tag_id)}
                  className={`px-2 py-1 rounded text-sm border ${
                    selectedTagIds.includes(t.tag_id)
                      ? "bg-blue-100"
                      : "bg-white"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Btn onClick={createRoom}>Create</Btn>
            <Btn
              onClick={() => {
                resetForm();
                setShowNewModal(false);
              }}
            >
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* ---------- Edit Room Sheet ---------- */}
      <Sheet
        open={showEditModal}
        onClose={() => {
          resetForm();
          setShowEditModal(false);
        }}
        title="Edit Room"
      >
        <div className="space-y-2 dark:text-gray-700">
          <input
            className="w-full p-2 border rounded"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <div>
            <div className="mb-1 text-sm">Tags (click to toggle)</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t: Tag) => (
                t.name != "verified" && (
                  <button
                  key={t.tag_id}
                  onClick={() => toggleTagSelection(t.tag_id)}
                  className={`px-2 py-1 rounded text-sm border ${
                    selectedTagIds.includes(t.tag_id)
                      ? "bg-blue-100"
                      : "bg-white"
                  }`}
                >
                  {t.name}
                </button>
                )
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Btn onClick={updateRoom}>Save</Btn>
            <Btn
              onClick={() => {
                resetForm();
                setShowEditModal(false);
              }}
            >
              Cancel
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* ---------- Images Sheet ---------- */}
      <Sheet
        open={showImagesModal}
        onClose={() => {
          setSelectedRoom(null);
          setShowImagesModal(false);
        }}
        title={selectedRoom ? `Images for: ${selectedRoom.title}` : "Images"}
      >
        <div className="flex justify-end mb-4 dark:text-gray-700">
          <Btn onClick={() => fileInputRef.current?.click()}>Upload Image</Btn>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await uploadImage(f);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {roomImages.map((img: RoomImage) => (
            <div key={img.id} className="border rounded p-2 dark:border-b-red-300">
              <img
                src={img.img_url}
                alt="room"
                className="w-full h-32 object-cover rounded"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">
                  #{String(img.id).slice(0, 6)}
                </span>
                <button
                  onClick={() => deleteImage(img.id)}
                  className="text-xs px-2 py-1 rounded bg-red-100 dark:text-gray-700 dark:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* ---------- Verification Sheet ---------- */}


      <Sheet
        open={showVerificationModal}
        onClose={() => {
          setSelectedRoom(null);
          setShowVerificationModal(false);
        }}
        title={selectedRoom ? `Verification for: ${selectedRoom.title}` : "Images"}
      >
        <div className="flex justify-end mb-4 dark:text-gray-700">
          <Btn onClick={() => fileInputRef.current?.click()}>Upload Verification</Btn>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await uploadVerification(f);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {verification.map((v: Verification) => (
            <div key={v.id} className="border rounded p-2 dark:border-b-red-300">
              <img
                src={v.proof}
                alt="room"
                className="w-full h-32 object-cover rounded"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">
                  #{String(v.id).slice(0, 6)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* ---------- Tags Sheet ---------- */}
      <Sheet
        open={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        title="Tags"
      >
        <div className="mb-4 flex items-center gap-2">
          <input
            placeholder="New tag name"
            id="new-tag"
            className="p-2 border rounded mr-2 flex-1"
          />
          <button
            className="px-3 py-1 bg-blue-100 rounded"
            onClick={() => {
              const val = (
                document.getElementById("new-tag") as HTMLInputElement
              )?.value;

              if (val.toString().toLocaleLowerCase() == "verified") {toast.error("You cannot add verified tags")}
              if (val) {
                createTag(val);
                (document.getElementById("new-tag") as HTMLInputElement).value =
                  "";
              }
            }}
          >
            Add
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tags.map((tag, index) => (
            <div
              key={`${tag.id}-${index}`}
              className="px-3 py-1 rounded-md border text-sm max-w-[120px] truncate cursor-default bg-muted hover:bg-muted/80"
              title={tag.name}
            >
              {tag.name}
            </div>
          ))}
        </div>
      </Sheet>
      {/* ---------- Bookings Sheet ---------- */}
      <Sheet
        open={showBookingsModal}
        onClose={() => {
          setShowBookingsModal(false);
          setSelectedRoom(null);
        }}
        title={selectedRoom ? `Bookings for ${selectedRoom.title}` : "Bookings"}
      >
        <div className="space-y-3">
          {bookings.length === 0 && <div>No bookings</div>}
          {bookings.map((b: Booking) => (
            <div key={b.id} className="border rounded p-3">
              <div className="flex justify-between">
                <div>
                  <div>
                    <strong>User:</strong> {b.users?.name || b.tenant_id}
                  </div>
                  <div>
                    <strong>From:</strong>{" "}
                    {new Date(b.start_time).toLocaleString()}
                  </div>
                  <div>
                    <strong>To:</strong> {new Date(b.end_time).toLocaleString()}
                  </div>
                  <div>
                    <strong>Price:</strong> {b.total_price ?? "-"}
                  </div>
                  <div>
                    <strong>Status:</strong> {b.status}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="px-3 py-4 bg-green-100 rounded"
                    onClick={() => updateBookingStatus(b.id, "confirmed")}
                  >
                    Confirm
                  </button>
                  <button
                    className="px-3 py-4 bg-red-100 rounded"
                    onClick={() => updateBookingStatus(b.id, "cancelled")}
                  >
                    Refuse
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
