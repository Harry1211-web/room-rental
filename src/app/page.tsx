"use client";

import { useUser } from "./context/Usercontext";
import { useAuthSync } from "./useAuthSync";
import AdminPage from "./pages/main/AdminPage";
import RecomendPage from "./pages/main/RecomendPage";
import { Button } from "../components/ui/button";

export default function Home() {
  const { role, loading, logout } = useUser();
  useAuthSync(60);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-24">
      {role == "admin" ? <AdminPage /> : <RecomendPage />}
      <Button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        Logout
      </Button>
    </div>
  );
}
