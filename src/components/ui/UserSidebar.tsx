"use client";

export default function UserSidebar() {
  return (
    <aside className="fixed right-0 top-0 w-64 h-full bg-gray-50 border-l p-4 shadow-lg z-40 pt-32">
      <h2 className="font-semibold mb-4">Filter</h2>

      <div className="flex flex-col gap-3">
        <label>
          <span className="text-sm">City</span>
          <input type="text" className="w-full border rounded px-2 py-1" placeholder="E.g. : Ha Noi" />
        </label>

        <label>
          <span className="text-sm">Price ($)</span>
          <input type="number" placeholder="Maximum" className="w-full border rounded px-2 py-1" />
        </label>

        <label>
          <span className="text-sm">Area (m²)</span>
          <input type="number" placeholder="At least" className="w-full border rounded px-2 py-1" />
        </label>

        <button className="bg-blue-500 text-white px-3 py-1 rounded mt-2">Apply</button>
      </div>
    </aside>
  );
}
