"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SidebarControls from "@/components/dashboard/SidebarControls";
import InteractiveDashboardTab from "@/components/dashboard/InteractiveDashboardTab";
import SchoolLocatorTab from "@/components/dashboard/SchoolLocatorTab";
import HRTrackingTab from "@/components/dashboard/HRTrackingTab";
import InfrastructureTab from "@/components/dashboard/InfrastructureTab";
import QuickSearchTab from "@/components/dashboard/QuickSearchTab";
import DataInputTab from "@/components/dashboard/DataInputTab";
import AdvancedAnalyticsTab from "@/components/dashboard/AdvancedAnalyticsTab";
import PlantillaPositionsTab from "@/components/dashboard/PlantillaPositionsTab";
import ResourceMappingTab from "@/components/dashboard/ResourceMappingTab";
import CloudRegionalTab from "@/components/dashboard/CloudRegionalTab";
import CloudSDOTab from "@/components/dashboard/CloudSDOTab";
import CloudMultiTab from "@/components/dashboard/CloudMultiTab";
import DataExplorerTab from "@/components/dashboard/DataExplorerTab";
import Navbar from "@/components/layout/Navbar";
import HelpDrawer from "@/components/layout/HelpDrawer";
import useIsMobile from "@/hooks/useIsMobile";

// Import Leaflet styles globally for this route
import "leaflet/dist/leaflet.css";

// 1. Core Default Filter State (defined outside to prevent reference instability)
const initialFilters = {
    drillLevel: 'National', // National -> Region -> Division -> SDO/District
    region: 'All Regions',
    division: '',
    district: '',
    municipality: '',
    focus: 'School Focus',
    q: '',
    categoricalFilters: {},
    selected_metrics: [],
    selected_positions: [],
    plantilla_preset: null,
    resource_view_mode: 'Standard',
    resource_mapping_type: 'Teaching Deployment',
    data_explorer_domains: {
        'School Info': true,
        'Teaching Data': false,
        'Non-Teaching': false,
        'Enrolment': false,
        'Specialization': false,
        'Infrastructure': false
    },
    data_explorer_selections: {
        'School Info': [],
        'Teaching Data': [],
        'Non-Teaching': [],
        'Enrolment': [],
        'Specialization': [],
        'Infrastructure': []
    },
    explorer_regions: [],
    explorer_divisions: [],
    global_trigger: 0,
    history: []
};

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "interactive");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMobileResultsOpen, setIsMobileResultsOpen] = useState(false);
    const [interactiveSubTab, setInteractiveSubTab] = useState('visuals'); // 'visuals' or 'locator'
    const lastDrillTime = useRef(0);



    // Watch for url query parameter changes and update the active tab
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (newTabId) => {
        if (newTabId === "home") {
            router.push('/');
            return;
        }
        setActiveTab(newTabId);
        setIsMobileResultsOpen(false); // Reset to filters view when changing tabs on mobile
        // Shallow update URL
        router.push(`/dashboard?tab=${newTabId}`, { scroll: false });
    };

    // 2. Tab-Scoped Filter Engine
    const [tabFilters, setTabFilters] = useState({});

    // Dynamically fetch the current tab's filters, or fallback to defaults
    const filters = tabFilters[activeTab] || initialFilters;

    const updateFilters = (newFilters) => {
        setTabFilters(prev => {
            const currentTabState = prev[activeTab] || initialFilters;
            return {
                ...prev,
                [activeTab]: {
                    ...currentTabState,
                    ...newFilters,
                    global_trigger: currentTabState.global_trigger + 1
                }
            };
        });
    };

    const applyDrillDown = (level, name, groupingTarget) => {
        const now = Date.now();
        if (now - lastDrillTime.current < 500) return; // Prevent rapid multi-drills (especially on mobile)
        lastDrillTime.current = now;

        setTabFilters(prevTab => {
            const currentTabState = prevTab[activeTab] || initialFilters;

            if (currentTabState.drillLevel === level) return prevTab; // Prevent double-firing

            const nextHistory = [...currentTabState.history, {
                drillLevel: currentTabState.drillLevel,
                region: currentTabState.region,
                division: currentTabState.division,
                municipality: currentTabState.municipality,
                legislative_district: currentTabState.legislative_district,
                categoricalFilters: currentTabState.categoricalFilters
            }];

            const newState = { ...currentTabState, drillLevel: level, history: nextHistory, global_trigger: currentTabState.global_trigger + 1 };

            if (level === 'Region') {
                newState.region = name;
                newState.division = '';
                newState.municipality = '';
                newState.legislative_district = '';
            } else if (level === 'Division') {
                newState.division = name;
                newState.municipality = '';
                newState.legislative_district = '';
            } else if (level === 'DistrictGroup') {
                if (groupingTarget === 'municipality') newState.municipality = name;
                if (groupingTarget === 'legislative_district') newState.legislative_district = name;
            }

            return {
                ...prevTab,
                [activeTab]: newState
            };
        });
    };

    const rollbackLevel = () => {
        setTabFilters(prevTab => {
            const currentTabState = prevTab[activeTab] || initialFilters;

            if (currentTabState.history.length === 0) return prevTab;

            const lastState = currentTabState.history[currentTabState.history.length - 1];
            const nextHistory = currentTabState.history.slice(0, -1);

            return {
                ...prevTab,
                [activeTab]: {
                    ...currentTabState,
                    ...lastState,
                    history: nextHistory,
                    global_trigger: currentTabState.global_trigger + 1
                }
            };
        });
    };

    // Unified navigation for both desktop and mobile to support new mobile flow
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
        { id: "data_explorer", label: "Data Explorer", type: "standalone", restricted: true }
    ];

    return (
        <div className="flex flex-col h-screen w-full">
            <Navbar
                toggleDrawer={() => setIsDrawerOpen(true)}
                navigation={navigation}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
            <HelpDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* 
                  * SIDEBAR CONTROLS 
                  * Desktop: Sticky Left Side (if not contact)
                  * Mobile: Full Width Overlay Document (if !isMobileResultsOpen)
                  */}
                {activeTab !== "contact" && (!isMobile || (isMobile && !isMobileResultsOpen)) && (
                    <SidebarControls
                        activeTab={activeTab}
                        filters={filters}
                        setFilters={updateFilters}
                        drillDown={applyDrillDown}
                        goBack={rollbackLevel}
                        isMobile={isMobile}
                        onShowMobileResults={() => setIsMobileResultsOpen(true)}
                    />
                )}

                {/* 
                  * MAIN VIEW AREA (Data Display)
                  * Desktop: Takes remaining space
                  * Mobile: Full Width Overlay Document (if isMobileResultsOpen), else Hidden
                  */}
                {(!isMobile || (isMobile && isMobileResultsOpen) || activeTab === "contact") && (
                    <main className={`flex-1 flex flex-col h-full overflow-hidden bg-white ${isMobile ? 'absolute inset-0 z-40' : 'relative'}`}>
                        {/* Mobile 'Filters', 'Back', and 'View Toggle' Sticky Header */}
                        {isMobile && activeTab !== "contact" && activeTab !== "search" && (
                            <div className="bg-[#003366] text-white p-3 flex items-center shadow-md z-40 shrink-0 gap-3">
                                <button
                                    onClick={() => setIsMobileResultsOpen(false)}
                                    className="flex items-center gap-1.5 text-sm font-bold hover:text-blue-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Filters
                                </button>

                                {filters.history?.length > 0 && (
                                    <button
                                        onClick={rollbackLevel}
                                        className="flex items-center gap-1 text-xs font-bold bg-[#CE1126] hover:bg-red-800 px-2.5 py-1.5 rounded-md transition-colors border border-red-500/30"
                                    >
                                        <ArrowLeft size={12} /> BACK
                                    </button>
                                )}

                                {/* Sub-tab Toggle for Interactive Dashboard */}
                                {activeTab === 'interactive' && (
                                    <div className="flex bg-white/10 p-1 rounded-lg ml-2">
                                        <button
                                            onClick={() => setInteractiveSubTab('visuals')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${interactiveSubTab === 'visuals' ? 'bg-white text-[#003366] shadow-sm' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Data
                                        </button>
                                        <button
                                            onClick={() => setInteractiveSubTab('locator')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${interactiveSubTab === 'locator' ? 'bg-white text-[#003366] shadow-sm' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Map
                                        </button>
                                    </div>
                                )}


                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white">
                            <div key={activeTab} className="animate-tab-enter flex flex-col h-full w-full">
                                {activeTab === "interactive" && (
                                    <InteractiveDashboardTab
                                        filters={filters}
                                        drillDown={applyDrillDown}
                                        goBack={rollbackLevel}
                                        subTabOverride={interactiveSubTab}
                                        onSubTabChange={setInteractiveSubTab}
                                        isMobile={isMobile}
                                    />
                                )}
                                {activeTab === "locator" && <SchoolLocatorTab filters={filters} isMobile={isMobile} />}
                                {activeTab === "advanced_analytics" && <AdvancedAnalyticsTab filters={filters} drillDown={applyDrillDown} goBack={rollbackLevel} />}
                                {activeTab === "plantilla" && <PlantillaPositionsTab filters={filters} drillDown={applyDrillDown} goBack={rollbackLevel} />}
                                {activeTab === "infra" && <InfrastructureTab filters={filters} />}
                                {activeTab === "search" && <QuickSearchTab filters={filters} setFilters={updateFilters} />}
                                {activeTab === "resource_mapping" && <ResourceMappingTab filters={filters} setFilters={updateFilters} />}
                                {activeTab === "cloud_regional" && <CloudRegionalTab filters={filters} />}
                                {activeTab === "cloud_sdo" && <CloudSDOTab filters={filters} />}
                                {activeTab === "cloud_multi" && <CloudMultiTab filters={filters} />}
                                {activeTab === "data_explorer" && <DataExplorerTab filters={filters} />}
                                {activeTab === "contact" && <ContactUsTab />}
                                {activeTab === "input" && <DataInputTab filters={filters} />}
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}
