// app/loading.tsx
export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50">
      <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
