"use client";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
