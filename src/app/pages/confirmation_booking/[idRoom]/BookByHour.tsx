"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import TimePicker from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import {
  differenceInMinutes,
  format,
  isSameDay,
  startOfToday,
  isBefore,
} from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BookingByHour({ room, bookings }: any) {
  const { idUser } = useUser();
  const pricePerHour = Math.ceil(room.price / 24);

  const [date, setDate] = useState<Date | null>(null);
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [overnight, setOvernight] = useState(false);

  const route = useRouter();
  const { setLoading } = useUser();

  useEffect(() => {
    if (!checkin || !checkout) return;

    const co = new Date(checkout);

    if (overnight) {
      // bật overnight → checkout nhỏ hơn checkin thì cộng thêm 1 ngày
      co.setDate(checkin.getDate() + 1);
      setCheckout(co);
    } else {
      // tắt overnight → nếu checkout > checkin + 1 ngày thì giảm về cùng ngày
      if (co > checkin) {
        const newCheckout = new Date(checkin);
        newCheckout.setHours(checkin.getHours() + 1, checkin.getMinutes());
        setCheckout(newCheckout);
      }
    }
  }, [overnight, checkin]);

  const bookedSlots = bookings.map((b: any) => ({
    start: b.start_time ? new Date(b.start_time) : null,
    end: b.end_time ? new Date(b.end_time) : null,
  }));

  const handleCheckinChange = (time: Date) => {
    if (!date) return;
    const ci = new Date(date);
    ci.setHours(time.getHours(), time.getMinutes());
    setCheckin(ci);
    if (!overnight) {
      const co = new Date(ci);
      co.setHours(ci.getHours() + 1);
      setCheckout(co);
    }
  };

  const handleCheckoutChange = (time: Date) => {
    if (!checkin) return;
    let co = new Date(checkin);
    co.setHours(time.getHours(), time.getMinutes());
    // Nếu bật overnight và checkout <= checkin → cộng thêm 1 ngày
    if (overnight) co.setDate(co.getDate() + 1);
    setCheckout(co);
  };

  // Tính tổng giờ và tiền
  const totalHours =
    checkin && checkout ? differenceInMinutes(checkout, checkin) / 60 : 0;
  const totalPrice = totalHours * pricePerHour;

  // Check conflict với bookedSlots
  const isBookingConflict = () => {
    if (!checkin || !checkout) return false;

    return bookedSlots.some((slot: { start: Date; end: Date }) => {
      const start = slot.start || new Date(0); // nếu start null → coi là từ quá khứ
      const end = slot.end || new Date(8640000000000000); // nếu end null → coi là vô hạn
      // Kiểm tra overlap
      return checkin < end && checkout > start;
    });
  };

  const handleBook = async () => {
    if (!checkin || !checkout) return;
    setLoading(true);
    const checkoutToSave =
      overnight && checkout <= checkin
        ? new Date(checkout.setDate(checkout.getDate() + 1))
        : checkout;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        room_id: room.id,
        tenant_id: idUser,
        start_time: checkin.toISOString(),
        end_time: checkoutToSave.toISOString(),
        total_price: totalPrice,
        status: "pending",
      })
      .select("id");

    if (error) return alert("Booking failed");

    setLoading(false);
    toast.success("Booking successful!");
    route.push(`pages/history_booking`);
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Select date */}
      <Calendar
        mode="single"
        selected={date || undefined}
        required={true}
        onSelect={(d) => {
          if (!d) {
            setDate(null);
            setCheckin(null);
            setCheckout(null);
            return;
          }
          const now = new Date();
          const today = startOfToday();

          if (isBefore(d, today)) return;
          if (isSameDay(d, now)) {
            d.setHours(now.getHours(), now.getMinutes(), 0, 0);
          }
          setDate(d);
          setCheckin(d);
          const co = new Date(d);
          co.setHours(d.getHours() + 1);
          setCheckout(co);
        }}
        disabled={[
          (date) => isBefore(date, startOfToday()), // disable ngày quá khứ
        ]}
      />

      {/* Toggle overnight */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={overnight}
          onChange={(e) => setOvernight(e.target.checked)}
        />
        <span>Overnight Booking</span>
      </div>

      <div className="flex gap-4 mt-4">
        <TimePicker
          label="Check-in time"
          value={checkin}
          onChange={handleCheckinChange}
          minTime={
            checkin && isSameDay(checkin, new Date()) ? new Date() : undefined
          }
          bookedSlots={bookedSlots}
          disable={!date}
        />

        <TimePicker
          label="Checkout time"
          value={checkout}
          onChange={handleCheckoutChange}
          bookedSlots={bookedSlots}
          disable={!date || !checkin || isBookingConflict()}
          minTime={overnight && checkin ? checkin : undefined}
        />
      </div>

      <span className="ml-2 text-sm text-gray-500">
        (Checkout earlier than check-in → applies only if Overnight is checked)
      </span>
      <p>
        <strong>Price per 1 hour:</strong> {pricePerHour}₫
      </p>

      {isBookingConflict() && (
        <p className="mt-2 text-red-600 font-semibold">
          ⚠ Selected check-in/check-out overlaps with an existing booking!
        </p>
      )}

      {/* Summary */}
      {checkin && checkout && (
        <div className="mt-4 p-3 border rounded bg-gray-50 dark:text-gray-700">
          <p>
            <strong>Check-in:</strong> {format(checkin, "dd/MM/yyyy HH:mm")}
          </p>
          <p>
            <strong>Checkout:</strong> {format(checkout, "dd/MM/yyyy HH:mm")}
          </p>
          <p className="mt-2 font-semibold text-green-600">
            Total price: {totalPrice}
          </p>
        </div>
      )}

      <p className="mt-4 font-semibold text-green-600">
        Total price: ${totalPrice} ({totalHours} hours)
      </p>

      <Button
        className="mt-6 w-full"
        onClick={handleBook}
        disabled={
          !checkin || !checkout || isBookingConflict() || totalPrice == 0
        }
      >
        Confirm Hourly Booking
      </Button>
    </div>
  );
}
