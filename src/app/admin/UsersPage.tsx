"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { DataTable } from "../../components/DataTable";
import { EditablePopup } from "../../components/Popup";
import { HoverCard } from "../../components/HoverCard";

type RoleType = "admin" | "tenant" | "landlord";
type StatusType = "normal" | "warning" | "locked";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  role: RoleType;
  status: StatusType;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");

  const router = useRouter();

  async function fetchUsers() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) toast.error("Lỗi tải người dùng");
    else {
      setUsers(data || []);
      setFiltered(data || []);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let list = [...users];
    if (search.trim()) {
      const lower = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          u.phone_number?.toLowerCase().includes(lower) ||
          u.id?.toLowerCase().includes(lower)
      );
    }
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all") list = list.filter((u) => u.status === statusFilter);

    setFiltered(list);
  }, [search, roleFilter, statusFilter, users]);

  async function handleSave(updated: User) {
    try {
      const { error } = await supabase.from("users").update(updated).eq("id", updated.id);
      if (error) throw error;
      toast.success("Update successful!");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Cannot save!");
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Are you sure you want to delete user: ${u.name ?? u.email}? This action is irreversible.`)) return;

    try {
      const { error: dbError } = await supabase.from("users").delete().eq("id", u.id);
      if (dbError) throw dbError;

      const formData = new FormData();
      formData.append("userId", u.id);

      const res = await fetch("/api/avatar", {
        method: "DELETE",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.warn("User deleted, but failed to delete avatar:", errorData.error);
      }

      toast.success("User and associated avatar deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Cannot be deleted! ${error instanceof Error ? error.message : "An unknown error occurred."}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">👥 Users management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Search by name, email, phone or id"
          className="border dark:border-gray-700 p-2 rounded w-full sm:w-96 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full sm:w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleType | "all")}
        >
          <option value="all">All role</option>
          <option value="admin">Admin</option>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
        </select>
        <select
          className="border dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full sm:w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusType | "all")}
        >
          <option value="all">All Status</option>
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DataTable<User>
          columns={[
            {
              key: "id",
              label: "ID",
              render: (row) => (
                <HoverCard
                  content={
                    <div className="text-gray-900 dark:text-gray-100">
                      <p>
                        <strong className="text-gray-900 dark:text-gray-100">Full ID:</strong> {row.id}
                      </p>
                    </div>
                  }
                >
                  <span className="cursor-help" title={row.id}>
                    {row.id.substring(0, 12)}...
                  </span>
                </HoverCard>
              ),
            },
            {
              key: "name",
              label: "Name",
              render: (row) => (
                <HoverCard
                  content={
                    <div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
                      <p>
                        <strong>Email:</strong> {row.email}
                      </p>
                      {row.phone_number && (
                        <p>
                          <strong>Phone:</strong> {row.phone_number}
                        </p>
                      )}
                      <p>
                        <strong>Role:</strong> {row.role}
                      </p>
                      <p>
                        <strong>Status:</strong> {row.status}
                      </p>
                      <p>
                        <strong>Created:</strong> {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                  }
                >
                  <button
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    onClick={() => router.push(`/pages/user/${row.id}`)}
                  >
                    {row.name ?? "—"}
                  </button>
                </HoverCard>
              ),
            },
            { key: "email", label: "Email", render: (row) => <span className="min-w-[180px] block truncate">{row.email}</span> },
            { key: "phone_number", label: "Phone", render: (row) => <span className="min-w-[120px] block truncate">{row.phone_number}</span> },
            { key: "role", label: "Role", render: (row) => <span className="capitalize">{row.role}</span> },
            { key: "status", label: "Status", render: (row) => <span className="capitalize">{row.status}</span> },
            {
              key: undefined,
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEditingUser(row)}
                    className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-all duration-150 font-semibold"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition-all duration-150 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              )
            },
          ]}
          data={filtered}
        />
      </div>

      {/* Editable Popup */}
      {editingUser && (
        <EditablePopup
          open={!!editingUser}
          title="Adjust"
          data={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
          fields={[
            { key: "id", label: "id" },
            { key: "name", label: "name" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone_number", label: "Phone" },
            { key: "role", label: "role", type: "select", options: ["admin", "tenant", "landlord"] },
            { key: "status", label: "status", type: "select", options: ["normal", "warning", "locked"] },
          ]}
        />
      )}
    </div>
  );
}
