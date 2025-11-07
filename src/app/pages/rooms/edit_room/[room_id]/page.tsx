"use client";

export default function RoomForm({
  form,
  setForm,
  tags,
  selectedTagIds,
  setSelectedTagIds,
  onSubmit,
  onCancel,
}: any) {
  function toggleTagSelection(tag_id: string) {
    setSelectedTagIds((prev: string[]) =>
      prev.includes(tag_id) ? prev.filter((t) => t !== tag_id) : [...prev, tag_id]
    );
  }

  return (
    <div className="p-6 max-w-3xl pt-32">
      <h2 className="text-xl font-semibold mb-4">{form.id ? "Edit Room" : "Create New Room"}</h2>

      <div className="space-y-2">
        <input className="w-full p-2 border rounded" placeholder="Title"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <textarea className="w-full p-2 border rounded" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="w-full p-2 border rounded" placeholder="City"
          value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />

        <input className="w-full p-2 border rounded" placeholder="Address"
          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

        <input className="w-full p-2 border rounded" placeholder="Area"
          value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />

        <input className="w-full p-2 border rounded" placeholder="Price"
          value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

        <div>
          <div className="mb-1 text-sm">Tags (click to toggle)</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t: any) => (
              <button
                key={t.tag_id}
                onClick={() => toggleTagSelection(t.tag_id)}
                className={`px-2 py-1 rounded text-sm border ${
                  selectedTagIds.includes(t.tag_id) ? "bg-blue-100" : "bg-white"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-md border" onClick={onSubmit}>
            {form.id ? "Save" : "Create"}
          </button>
          <button className="px-3 py-1 rounded-md border" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
