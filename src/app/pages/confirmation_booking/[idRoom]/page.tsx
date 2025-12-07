"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookingByDay from "./BookByDate";
import BookingByHour from "./BookByHour";

export default function ConfirmationBooking() {
  const { idRoom } = useParams();
  const [room, setRoom] = useState<any>(null); 
  const [bookings, setBookings] = useState<any[]>([]);
  const [mode, setMode] = useState<"day" | "hour">("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: roomData } = await supabase
        .from("rooms")
        .select("*, room_images(img_url)")
        .eq("id", idRoom)
        .single();

      const { data: bookingData } = await supabase
        .from("room_booked_times")
        .select("*")
        .eq("room_id", idRoom);

      setRoom(roomData);
      setBookings(bookingData || []);
      setLoading(false);
    };

    load();
  }, [idRoom]);

  if (loading || !room) return <div>Loading...</div>;

  // Get the first image URL
  const roomImageUrl = room.room_images?.[0]?.img_url;

  return (
    <div className="max-w-5xl mx-auto p-6 pt-32">
      {roomImageUrl && (
        <div className="mb-6 w-full h-64 relative">
          <Image
            src={roomImageUrl || "/room-img-default.png"}
            alt={room.name || "Room image"}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Booking Confirmation</h1>

      <Tabs value={mode} onValueChange={(value) => setMode(value as "day" | "hour")}>
        <TabsList>
          <TabsTrigger value="day">Rent by Day</TabsTrigger>
          <TabsTrigger value="hour">Rent by Hour</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <BookingByDay room={room} bookings={bookings} />
        </TabsContent>

        <TabsContent value="hour">
          <BookingByHour room={room} bookings={bookings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
