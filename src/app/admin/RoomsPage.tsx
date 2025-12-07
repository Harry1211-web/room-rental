"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import { HoverCard } from "../../components/HoverCard";
import { useRouter } from "next/navigation";
import { Plus, X} from "lucide-react";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";

interface Tag {
  id: string;
  value: string;
  value_type: string;
  amount: number;
}

interface Room {
  id: string;
  title: string;
  status: string;
  landlordName: string;
  landlordEmail?: string;
  landlord_id: string;
  tags: Array<{ id: string; value: string; amount: number }>;
  total_confirm_booking: number;
}

interface RoomDataRow {
    id: string;
    title: string | null;
    status: string;
    created_at: string;
    landlord_id: string;
    users: { name: string | null; email: string | null } | { name: string | null; email: string | null }[];
    total_confirm_booking: number | null;
}

interface RoomTagsDataRow {
    room_id: string;
    tags: { tag_id: string; name: string; value: string; value_type: string; amount: number; } | null | Array<any>;
}


export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [bookingSort, setBookingSort] = useState<"asc" | "desc" | null>(null);
  
  //Modal states
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showEditTagModal, setShowEditTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagData, setNewTagData] = useState({ value: "", value_type: "Amenities", amount: 0 });
  
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null); 
  
  const router = useRouter();
  
  const fetchRooms = useCallback(async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          title,
          status,
          created_at,
          landlord_id,
          users!landlord_id(name, email),
          total_confirm_booking
        `)
        .order("created_at", { ascending: false });

      if (roomsError) throw roomsError;

      //Cast data immediately after error check
      const rooms: RoomDataRow[] = (roomsData || []) as unknown as RoomDataRow[];
      const roomIds = rooms.map(r => r.id) || []; 

      const { data: tagsData, error: tagsError } = await supabase
        .from("rooms_tags")
        .select(`
          room_id,
          tags!inner(tag_id, name, value, value_type, amount)
        `)
        .in('room_id', roomIds);

      if (tagsError) throw tagsError;

      //Cast data immediately after error check
      const roomTags: RoomTagsDataRow[] = (tagsData || []) as unknown as RoomTagsDataRow[];

      const tagsByRoomId = (roomTags || []).reduce((acc, item) => {
        if (!acc[item.room_id]) acc[item.room_id] = [];
        if (item.tags) {
          //Handle both array and single object cases
          const tagsArray = Array.isArray(item.tags) ? item.tags : [item.tags];
          
          tagsArray.forEach(tag => {
            if (tag) {
              acc[item.room_id].push({
                id: tag.tag_id,
                name: tag.name,
                value: tag.value,
                value_type: tag.value_type,
                amount: tag.amount ?? 0 
              });
            }
          });
        }
        return acc;
      }, {} as Record<string, any[]>);

      const normalized: Room[] = (rooms || []).map((r) => {
        const userObj = Array.isArray(r.users) ? r.users[0] ?? null : r.users;
        const landlordName = userObj?.name ?? "—";
        const landlordEmail = userObj?.email;
        const landlordId = r.landlord_id ?? "";

        return {
          id: r.id,
          title: r.title ?? "—",
          status: r.status ?? "available",
          landlordName,
          landlordEmail,
          landlord_id: landlordId,
          tags: tagsByRoomId[r.id] || [],
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
    const { data, error } = await supabase
      .from("tags")
      .select("tag_id, value, value_type, amount, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error("Unable to load tags!");
    setTags(data.map(tag => ({
      id: tag.tag_id,
      value: tag.value,
      value_type: tag.value_type,
      amount: tag.amount
    })) as Tag[]);
  }, []);

  const addTag = async () => {
    if (!newTagData.value.trim()) {
      toast.error("Tag value is required!");
      return;
    }
    const { error } = await supabase.from("tags").insert({
      value: newTagData.value,
      value_type: newTagData.value_type,
      amount: newTagData.amount
    });
    if (error) return toast.error("Unable to add tag!");
    toast.success("Added tag!");
    setNewTagData({ value: "", value_type: "Amenities", amount: 0 });
    setShowAddTagModal(false);
    fetchTags();
  };

  const updateTag = async () => {
    if (!editingTag) return;
    if (!editingTag.value.trim()) {
      toast.error("Tag value is required!");
      return;
    }
    const { error } = await supabase
      .from("tags")
      .update({
        value: editingTag.value,
        value_type: editingTag.value_type,
        amount: editingTag.amount
      })
      .eq("tag_id", editingTag.id);
    
    if (error) return toast.error("Unable to update tag!");
    toast.success("Updated tag!");
    setShowEditTagModal(false);
    setEditingTag(null);
    fetchTags();
  };

  //Triggers tag modal
  const deleteTag = (tag: Tag) => {
    setTagToDelete(tag);
  };

  //Executes tag deletion
  const confirmDeleteTag = async () => {
    if (!tagToDelete) return;
    const tagId = tagToDelete.id;
    setTagToDelete(null); //Close modal

    const { error } = await supabase.from("tags").delete().eq("tag_id", tagId);
    if (error) {
      console.error(error);
      toast.error(`Unable to delete tag! ${error.message ?? ""}`);
      return;
    }
    toast.success("Deleted tag!");
    fetchTags();
  };

//Triggers room modal
const deleteRoom = (r: Room) => {
  setRoomToDelete(r);
};

//Executes room deletion
const confirmDeleteRoom = async () => {
  if (!roomToDelete) return;
  const id = roomToDelete.id;
  setRoomToDelete(null); //Close modal

  try {
    //1. Delete record from rooms table
    const { error: dbError } = await supabase.from("rooms").delete().eq("id", id);
    if (dbError) throw dbError;

    //2. Delete all related images via API route /api/room_img
    const formData = new FormData();
    formData.append("action", "delete-all");
    formData.append("idRoom", id);

    const res = await fetch("/api/room_img", {
      method: "DELETE",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete room images.");
    }

    toast.success("Room and all associated images deleted successfully!");
    fetchRooms();
    
  } catch (error) {
    console.error("Error deleting room:", error);
    toast.error(`Unable to delete room! ${error instanceof Error ? error.message : "An unknown error occurred."}`);
  }
};

  useEffect(() => {
    fetchRooms();
    fetchTags();
  }, [fetchRooms, fetchTags]);
  
  //Room tags with dash separator
  const getRoomTagKey = (tag: { value: string; amount: number }) => {
    return `${tag.value}-${tag.amount}`;
  };

  //Database tags with underscore and type
  const getTagKey = (tag: Tag) => {
    return `${tag.value_type}_${tag.value}_${tag.amount}`;
  };


  const filteredRooms = rooms
    .filter((r) => {
      const roomTitle = r.title ?? ""; 
      const landlordName = r.landlordName ?? "";
      const matchesSearch =
        (roomTitle?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
        (landlordName?.toLowerCase() ?? "").includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      const matchesTag = filterTag === "all" || r.tags.some(tag => getRoomTagKey(tag) === filterTag);
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
      {/* ADD TAG MODAL */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md sm:max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add New Tag</h3>
              <button onClick={() => setShowAddTagModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Tag Value</label>
                <input
                  type="text"
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., WiFi, Parking"
                  value={newTagData.value}
                  onChange={(e) => setNewTagData({ ...newTagData, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Type</label>
                <select
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100"
                  value={newTagData.value_type}
                  onChange={(e) => setNewTagData({ ...newTagData, value_type: e.target.value })}
                >
                  <option value="Amenities">Amenities</option>
                  <option value="Features">Features</option>
                  <option value="Services">Services</option>
                  <option value="Room Type">Room Type</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Amount (number of rooms)</label>
                <input
                  type="number"
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100"
                  min="0"
                  value={newTagData.amount}
                  onChange={(e) => setNewTagData({ ...newTagData, amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowAddTagModal(false)}
                className="px-4 py-2 border dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TAG MODAL */}
      {showEditTagModal && editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Tag</h3>
              <button onClick={() => { setShowEditTagModal(false); setEditingTag(null); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Tag Value</label>
                <input
                  type="text"
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., WiFi, Parking"
                  value={editingTag.value}
                  onChange={(e) => setEditingTag({ ...editingTag, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Type</label>
                <select
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100"
                  value={editingTag.value_type || "Amenities"}
                  onChange={(e) => setEditingTag({ ...editingTag, value_type: e.target.value })}
                >
                  <option value="Amenities">Amenities</option>
                  <option value="Features">Features</option>
                  <option value="Services">Services</option>
                  <option value="Room Type">Room Type</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Amount (number of rooms)</label>
                <input
                  type="number"
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100"
                  min="0"
                  value={editingTag.amount}
                  onChange={(e) => setEditingTag({ ...editingTag, amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setShowEditTagModal(false); setEditingTag(null); }}
                className="px-4 py-2 border dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateTag}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM MANAGEMENT */}
      <div>
        <h1 className="text-2xl font-bold mb-4">🏠 Room management</h1>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="🔍 Search by room title or landlord"
            className="border dark:border-gray-600 dark:bg-gray-800 p-2 rounded w-full sm:w-64 md:w-128"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border dark:border-gray-600 dark:bg-gray-800 p-2 rounded w-full sm:w-40"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
          <select
            className="border dark:border-gray-600 dark:bg-gray-800 p-2 rounded w-full sm:w-48"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All tags</option>
            {tags.map((t) => (
              <option key={getTagKey(t)} value={getTagKey(t)}>
                {t.value} ({t.amount})
              </option>
            ))}
          </select>
          <select
            className="border dark:border-gray-600 dark:bg-gray-800 p-2 rounded w-full sm:w-48"
            value={bookingSort || ""}
            onChange={(e) =>
              setBookingSort(e.target.value ? (e.target.value as "asc" | "desc") : null)
            }
          >
            <option value="">No arrangement</option>
            <option value="desc">Booking high → low</option>
            <option value="asc">Booking low → high</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <DataTable<Room>
            columns={[
              { 
                key: "id", 
                label: "ID",
                width: "w-[150px]",
                render: (row) => (
                  <HoverCard content={
                    <div className="text-gray-900 dark:text-gray-100">
                      <p><strong className="text-gray-900 dark:text-gray-100">Full ID:</strong> {row.id}</p>
                    </div>
                  }>
                    <span className="cursor-help" title={row.id}>
                      {row.id.substring(0, 12)}...
                    </span>
                  </HoverCard>
                )
              },
              {
                key: "title",
                label: "Room title",
                width: "min-w-[200px] sm:min-w-[350px]",
                render: (row) => (
                  <div className="text-left">
                    <HoverCard
                      content={
                        <div className="space-y-1 text-sm">
                          <p><strong>Title:</strong> {row.title}</p>
                          <p><strong>Status:</strong> {row.status}</p>
                          <p><strong>Tags:</strong> {row.tags.map(t => `${t.value} (${t.amount})`).join(", ") || "—"}</p>
                          <p><strong>Total bookings:</strong> {row.total_confirm_booking}</p>
                        </div>
                      }
                    >
                      <button
                        className="text-blue-600 hover:underline block w-full text-left"
                        onClick={() => router.push(`/pages/room/${row.id}`)}
                      >
                        {row.title}
                      </button>
                    </HoverCard>
                  </div>
                ),
              },
              {
                key: "landlordName",
                label: "Landlord",
                width: "w-[150px]",
                render: (row) => (
                  <div className="text-left">
                    <HoverCard
                      content={
                        <div className="space-y-1 text-gray-900 dark:text-gray-100">
                          <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {row.landlordName}</p>
                          {row.landlordEmail && <p><strong className="text-gray-900 dark:text-gray-100">Email:</strong> {row.landlordEmail}</p>}
                        </div>
                      }
                    >
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:underline block w-full text-left"
                        onClick={() => router.push(`/pages/user/${row.landlord_id}`)}
                      >
                        {row.landlordName}
                      </button>
                    </HoverCard>
                  </div>
                ),
              },
              { key: "status", label: "Status", width: "w-[100px]" },
              {
                key: "tags", 
                label: "Tags",
                width: "w-[180px]",
                render: (row) => {
                  if (!row.tags || row.tags.length === 0) {
                    return "—";
                  }
                  const firstTag = `${row.tags[0].value} (${row.tags[0].amount})`;
                  const allTagsText = row.tags.map(t => `${t.value} (${t.amount})`).join(", ");
                  
                  if (row.tags.length === 1) {
                    return firstTag;
                  }
                  
                  return (
                    <HoverCard content={
                      <div className="text-gray-900 dark:text-gray-100">
                        <p><strong className="text-gray-900 dark:text-gray-100">All Tags:</strong></p>
                        <p className="text-sm">{allTagsText}</p>
                      </div>
                    }>
                      <span className="cursor-help" title={allTagsText}>
                        {firstTag}, ...
                      </span>
                    </HoverCard>
                  );
                }
              },
              { key: "total_confirm_booking", label: "Total booking", width: "w-[130px]" },
            ]}
            data={filteredRooms}
            onDelete={deleteRoom}
          />
        </div>
      </div>

      {/* TAG MANAGEMENT */}
      <div>
        <h2 className="text-xl font-semibold mb-3">🏷️ Tag management</h2>
        <TagManager 
          tags={tags} 
          deleteTag={deleteTag}
          onEdit={(tag) => {
            setEditingTag(tag);
            setShowEditTagModal(true);
          }}
          onAddTag={() => setShowAddTagModal(true)}
        />
      </div>
      
      {/* NEW ROOM DELETION MODAL */}
      {roomToDelete && (
          <DeleteConfirmModal<Room>
            item={roomToDelete}
            itemKey="title"
            itemName="Room"
            onClose={() => setRoomToDelete(null)}
            onConfirm={confirmDeleteRoom}
            cleanupMessage="permanently delete all associated images"
          />
      )}

      {/* TAG DELETION MODAL */}
      {tagToDelete && (
          <DeleteConfirmModal<Tag>
            item={tagToDelete}
            itemKey="value"
            itemName="Tag"
            onClose={() => setTagToDelete(null)}
            onConfirm={confirmDeleteTag}
          />
      )}
    </div>
  );
}

function TagManager({
  tags,
  deleteTag,
  onEdit,
  onAddTag,
}: {
  tags: Tag[];
  deleteTag: (tag: Tag) => void; 
  onEdit: (tag: Tag) => void;
  onAddTag: () => void;
}) {
  const [searchTag, setSearchTag] = useState("");

  const filteredTags = tags.filter((t) =>
    (t.value?.toLowerCase() ?? "").includes(searchTag.toLowerCase()) ||
    (t.id?.toLowerCase() ?? "").includes(searchTag.toLowerCase()) ||
    (t.value_type?.toLowerCase() ?? "").includes(searchTag.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <input
          className="border dark:border-gray-600 dark:bg-gray-800 p-2 rounded w-full sm:w-72 md:w-140"
          placeholder="🔍 Search tag by value, type, or id"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
        />
        <button
          onClick={onAddTag}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      <DataTable
        columns={[
          { 
            key: "id", 
            label: "ID",
            render: (t: Tag) => (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Full ID:</strong> {t.id}</p>
                </div>
              }>
                <span className="cursor-help" title={t.id}>
                  {t.id.substring(0, 12)}...
                </span>
              </HoverCard>
            )
          },
          { key: "value", label: "Value" },
          { key: "value_type", label: "Type", width: "w-[50px]" },
          { key: "amount", label: "Amount", width: "w-[50px]" },
          { 
            key: undefined, 
            label: "Display Format",
            render: (t: Tag) => (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded text-sm">
                {t.value} ({t.amount})
              </span>
            )
          },
        ]}
        data={filteredTags}
        onDelete={(t) => deleteTag(t)} 
        onEdit={(t) => onEdit(t)}
      />
    </div>
  );
}