"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import HelpDrawer from "@/components/layout/HelpDrawer";
import HeroBanner from "@/components/home/HeroBanner";
import ImageCarousel from "@/components/home/ImageCarousel";
import Capabilities from "@/components/home/Capabilities";
import ResourceToolkits from "@/components/home/ResourceToolkits";

export default function HomeDashboard() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const router = useRouter();

    const navigation = [
        { id: "home", label: "Home", type: "standalone" },
        {
            id: "menu-dashboard",
            label: "Dashboard",
            type: "dropdown",
            children: [
                { id: "interactive", label: "Education Resource Dashboard" },
                { id: "advanced_analytics", label: "Advanced Analytics" },
                { id: "plantilla", label: "Plantilla Positions" },
                { id: "infra", label: "Infrastructure & Facilities" }
            ]
        },
        { id: "search", label: "Quick Search", type: "standalone" },
        { id: "resource_mapping", label: "Resource Mapping", type: "standalone" },
        {
            id: "menu-cloud",
            label: "CLOUD",
            type: "dropdown",
            children: [
                { id: "cloud_regional", label: "CLOUD (Regional Profile)" },
                { id: "cloud_sdo", label: "CLOUD (SDO Breakdown)" },
                { id: "cloud_multi", label: "CLOUD (Multi-variable)" }
            ]
        },
        {
            id: "menu-data-explorer",
            label: "Data Explorer",
            type: "dropdown",
            restricted: true,
            children: [
                { id: "data_explorer", label: "Information Database" }
            ]
        }
    ];

    const handleTabChange = (tabId) => {
        if (tabId !== "home") {
            router.push(`/dashboard?tab=${tabId}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
            <Navbar
                toggleDrawer={() => setIsDrawerOpen(true)}
                navigation={navigation}
                activeTab="home"
                onTabChange={handleTabChange}
            />
            <HelpDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

            <main className="flex-1 w-full pb-16 flex flex-col items-center">
                <div className="w-full">
                    <HeroBanner />
                </div>
                <div className="w-full mt-[-60px] relative z-20">
                    <ImageCarousel />
                </div>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 mt-20">
                    <Capabilities />
                    <ResourceToolkits />
                </div>
            </main>
        </div>
    );
}
