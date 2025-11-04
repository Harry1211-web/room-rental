"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import Image from "next/image";
import { EditablePopup } from "@/components/Popup";
import { ImagePreviewModal } from "../../components/PreviewImageModal";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { HoverCard } from "../../components/HoverCard";
import { useRouter } from "next/navigation";

interface Verification {
  id: string;
  landlord_id: string | null;
  type?: string | null;
  proof?: string | null;
  verified: boolean | null;
  created_at: string;
  users?: {
    name: string | null;
    email?: string | null;
  };
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending">("all");
  const statusOptions = ["all", "approved", "pending"] as const;
  const [editingVerification, setEditingVerification] = useState<Verification | null>(null);
  
  const router = useRouter();
  
  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("verifications")
      .select("*, users(name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Unable to load verification list!");
      return;
    }

    setVerifications(data || []);
  }, []);

  // Update status quickly
  const updateStatus = async (id: string, current: boolean | null) => {
    const newStatus = !current;
    try {
      const { error } = await supabase
        .from("verifications")
        .update({ verified: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(newStatus ? "Approved!" : "Refused!");
      fetchVerifications();
    } catch (err) {
      console.error(err);
      toast.error("Update failed!");
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Filter + search
  const filteredData = verifications.filter((v) => {
    const matchesSearch =
      v.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.landlord_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "approved"
        ? v.verified === true
        : v.verified !== true;

    return matchesSearch && matchesStatus;
  });

  // Edit and Delete
  async function handleSave(v: Verification) {
    try {
      const { error } = await supabase
        .from("verifications")
        .update({
          type: v.type,
          proof: v.proof,
          verified: v.verified,
        })
        .eq("id", v.id);
      if (error) throw error;
      toast.success("Update successful!");
      fetchVerifications();
    } catch {
      toast.error("Cannot save!");
    }
  }

  async function handleDelete(v: Verification) {
    if (!confirm(`Delete verification ${v.id} of ${v.landlord_id}?`)) return;
    const { error } = await supabase.from("verifications").delete().eq("id", v.id);
    if (error) toast.error("Cannot be deleted!");
    else {
      toast.success("Deleted!");
      fetchVerifications();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✅ Verifications</h1>

      {/* 🔍 Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search landlord name, email, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded shadow-sm w-128"
        />
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as (typeof statusOptions)[number])
          }
          className="border px-3 py-2 rounded shadow-sm"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all"
                ? "All"
                : opt === "approved"
                ? "Approved"
                : "Refused"}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable<Verification>
        columns={[
          { key: "landlord_id", label: "Landlord ID" },
          {
            key: "users",
            label: "Landlord",
            render: (r) =>
              r.users?.name || r.users?.email ? (
                <HoverCard
                  content={
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {r.users?.name ?? "N/A"}</p>
                      <p><strong>Email:</strong> {r.users?.email ?? "N/A"}</p>
                      <p><strong>ID:</strong> {r.landlord_id}</p>
                    </div>
                  }
                >
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => router.push(`pages/user/${r.landlord_id}`)}
                  >
                    {r.users?.name ?? r.users?.email ?? "No name"}
                  </button>
                </HoverCard>
              ) : "—",
          },
          { key: "type", label: "Type of verification" },
          {
            key: "proof",
            label: "Proof picture",
            render: (r) =>
              r.proof ? (
                <button onClick={() => setPreviewImage(r.proof ?? null)}>
                  <Image
                    src={r.proof}
                    alt="Proof"
                    width={96}
                    height={96}
                    className="object-cover rounded cursor-pointer shadow-sm hover:opacity-90 transition"
                  />
                </button>
              ) : "—",
          },
          {
            key: "created_at",
            label: "Date sent",
            render: (r) => new Date(r.created_at).toLocaleDateString(),
          },
          {
            key: "verified",
            label: "Status",
            render: (r) => (
              <button
                onClick={() => updateStatus(r.id, r.verified)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-all duration-200 shadow-sm ${
                  r.verified
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {r.verified ? "✅ Approved" : "❌ Refused"}
              </button>
            ),
          },
        ]}
        data={filteredData}
        renderActions={(row) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setEditingVerification(row)}
              className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-1 rounded-full shadow-sm transition"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium px-3 py-1 rounded-full shadow-sm transition"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
        rowKey="id"
      />

      {/* Edit Popup */}
      {editingVerification && (
        <EditablePopup
          open={!!editingVerification}
          title="Adjust Verification"
          data={editingVerification}
          onClose={() => setEditingVerification(null)}
          onSave={handleSave}
          fields={[
            { key: "id", label: "ID", readOnly: true },
            { key: "landlord_id", label: "Landlord ID", readOnly: true },
            { key: "type", label: "Type" },
            {
              key: "verified",
              label: "Status",
              type: "select",
              options: [
                { label: "Approved", value: true },
                { label: "Refused", value: false },
              ],
            },
          ]}
        />
      )}

      {/* Image Preview */}
      <ImagePreviewModal
        src={previewImage}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
