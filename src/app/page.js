"use client";

import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/auth/LoginPage";
import HomeDashboard from "@/components/home/HomeDashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <HomeDashboard />;
}

