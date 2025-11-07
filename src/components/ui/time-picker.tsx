"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import { format } from "date-fns";

interface TimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minTime?: Date | null; // Minimum selectable time
  disable: boolean; // Disable the time picker
  bookedSlots?: { start: Date; end: Date }[]; // Booked slots
}

export default function TimePicker({
  label,
  value,
  onChange,
  minTime,
  bookedSlots,
  disable,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value when parent value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Generate 30-min interval times for the day
  const generateTimes = () => {
    const times: { label: string; date: Date }[] = [];
    const baseDate = internalValue ? new Date(internalValue) : new Date();

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const t = new Date(baseDate);
        t.setHours(h, m, 0, 0);
        times.push({
          label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
          date: t,
        });
      }
    }
    return times;
  };

  // Determine if a specific time should be disabled
  const isDisabled = (d: Date) => {
    if (!minTime && !bookedSlots) return false;

    // Check minTime
    if (minTime && d < minTime) return true;

    if (!bookedSlots) return false;

    // Filter slots cùng ngày với d
    const sameDaySlots = bookedSlots.filter(
      (slot) =>
        (slot.start &&
          slot.start.getFullYear() === d.getFullYear() &&
          slot.start.getMonth() === d.getMonth() &&
          slot.start.getDate() === d.getDate()) ||
        (slot.end &&
          slot.end.getFullYear() === d.getFullYear() &&
          slot.end.getMonth() === d.getMonth() &&
          slot.end.getDate() === d.getDate())
    );

    return sameDaySlots.some((slot) => {
      if (slot.start && slot.end) {
        return d >= slot.start && d < slot.end;
      } else if (slot.start && !slot.end) {
        return d >= slot.start;
      } else if (!slot.start && slot.end) {
        return d < slot.end;
      }
      return false; // neither start nor end → ignore
    });
  };

  const displayValue = value ? format(value, "HH:mm") : "Select time";

  return (
    <div className="w-full space-y-1">
      {label && <p className="text-sm font-medium">{label}</p>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disable}
          >
            {displayValue}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-48">
          <Command>
            <CommandInput placeholder="Search time..." />
            <CommandList>
              <CommandGroup>
                {generateTimes().map((t) => {
                  const disabled = isDisabled(t.date);
                  return (
                    <CommandItem
                      key={t.label}
                      value={t.label}
                      disabled={disabled}
                      className={disabled ? "text-red-500" : ""}
                      onSelect={() => {
                        if (disabled) return;
                        setInternalValue(t.date); // Update local state
                        onChange(t.date); // Sync with parent
                        setOpen(false);
                      }}
                    >
                      {t.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
