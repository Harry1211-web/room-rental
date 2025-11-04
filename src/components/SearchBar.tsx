"use client";
import { useState } from "react";
import { Input } from "./ui/input";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
}

export function SearchBar({ placeholder = "Search...", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="mb-4">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="w-full border rounded-md px-3 py-2 focus:outline-none"
      />
    </div>
  );
}
