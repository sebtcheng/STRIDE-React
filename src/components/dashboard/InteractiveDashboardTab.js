"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import SchoolLocatorTab from "./SchoolLocatorTab";

// Dynamically import Plotly with next/dynamic and no SSR to prevent issues with window variable missing 
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Chart Engine...</div> });

export default function InteractiveDashboardTab({ filters, drillDown, goBack }) {
    const [subTab, setSubTab] = useState("visuals");
    const [dashboardBlocks, setDashboardBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        const selectedMetricsStr = (filters.selected_metrics && filters.selected_metrics.length > 0) ? filters.selected_metrics.join(',') : '';

        if (!selectedMetricsStr) {
            setDashboardBlocks([]);
            setApiError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setApiError(null);
        const url = new URL(window.location.origin + "/api/dashboard-interactive");
        if (filters.region && filters.region !== "All Regions") url.searchParams.append("region", filters.region);
        if (filters.division) url.searchParams.append("division", filters.division);
        if (filters.drillLevel) url.searchParams.append("level", filters.drillLevel);
        url.searchParams.append("metrics", selectedMetricsStr);

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setDashboardBlocks(res.data.blocks || []);
                } else {
                    console.error("API Soft Error:", res.message);
                    setDashboardBlocks([]);
                    setApiError(res.message || "Failed to parse selected database metrics.");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching dashboard interactive:", err);
                setApiError("Critical Network Request Failed.");
                setDashboardBlocks([]);
                setLoading(false);
            });
    }, [filters.global_trigger, filters.selected_metrics, filters.drillLevel, filters.region, filters.division]);

    const handleBarClick = (event, blockType) => {
        if (!event.points || event.points.length === 0) return;
        const clickedName = event.points[0].y; // Horizontal layout -> label is Y

        if (blockType === 'numeric') {
            // Geographic Drilldown
            if (filters.drillLevel === 'National') drillDown('Region', clickedName);
            else if (filters.drillLevel === 'Region') drillDown('Division', clickedName);
        } else {
            // Categorical Filter Placeholder (Part 3B.2)
            console.log("Categorical Filtering Triggered: Subset global dashboard by -> ", clickedName);
        }
    };

    const layoutStyling = {
        font: { family: 'Inter, sans-serif', color: '#475569' },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true,
        showlegend: false,
        margin: { t: 10, r: 20, b: 30, l: 80 },
        yaxis: { autorange: 'reversed' }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc]">
            {/* navset_card_tab: Dashboard vs Locator */}
            <div className="bg-white border-b border-gray-200 px-6 pt-4 shrink-0 flex gap-6 z-10 shadow-sm">
                <button
                    onClick={() => setSubTab('visuals')}
                    className={`pb-3 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${subTab === 'visuals' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Interactive Dashboard
                </button>
                <button
                    onClick={() => setSubTab('locator')}
                    className={`pb-3 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${subTab === 'locator' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    School Locator Map
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {subTab === 'visuals' && (
                    <div className="p-6">
                        <h2 className="text-2xl font-black text-center text-gray-800 mb-6 mt-2">Interactive Education Resource Dashboard</h2>

                        <div className="w-full max-w-4xl mx-auto bg-[#FFF8E7] text-[#856404] p-3 rounded-md text-center text-sm font-bold italic mb-6">
                            Instructions: Click on the bars to drilldown on any specific location then use the School Locator tab above to look for any specific school.
                        </div>

                        <div className="w-full max-w-4xl mx-auto bg-gray-50 border border-gray-200 text-center p-3 rounded-md mb-8 text-gray-600 text-sm">
                            Current Filter: Viewing {filters.drillLevel === 'National' ? 'All Regions' : `${filters.drillLevel}: ${filters[filters.drillLevel.toLowerCase()] || filters.region}`}
                        </div>

                        {loading && (
                            <div className="text-gray-500 font-bold text-center text-sm mt-10 w-full animate-pulse">
                                Rebuilding chart configuration metrics grid...
                            </div>
                        )}

                        {apiError && !loading && (
                            <div className="w-full max-w-4xl mx-auto bg-red-50 border border-red-200 text-center p-4 rounded-md mb-8 text-red-600 text-sm font-bold shadow">
                                Backend DB Error Encountered: {apiError}. Please make sure you have restarted the Next.js server to register the Azure STRIDE database change.
                            </div>
                        )}

                        {!loading && !apiError && dashboardBlocks.length === 0 && (
                            <div className="text-gray-400 italic text-center text-sm mt-10 w-full">
                                Please select a preset or metrics from the advanced dropdown filters to populate the grid.
                            </div>
                        )}

                        {!loading && !apiError && dashboardBlocks.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto">
                                {dashboardBlocks.map((block) => (
                                    <div key={block.id} className="w-full border border-gray-200 shadow-md rounded-xl overflow-hidden bg-white flex flex-col hover:shadow-lg transition-shadow">
                                        <div className="bg-[#003366] text-white font-bold py-2.5 px-3 text-center text-sm truncate">
                                            {block.title}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="bg-[#eef2f6] rounded-lg p-4 text-center mb-4 shadow-inner border border-blue-100">
                                                <h3 className="font-bold text-gray-700 text-xs mb-1 uppercase tracking-wider">Overall Total</h3>
                                                <p className="text-3xl font-black text-[#003366]">{block.total.toLocaleString()}</p>
                                            </div>

                                            <div className="flex-1 min-h-[250px] relative">
                                                <Plot
                                                    data={[{
                                                        y: block.data.labels,
                                                        x: block.data.values,
                                                        type: 'bar',
                                                        orientation: 'h',
                                                        marker: {
                                                            color: block.type === 'categorical' ? '#FFB81C' : '#0066CC',
                                                            opacity: 0.9
                                                        }
                                                    }]}
                                                    layout={{
                                                        ...layoutStyling,
                                                        // Adjust left margin dynamically if labels are long
                                                        margin: { t: 5, r: 15, b: 25, l: block.type === 'categorical' ? 120 : 80 }
                                                    }}
                                                    useResizeHandler
                                                    className="w-full h-full absolute inset-0"
                                                    onClick={(event) => handleBarClick(event, block.type)}
                                                />
                                            </div>
                                            <div className="text-center mt-2 text-[10px] text-gray-400 font-medium italic">
                                                {block.subtitle}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {subTab === 'locator' && (
                    <div className="h-full">
                        {(filters.drillLevel === 'National' || filters.region === 'All Regions') ? (
                            <div className="h-full flex items-center justify-center p-8 bg-gray-50">
                                <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-xl font-black text-[#003366] mb-2">Macro Level View Active</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Please go to the <strong>Interactive Dashboard</strong> tab and click on a bar in any graph to select a region or division before accessing the School Locator map. Rendering national-level school data requires geographic filtering to prevent system overload.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <SchoolLocatorTab filters={filters} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
