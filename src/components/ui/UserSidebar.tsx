"use client";

export default function UserSidebar() {
  return (
    <aside className="fixed right-0 top-0 w-64 h-full bg-gray-50 border-l p-4 shadow-lg z-40 pt-32">
      <h2 className="font-semibold mb-4">Bộ lọc</h2>

      <div className="flex flex-col gap-3">
        <label>
          <span className="text-sm">Thành phố</span>
          <input type="text" className="w-full border rounded px-2 py-1" placeholder="VD: Hà Nội" />
        </label>

        <label>
          <span className="text-sm">Khoảng giá (₫)</span>
          <input type="number" placeholder="Tối đa" className="w-full border rounded px-2 py-1" />
        </label>

        <label>
          <span className="text-sm">Diện tích (m²)</span>
          <input type="number" placeholder="Tối thiểu" className="w-full border rounded px-2 py-1" />
        </label>

        <button className="bg-blue-500 text-white px-3 py-1 rounded mt-2">Áp dụng</button>
      </div>
    </aside>
  );
}
