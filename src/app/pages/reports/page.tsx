"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import Image from "next/image";

interface Report {
  id: string;
  created_at: string;
  reason: string;
  status: string;
  proof?: string | null;
  rooms?: {
    title: string;
    address: string;
    city: string;
  }[];
  targeted_user?: {
    name: string;
  }[];
}

export default function ReportHistory() {
  const { idUser, setLoading } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading1] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const limit = 5;
  const offsetRef = useRef(0);

  const fetchReports = async (reset = false) => {
    if (!idUser) return;

    if (reset) {
      setReports([]);
      offsetRef.current = 0;
      setHasMore(true);
    }

    const query = supabase
      .from("reports")
      .select(
        `
        id, created_at, reason, status, proof,
        rooms(title, address, city),
        targeted_user:targeted_user_id(name)
      `
      )
      .eq("reporter_id", idUser)
      .order("created_at", { ascending: false })
      .range(offsetRef.current, offsetRef.current + limit - 1);

    if (statusFilter !== "all") query.eq("status", statusFilter);

    if (offsetRef.current === 0) setLoading1(true);
    else setLoadingMore(true);

    const { data, error } = await query;

    if (error) console.error("Error fetching reports:", error);
    else {
      if (data.length < limit) setHasMore(false);
      
      //Transform the data to match the Report interface
      setReports((prev) => {
        const newData = data.map(item => ({
          ...item,
          //Keep as arrays since that's what Supabase returns
          rooms: item.rooms || [],
          targeted_user: item.targeted_user || []
        }));
        return reset ? newData : [...prev, ...newData];
      });
      
      offsetRef.current += data.length;
    }

    setLoading1(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (idUser) fetchReports(true);
  }, [idUser, statusFilter]);

  useEffect(() => {
    if(loading) setLoading(false)
  }, [loading, setLoading]);

  //Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loadingMore &&
        hasMore
      ) {
        fetchReports(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore]);

  return (
    <div className="max-w-3xl mx-auto p-4 pt-32 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        Reports You Submitted
      </h1>

      {/* Filter dropdown */}
      <div
        className="flex justify-end mb-4 sticky top-24 
                    bg-white/80 dark:bg-gray-900/60 
                      backdrop-blur-sm p-2 rounded-lg shadow-sm"
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100
          rounded-lg px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* If loading */}
      {loading ? (
        <p className="text-center mt-10 text-gray-500">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-600">
          <h2 className="text-xl font-semibold mb-2">No reports found</h2>
          <p>You haven&apos;t submitted any reports yet.</p>
        </div>
      ) : (
        <>
          {reports.map((r) => (
            <div
              key={r.id}
              className="border rounded-2xl shadow-md bg-white overflow-hidden hover:shadow-lg transition"
            >
              {/* Proof image (optional) */}
              {r.proof ? (
                <div
                  className="relative cursor-pointer"
                  onClick={() => setSelectedImage(r.proof!)}
                >
                  <Image
                    unoptimized
                    src={r.proof}
                    alt="Proof"
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover border-b"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Click to view
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-500 italic border-b">
                  No proof image provided
                </div>
              )}

              <div className="p-4 space-y-2">
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(r.created_at).toLocaleString()}
                </p>

                {/*Access array data properly */}
                {r.rooms && r.rooms.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold dark:text-gray-700">
                      {r.rooms[0].title}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-700">
                      {r.rooms[0].address}, {r.rooms[0].city}
                    </p>
                  </div>
                )}

                {/*Access array data properly */}
                {r.targeted_user && r.targeted_user.length > 0 && (
                  <p className="dark:text-gray-700">
                    <strong>Targeted user:</strong> {r.targeted_user[0].name}
                  </p>
                )}

                <p className="dark:text-gray-700">
                  <strong>Reason:</strong> {r.reason || "No reason provided"}
                </p>

                <div>
                  <strong className="dark:text-gray-700">Status:</strong>{" "}
                  <span
                    className={`${
                      r.status === "resolved"
                        ? "text-green-600"
                        : r.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    } font-medium`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {loadingMore && (
            <p className="text-center text-gray-500 mb-6">Loading more...</p>
          )}
        </>
      )}

      {/* Proof modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <Image
            src={selectedImage}
            alt="Proof Full"
            width={900}
            height={600}
            className="max-h-[80vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
