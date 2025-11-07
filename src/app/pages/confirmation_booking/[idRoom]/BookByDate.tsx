"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import TimePicker from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import {
  differenceInMinutes,
  format,
  isBefore,
  isSameDay,
  startOfToday,
} from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BookingByDay({ room, bookings }: any) {
  const { idUser } = useUser();
  const pricePerDay = room.price;
  const pricePerHour = Math.ceil(pricePerDay / 24);
  const { setLoading } = useUser();

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [extraHours, setExtraHours] = useState(0);

  const route = useRouter();
  // Convert bookings to Date objects
  const bookedSlots = bookings.map((b: any) => ({
    start: new Date(b.start_time),
    end: new Date(b.end_time),
  }));

  // Check if a day is fully booked
  const isDayFullyBooked = (date: Date) =>
    bookedSlots.some(
      (slot) => isSameDay(slot.start, date) || isSameDay(slot.end, date)
    );


  // Reset checkout when checkin changes
  useEffect(() => {
    if (!checkin) {
      setCheckout(null);
      setExtraHours(0);
      return;
    }
    const co = new Date(checkin);
    co.setDate(co.getDate() + 1);
    setCheckout(co);
    setExtraHours(0);
  }, [checkin]);

  const isExtraHoursAvailable = () => {
    if (!checkout) return false;

    const newCheckout = new Date(checkout);
    newCheckout.setHours(newCheckout.getHours() + 1);

    return !bookedSlots.some(
      (slot) => newCheckout > slot.start && checkout < slot.end
    );
  };

  // Total hours of stay
  const totalHours = (() => {
    if (!checkin || !checkout) return 0;

    let diffMinutes = differenceInMinutes(checkout, checkin);
    let hours = diffMinutes / 60;

    if (Math.round(hours) === 24) hours -= 1;

    hours += extraHours;
    return hours;
  })();

  const totalPrice = totalHours * pricePerHour;

  const handleExtraHoursChange = (newTime: Date) => {
    if (!checkin) return;
    const baseCheckout = new Date(checkin.getTime() + 24 * 60 * 60 * 1000);
    const diff = differenceInMinutes(newTime, baseCheckout);
    if (diff >= 0) {
      setExtraHours(Math.ceil(diff / 60));
    }
  };

  const handleBook = async () => {
    if (!checkin || !checkout) return;
    setLoading(true);
    const checkoutWithExtra = new Date(checkout);
    checkoutWithExtra.setHours(checkoutWithExtra.getHours() + extraHours);

    const { data, error } = await supabase.from("bookings").insert({
      room_id: room.id,
      tenant_id: idUser,
      start_time: checkin.toISOString(),
      end_time: checkoutWithExtra.toISOString(),
      total_price: totalPrice,
      status: "pending",
    });
    setLoading(false);
    if (error) return alert("Booking failed");
    toast.success("Booking successful!");
    route.push(`pages/history_booking`);
  };

  const isBookingConflict = () => {
    if (!checkin || !checkout) return false;

    return bookedSlots.some((slot) => {
      const start = slot.start || new Date(0); // nếu start null → coi là từ quá khứ
      const end = slot.end || new Date(8640000000000000); // nếu end null → coi là vô hạn
      // Kiểm tra overlap
      return checkin < end && checkout > start;
    });
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Select dates */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">Select check-in date</p>
          <Calendar
            mode="single"
            selected={checkin}
            onSelect={(date) => {
              if (isBefore(date, startOfToday())) return;
              setCheckin(date);
            }}
            dayClassName={(date) => {
              if (isBefore(date, startOfToday()))
                return "opacity-40 cursor-not-allowed";
              if (
                bookedSlots.some(
                  (slot) =>
                    isSameDay(slot.start, date) || isSameDay(slot.end, date)
                )
              )
                return "bg-red-200 text-red-700";
              return "";
            }}
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium mb-2">Select check-out date</p>
          <Calendar
            mode="single"
            selected={checkout}
            onSelect={(date: Date) => {
              if (checkin && isBefore(date, checkin)) return;
              setCheckout(date);
            }}
            month={checkin || undefined} // show month of check-in
            disabledDate={(date) =>
              isDayFullyBooked(date) || (checkin && isBefore(date, checkin))
            }
          />
        </div>
      </div>

      {/* Select times */}
      <div className="flex gap-4 mt-2">
        <TimePicker
          label="Check-in time"
          value={checkin}
          onChange={setCheckin}
          minTime={
            checkin && isSameDay(checkin, new Date()) ? new Date() : undefined
          }
          bookedSlots={bookedSlots}
          disable={!checkin}
        />

        <TimePicker
          label="Check-out time"
          value={checkout}
          onChange={handleExtraHoursChange}
          minTime={
            checkin
              ? new Date(checkin.getTime() + 24 * 60 * 60 * 1000)
              : undefined
          }
          bookedSlots={bookedSlots}
          disable={!checkin}
        />
      </div>

      <p>(Extra 1-hour price: {pricePerHour}₫)</p>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          onClick={() => setExtraHours((prev) => prev + 1)}
          disabled={!checkout || !isExtraHoursAvailable()}
        >
          Late checkout +1h
        </Button>

        <Button
          variant="outline"
          onClick={() => setExtraHours((prev) => Math.max(prev - 1, 0))}
          disabled={!checkout || extraHours === 0}
        >
          Early checkout -1h
        </Button>
      </div>

      {isBookingConflict() && (
        <p className="mt-2 text-red-600 font-semibold">
          ⚠ Selected check-in/check-out overlaps with an existing booking!
        </p>
      )}

      {/* Summary */}
      {checkin && checkout && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <p>
            <strong>Check-in:</strong> {format(checkin, "dd/MM/yyyy HH:mm")}
          </p>
          <p>
            <strong>Check-out:</strong> {format(checkout, "dd/MM/yyyy HH:mm")}
          </p>
          <p>
            <strong>Total stay hours:</strong>{" "}
            {Math.round(totalHours - extraHours)}h
            {Math.round(totalHours - extraHours) === 24
              ? " (-1h adjustment)"
              : ""}
          </p>
          {extraHours > 0 && (
            <p>
              <strong>Late checkout:</strong> +{extraHours}h
            </p>
          )}
          <p className="mt-2 font-semibold text-green-600">
            Total price: {totalPrice}₫
          </p>
        </div>
      )}

      <Button
        className="mt-6 w-full"
        onClick={handleBook}
        disabled={!checkin || !checkout || isBookingConflict()}
      >
        Confirm Booking
      </Button>
    </div>
  );
}
