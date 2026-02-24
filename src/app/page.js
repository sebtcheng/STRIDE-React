"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import HelpDrawer from "@/components/layout/HelpDrawer";
import HeroBanner from "@/components/home/HeroBanner";
import ImageCarousel from "@/components/home/ImageCarousel";
import Capabilities from "@/components/home/Capabilities";
import ResourceToolkits from "@/components/home/ResourceToolkits";

export default function Home() {
  const { user, loading, loginWithGoogle, loginAsGuest } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#003366] mb-2">STRIDE</h1>
            <p className="text-sm text-gray-500">Strategic Resource Inventory for Deployment Efficiency</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-[#003366] hover:bg-[#002244] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In with DepEd Google (@deped.gov.ph)
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={loginAsGuest}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <UserCircle className="w-5 h-5" />
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      <Navbar toggleDrawer={() => setIsDrawerOpen(true)} />
      <HelpDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="flex-1 w-full pb-16">
        <div className="px-4">
          <HeroBanner />
          <ImageCarousel />
        </div>
        <Capabilities />
        <ResourceToolkits />
      </main>
    </div>
  );
}
