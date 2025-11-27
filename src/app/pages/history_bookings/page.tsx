"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  rooms: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    price: number;
    area: string;
    landlord_id?: string;
    room_images: { img_url: string }[];
  };
}

interface Landlord {
  name: string;
  email?: string;
  phone_number?: string;
}

export default function BookingHistory() {
  const { idUser, setLoading } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [loading, setLoading1] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 5;
  const route = useRouter();
  // Load bookings in pages of 5
  const fetchBookings = async (loadMore = false) => {
    if (!idUser) return;

    const start = offset;
    const end = offset + LIMIT - 1;

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id, start_time, end_time, status,
        rooms(
          id, title, description, address, city, price, area, landlord_id,
          room_images(img_url)
        )
      `
      )
      .eq("tenant_id", idUser)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error(error);
      return;
    }

    if (data.length < LIMIT) setHasMore(false);

    setBookings((prev) => (loadMore ? [...prev, ...(data as unknown as Booking[])] : (data as unknown as Booking[])));
    setLoading1(false);
  };

  // Initial fetch
  useEffect(() => {
    if (idUser) fetchBookings(false);
  }, [idUser]);

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasMore &&
        !loading
      ) {
        setLoading1(true);
        setOffset((prev) => prev + LIMIT);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  // Load more when offset changes
  useEffect(() => {
    if (offset > 0) fetchBookings(true);
  }, [offset]);

  const handleShowLandlord = async (landlord_id: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("name, email, phone_number")
      .eq("id", landlord_id)
      .single();

    if (error) console.error("Error fetching landlord:", error);
    else setLandlord(data);
  };
  useEffect(() => {setLoading(false)})

  if (loading && bookings.length === 0)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 pt-32">
      <h1 className="text-2xl font-bold text-center mb-4">Booking History</h1>

      {/* <-- Grid must wrap the mapped cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="border rounded-2xl shadow-md overflow-hidden bg-white hover:shadow-lg transition cursor-pointer flex flex-col h-full"
            onClick={() => route.push(`/pages/room/${b.rooms.id}`)}
          >
            {/* image container with fixed height */}
            <div className="w-full h-48 relative">
              <Image
                src={b.rooms?.room_images?.[0]?.img_url || "/no-image.jpg"}
                alt={b.rooms?.title || "Room"}
                width={800}
                height={400}
                className="w-full h-48 object-cover"
              />
            </div>

            <div className="p-4 space-y-2 dark:text-gray-700 flex-1">
              <h2 className="text-xl font-semibold">{b.rooms?.title}</h2>
              {b.rooms?.description && (
                <p className="text-gray-700 italic">{b.rooms.description}</p>
              )}

              <p><strong>Address:</strong> {b.rooms?.address || "Not available"}</p>
              <p><strong>City:</strong> {b.rooms?.city || "Not available"}</p>
              <p><strong>Area:</strong> {b.rooms?.area || "Unknown"}</p>
              <p>
                <strong>Price:</strong>{" "}
                {b.rooms?.price ? "$" + b.rooms.price.toLocaleString("en-US") + " / month" : "Unknown"}
              </p>

              <hr className="my-2" />

              <p><strong>Start:</strong> {new Date(b.start_time).toLocaleString("en-US")}</p>
              <p><strong>End:</strong> {new Date(b.end_time).toLocaleString("en-US")}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`${
                    b.status === "confirmed"
                      ? "text-green-600"
                      : b.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  } font-medium`}
                >
                  {b.status}
                </span>
              </p>

              {b.status === "approved" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click when clicking the button
                    handleShowLandlord(b.rooms.landlord_id as string);
                  }}
                  className="mt-3"
                >
                  View Landlord Info
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-center mt-4">Loading more...</p>}
      {!hasMore && (
        <p className="text-center text-gray-500 dark:text-gray-300 mt-4">No more bookings.</p>
      )}

      {/* Landlord modal */}
      {landlord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center animate-fadeIn">
            <h3 className="text-xl font-bold mb-3">Landlord Information</h3>
            <p>
              <strong>Name:</strong> {landlord.name}
            </p>
            <p>
              <strong>Email:</strong> {landlord.email || "Not available"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {landlord.phone_number || "Not available"}
            </p>
            <Button onClick={() => setLandlord(null)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
