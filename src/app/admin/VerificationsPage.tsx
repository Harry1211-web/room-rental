"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import Image from "next/image";
import { EditablePopup } from "@/components/Popup";
import { ImagePreviewModal } from "../../components/PreviewImageModal";
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
      // Convert verified string to boolean if needed
      const verifiedValue = typeof v.verified === "string" 
        ? v.verified === "true" 
        : v.verified;
      
      const { error } = await supabase
        .from("verifications")
        .update({
          type: v.type,
          proof: v.proof,
          verified: verifiedValue,
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
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">✅ Verifications</h1>

      {/* 🔍 Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search landlord name, email, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border dark:border-gray-700 px-3 py-2 rounded shadow-sm w-full sm:w-96 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as (typeof statusOptions)[number])
          }
          className="border dark:border-gray-700 px-3 py-2 rounded shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
          { 
            key: "landlord_id", 
            label: "Landlord ID",
            render: (r) => r.landlord_id ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Full ID:</strong> {r.landlord_id}</p>
                </div>
              }>
                <span className="cursor-help" title={r.landlord_id}>
                  {r.landlord_id.substring(0, 12)}...
                </span>
              </HoverCard>
            ) : "—"
          },
          {
            key: "users",
            label: "Landlord",
            render: (r) =>
              r.users?.name || r.users?.email ? (
                <HoverCard
                  content={
                    <div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
                      <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {r.users?.name ?? "N/A"}</p>
                      <p><strong className="text-gray-900 dark:text-gray-100">Email:</strong> {r.users?.email ?? "N/A"}</p>
                      <p><strong className="text-gray-900 dark:text-gray-100">ID:</strong> {r.landlord_id}</p>
                    </div>
                  }
                >
                  <button
                    className="text-blue-600 dark:text-blue-400 hover:underline"
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
            width: "w-[100px]",
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
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                    : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                }`}
              >
                {r.verified ? "✅ Approved" : "❌ Refused"}
              </button>
            ),
          },
        ]}
        data={filteredData}
        onEdit={(row) => setEditingVerification(row)}
        onDelete={handleDelete}
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
                { key: "approved", label: "Approved", value: "true" },
                { key: "refused", label: "Refused", value: "false" },
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
