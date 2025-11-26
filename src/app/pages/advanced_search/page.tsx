"use client";
// @ts-expect-error

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RoomCard from "@/components/RoomCard";
import { Loader } from "@/components/Loader";

interface RoomWithExtras {
  id: string;
  title: string;
  city: string;
  price: number;
  area?: number;
  average_rating?: number;
  total_confirm_booking?: number;
  tags: string[];
  images: string[];
}

//Move the main logic to a separate component that uses useSearchParams
function AdvancedSearchContent() {
  const searchParams = useSearchParams();

  const [rooms, setRooms] = useState<RoomWithExtras[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = {
    checkinDate: searchParams.get("checkinDate") || "",
    checkoutDate: searchParams.get("checkoutDate") || "",
    checkinTime: searchParams.get("checkinTime") || "00:00",
    checkoutTime: searchParams.get("checkoutTime") || "23:59",
    city: searchParams.get("city") || "",
    areaMin: searchParams.get("areaMin") || "",
    areaMax: searchParams.get("areaMax") || "",
    tags: searchParams.getAll("tags"),
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    search: searchParams.get("search") || "",
  };

  const startTime = filters.checkinDate
    ? new Date(`${filters.checkinDate}T${filters.checkinTime}`)
    : null;
  const endTime = filters.checkoutDate
    ? new Date(`${filters.checkoutDate}T${filters.checkoutTime}`)
    : null;

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);

      //1. Lấy tất cả phòng theo city/area/price/search
      let query = supabase
        .from("rooms")
        .select(`
          id, title, city, price, area, average_rating, total_confirm_booking,
          rooms_tags(
            tag_id,
            tags:tags(name)
          ),
          room_images(img_url)
        `);

      //Apply text search if search term exists
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      if (filters.city) query = query.eq("city", filters.city);
      
      //Fix area filtering - use areaMin and areaMax
      if (filters.areaMin) query = query.gte("area", Number(filters.areaMin));
      if (filters.areaMax) query = query.lte("area", Number(filters.areaMax));
      
      if (filters.priceMin) query = query.gte("price", Number(filters.priceMin));
      if (filters.priceMax) query = query.lte("price", Number(filters.priceMax));

      const { data: roomsData, error: roomsError } = await query;

      if (roomsError || !roomsData) {
        console.error(roomsError);
        setRooms([]);
        setLoading(false);
        return;
      }

      //2. Lấy danh sách booking trùng khoảng thời gian
      let bookedRoomIds: string[] = [];
      if (startTime && endTime) {
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("room_id")
          .or(
            `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`
          )
          .eq("status", "confirmed"); //chỉ xét booking confirmed

        if (bookingError) console.error(bookingError);
        else bookedRoomIds = bookingData?.map((b) => b.room_id) || [];
      }

      //3. Format room và loại bỏ các phòng trùng booking
      const formattedRooms: RoomWithExtras[] = (roomsData || [])
        .filter((r: any) => !bookedRoomIds.includes(r.id))
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          city: r.city,
          price: r.price,
          area: r.area,
          average_rating: r.average_rating,
          total_confirm_booking: r.total_confirm_booking,
          tags: r.rooms_tags?.map((t: any) => t.tags.name) || [],
          images: r.room_images?.map((img: any) => img.img_url) || [],
        }));

      //4. Filter theo tags nếu có
      const filteredByTags = filters.tags.length
        ? formattedRooms.filter((room) =>
            filters.tags.every((t) => room.tags.includes(t))
          )
        : formattedRooms;

      setRooms(filteredByTags);
      setLoading(false);
    };

    fetchRooms();
  }, [
    filters.city,
    filters.areaMin,
    filters.areaMax,
    filters.priceMin,
    filters.priceMax,
    filters.tags.join(","),
    filters.checkinDate,
    filters.checkoutDate,
    filters.checkinTime,
    filters.checkoutTime,
    filters.search,
  ]);

  //Display search term in the header
  const displaySearchInfo = () => {
    const infoParts = [];
    if (filters.search) infoParts.push(`"${filters.search}"`);
    if (filters.city) infoParts.push(`in ${filters.city}`);
    if (filters.tags.length > 0) infoParts.push(`with tags: ${filters.tags.join(", ")}`);
    
    return infoParts.length > 0 ? ` for ${infoParts.join(" ")}` : "";
  };

  return (
    <div className="p-6 pt-24 min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Search Results{displaySearchInfo()}
      </h1>
      
      {/* Show applied filters */}
      <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {filters.checkinDate && filters.checkoutDate && (
          <p>Check-in: {filters.checkinDate} {filters.checkinTime} → Checkout: {filters.checkoutDate} {filters.checkoutTime}</p>
        )}
        {(filters.priceMin || filters.priceMax) && (
          <p>Price: {filters.priceMin && `$${filters.priceMin}`} {filters.priceMin && filters.priceMax && '-'} {filters.priceMax && `$${filters.priceMax}`}</p>
        )}
        {(filters.areaMin || filters.areaMax) && (
          <p>Area: {filters.areaMin && `${filters.areaMin}m²`} {filters.areaMin && filters.areaMax && '-'} {filters.areaMax && `${filters.areaMax}m²`}</p>
        )}
      </div>

      {/* Show loader while loading */}
      {loading ? (
        <Loader message="Loading rooms..." />
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
            No rooms found matching your criteria.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              title={room.title}
              city={room.city}
              price={room.price}
              area={room.area}
              avg_rating={room.average_rating}
              totalbooking={room.total_confirm_booking}
              tags={room.tags}
              images={room.images}
            />
          ))}
        </div>
      )}
    </div>
  );
}

//Main component that wraps with Suspense
export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={<Loader message="Loading search..." />}>
      <AdvancedSearchContent />
    </Suspense>
  );
}