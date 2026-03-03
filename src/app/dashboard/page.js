"use client";

import { useState } from "react";
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

// Import Leaflet styles globally for this route
import "leaflet/dist/leaflet.css";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("interactive");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // 1. Core Default Filter State
    const defaultFilters = {
        drillLevel: 'National', // National -> Region -> Division -> SDO/District
        region: 'All Regions',
        division: '',
        district: '',
        municipality: '',
        focus: 'School Focus',
        q: '',
        categoricalFilters: {}, // e.g. { ownership: 'Private' }
        selected_metrics: [], // Array to hold dynamically selected columns
        selected_positions: [], // Array to hold dynamically selected positions
        plantilla_preset: null, // Hold the plantilla focus state
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
        global_trigger: 0,
        history: [] // State stack for the 'Undo/Back' logic
    };

    // 2. Tab-Scoped Filter Engine
    const [tabFilters, setTabFilters] = useState({});

    // Dynamically fetch the current tab's filters, or fallback to defaults if unvisited
    const filters = tabFilters[activeTab] || defaultFilters;

    const updateFilters = (newFilters) => {
        setTabFilters(prev => {
            const currentTabState = prev[activeTab] || defaultFilters;
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
        setTabFilters(prevTab => {
            const currentTabState = prevTab[activeTab] || defaultFilters;

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
            const currentTabState = prevTab[activeTab] || defaultFilters;

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

    const navigation = [
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

    return (
        <div className="flex flex-col h-screen w-full">
            <Navbar
                toggleDrawer={() => setIsDrawerOpen(true)}
                navigation={navigation}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            <HelpDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sticky Sidebar Controls - Hub for all Tab Inputs */}
                <SidebarControls
                    activeTab={activeTab}
                    filters={filters}
                    setFilters={updateFilters}
                    drillDown={applyDrillDown}
                    goBack={rollbackLevel}
                />

                {/* Main View Area - Data Display Only */}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white">
                        {activeTab === "interactive" && <InteractiveDashboardTab filters={filters} drillDown={applyDrillDown} goBack={rollbackLevel} />}
                        {activeTab === "locator" && <SchoolLocatorTab filters={filters} />}
                        {activeTab === "advanced_analytics" && <AdvancedAnalyticsTab filters={filters} />}
                        {activeTab === "plantilla" && <PlantillaPositionsTab filters={filters} drillDown={applyDrillDown} goBack={rollbackLevel} />}
                        {activeTab === "infra" && <InfrastructureTab filters={filters} />}
                        {activeTab === "search" && <QuickSearchTab filters={filters} setFilters={updateFilters} />}
                        {activeTab === "resource_mapping" && <ResourceMappingTab filters={filters} />}
                        {activeTab === "cloud_regional" && <CloudRegionalTab filters={filters} />}
                        {activeTab === "cloud_sdo" && <CloudSDOTab filters={filters} />}
                        {activeTab === "cloud_multi" && <CloudMultiTab filters={filters} />}
                        {activeTab === "data_explorer" && <DataExplorerTab filters={filters} />}
                        {activeTab === "input" && <DataInputTab filters={filters} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
