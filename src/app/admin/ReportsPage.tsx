"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "../../components/DataTable";
import { toast } from "sonner";
import { EditablePopup } from "@/components/Popup";
import { ImagePreviewModal } from "../../components/PreviewImageModal";
import { HoverCard } from "../../components/HoverCard";

interface Report {
  id: string;
  reporter_id: string | null;
  targeted_user_id: string | null;
  room_id: string | null;
  created_at: string;
  reason: string | null;
  status: string | null;
  proof: string | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [usersMap, setUsersMap] = useState<Map<string, { name?: string | null; email?: string | null }>>(new Map());
  const [roomsMap, setRoomsMap] = useState<Map<string, { name?: string | null }>>(new Map());

  const router = useRouter();

  const formatDate = (isoDate?: string | null) => {
    if (!isoDate) return "00/00/0000";
    const parsedDate = new Date(isoDate);
    if (Number.isNaN(parsedDate.getTime())) return "00/00/0000";
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const reportsData = data as Report[];
      setReports(reportsData);

      // Pre-fetch related users and rooms for hover cards
      const userIds = Array.from(new Set(reportsData.flatMap(r => [r.reporter_id, r.targeted_user_id]).filter(Boolean))) as string[];
      const roomIds = Array.from(new Set(reportsData.map(r => r.room_id).filter(Boolean))) as string[];

      if (userIds.length) {
        const { data: users, error: usersError } = await supabase.from("users").select("id, name, email").in("id", userIds);
        if (usersError) throw usersError;
        setUsersMap(new Map((users ?? []).map(u => [u.id, { name: u.name, email: u.email }])));
      }

      if (roomIds.length) {
        const { data: rooms, error: roomsError } = await supabase.from("rooms").select("id, title").in("id", roomIds);
        if (roomsError) throw roomsError;
        setRoomsMap(new Map((rooms ?? []).map(r => [r.id, { name: r.title }])));
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load report list!");
    }
  }

  async function handleSave(report: Report) {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: report.status })
        .eq("id", report.id);
      if (error) throw error;
      toast.success("Report updated!");
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save report.");
    } finally {
      setEditingReport(null);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => r.id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">🧾 Reports Management</h1>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search report by ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 w-64 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <DataTable<Report>
        columns={[
          {
            key: "reporter_id",
            label: "Reporter",
            width: "w-[120px]",
            render: r => r.reporter_id ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {usersMap.get(r.reporter_id)?.name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Email:</strong> {usersMap.get(r.reporter_id)?.email ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">ID:</strong> {r.reporter_id}</p>
                </div>
              }>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                  onClick={() => router.push(`pages/user/${r.reporter_id}`)}
                >
                  {usersMap.get(r.reporter_id)?.name ?? r.reporter_id}
                </button>
              </HoverCard>
            ) : "—",
          },
          {
            key: "targeted_user_id",
            label: "Targeted User",
            width: "w-[120px]",
            render: r => r.targeted_user_id ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {usersMap.get(r.targeted_user_id)?.name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Email:</strong> {usersMap.get(r.targeted_user_id)?.email ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">ID:</strong> {r.targeted_user_id}</p>
                </div>
              }>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                  onClick={() => router.push(`pages/user/${r.targeted_user_id}`)}
                >
                  {usersMap.get(r.targeted_user_id)?.name ?? r.targeted_user_id}
                </button>
              </HoverCard>
            ) : "—",
          },
          {
            key: "room_id",
            label: "Room",
            width: "min-w-[220px]",
            render: r => r.room_id ? (
              <HoverCard content={
                <div className="text-gray-900 dark:text-gray-100">
                  <p><strong className="text-gray-900 dark:text-gray-100">Room:</strong> {roomsMap.get(r.room_id)?.name ?? "N/A"}</p>
                  <p><strong className="text-gray-900 dark:text-gray-100">Room ID:</strong> {r.room_id}</p>
                </div>
              }>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                  onClick={() => router.push(`pages/room/${r.room_id}`)}
                >
                  {roomsMap.get(r.room_id)?.name ?? r.room_id}
                </button>
              </HoverCard>
            ) : "—",
          },
          { key: "reason", label: "Reason", width: "w-[18 0px]" },
          {
            key: "status",
            label: "Status",
            width: "w-[150px]",
            render: (r: Report) => {
              const value = r.status;
              switch (value) {
                case "reviewed":
                  return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium text-sm">✅ Reviewed</span>;
                case "rejected":
                  return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-medium text-sm">❌ Rejected</span>;
                default:
                  return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium text-sm">🟡 Pending</span>;
              }
            },
          },
          { key: "created_at", label: "Date Sent", width: "w-[120px]", render: r => formatDate(r.created_at) },
          {
            key: "proof",
            label: "Proof Picture",
            width: "w-[120px]",
            render: r => r.proof ? (
              <button onClick={() => setPreviewImage(r.proof ?? null)} className="p-1 border dark:border-gray-700 rounded-lg hover:shadow-md transition">
                <img src={r.proof} alt="Proof" className="w-20 h-20 object-cover rounded" />
              </button>
            ) : "—",
          },
          {
            key: undefined,
            label: "Actions",
            width: "w-[100px]",
            render: r => (
              <button
                onClick={() => setEditingReport(r)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:shadow-lg transition"
              >
                Edit
              </button>
            ),
          },
        ]}
        data={filteredReports}
        rowsPerPage={10}
        rowKey="id"
      />

      {editingReport && (
        <EditablePopup
          open={!!editingReport}
          title="Adjust Report"
          data={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleSave}
          fields={[
            { key: "id", label: "Report ID", readOnly: true },
            { key: "reporter_id", label: "Reporter ID", readOnly: true },
            { key: "targeted_user_id", label: "Targeted User ID", readOnly: true },
            { key: "room_id", label: "Room ID", readOnly: true },
            { key: "reason", label: "Reason", readOnly: true },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: [
                { key: "pending", label: "🟡 Pending", value: "pending" },
                { key: "reviewed", label: "✅ Reviewed", value: "reviewed" },
                { key: "rejected", label: "❌ Rejected", value: "rejected" },
              ],
            },
          ]}
        />
      )}

      <ImagePreviewModal src={previewImage} isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
