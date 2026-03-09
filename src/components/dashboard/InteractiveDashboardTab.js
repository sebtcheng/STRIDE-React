"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { MapPin, Maximize2, X } from "lucide-react";
import SchoolLocatorTab from "./SchoolLocatorTab";

// Dynamically import Plotly with next/dynamic and no SSR to prevent issues with window variable missing 
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Chart Engine...</div> });

export default function InteractiveDashboardTab({ filters, drillDown, goBack, subTabOverride, onSubTabChange, isMobile }) {
    const [localSubTab, setLocalSubTab] = useState("visuals");
    const subTab = subTabOverride || localSubTab;
    const setSubTab = onSubTabChange || setLocalSubTab;
    const [dashboardBlocks, setDashboardBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [maximizedBlock, setMaximizedBlock] = useState(null);
    const [divisionGrouping, setDivisionGrouping] = useState('municipality');
    const [isAnimated, setIsAnimated] = useState(false);
    const [isModalAnimated, setIsModalAnimated] = useState(false);
    const [isLabelsVisible, setIsLabelsVisible] = useState(false);
    const [isModalLabelsVisible, setIsModalLabelsVisible] = useState(false);

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
        const url = new URL(window.location.origin + "/stride-api/dashboard-interactive");
        if (filters.region && filters.region !== "All Regions") url.searchParams.append("region", filters.region);
        if (filters.division) url.searchParams.append("division", filters.division);
        if (filters.municipality) url.searchParams.append("municipality", filters.municipality);
        if (filters.legislative_district) url.searchParams.append("legislative_district", filters.legislative_district);
        if (filters.drillLevel) url.searchParams.append("level", filters.drillLevel);
        if (filters.drillLevel === 'Division') url.searchParams.append("groupBy", divisionGrouping);
        url.searchParams.append("metrics", selectedMetricsStr);

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setDashboardBlocks(res.data.blocks || []);
                    setIsAnimated(false);
                    setIsLabelsVisible(false);
                    setTimeout(() => setIsAnimated(true), 100);
                    setTimeout(() => setIsLabelsVisible(true), 800);
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
    }, [filters.global_trigger, filters.selected_metrics, filters.drillLevel, filters.region, filters.division, filters.municipality, filters.legislative_district, divisionGrouping]);

    // Handle Report Generation Trigger
    useEffect(() => {
        if (filters.report_trigger && dashboardBlocks.length > 0) {
            const generateReport = async () => {
                const { generateHTMLReport } = await import("@/lib/reportGenerator");
                const subtitle = `Focus: ${filters.drillLevel} - ${filters[filters.drillLevel.toLowerCase()] || filters.region || 'National'}`;

                const charts = dashboardBlocks.map(block => ({
                    title: block.title,
                    data: [{
                        y: block.data.labels,
                        x: block.data.values,
                        type: 'bar',
                        orientation: 'h',
                        text: block.data.values.map(v => v.toLocaleString()),
                        textposition: 'outside',
                        cliponaxis: false,
                        textfont: { color: '#003366', size: 10 },
                        marker: {
                            color: block.type === 'categorical' ? '#FFB81C' : '#0066CC',
                            opacity: 0.95
                        }
                    }],
                    layout: {
                        yaxis: { autorange: 'reversed', automargin: true },
                        margin: { r: 100 }
                    }
                }));

                generateHTMLReport(
                    "STRIDE Dashboard Report",
                    subtitle,
                    charts,
                    {
                        region: filters.region,
                        division: filters.division,
                        drill_level: filters.drillLevel,
                        filters: {
                            metrics: filters.selected_metrics,
                            ...filters.categoricalFilters
                        }
                    }
                );
            };
            generateReport();
        }
    }, [filters.report_trigger]);

    const filtersRef = useRef(filters);
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    // Keep maximized modal in-sync with fresh data arriving from drilldown fetches
    useEffect(() => {
        if (maximizedBlock && dashboardBlocks.length > 0) {
            const updatedBlock = dashboardBlocks.find(b => b.id === maximizedBlock.id);
            if (updatedBlock && updatedBlock !== maximizedBlock) {
                setMaximizedBlock(updatedBlock);
            }
        } else if (maximizedBlock && !loading && dashboardBlocks.length === 0) {
            setMaximizedBlock(null);
        }
    }, [dashboardBlocks, maximizedBlock, loading]);

    // Animate Modal immediately after open or upon refreshing its block dependency
    useEffect(() => {
        if (maximizedBlock) {
            setIsModalAnimated(false);
            setIsModalLabelsVisible(false);
            const timer1 = setTimeout(() => setIsModalAnimated(true), 100);
            const timer2 = setTimeout(() => setIsModalLabelsVisible(true), 800);
            return () => { clearTimeout(timer1); clearTimeout(timer2); };
        }
    }, [maximizedBlock]);

    const layoutStyling = {
        font: { family: 'Inter, sans-serif', color: '#475569', size: 10 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true,
        showlegend: false,
        margin: { t: 10, r: 20, b: 30 },
        yaxis: {
            autorange: 'reversed',
            automargin: true,
            tickmode: 'linear',
            dtick: 1
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc]">
            {/* navset_card_tab: Dashboard vs Locator (Hidden on mobile as it's now in the sticky header) */}
            <div className="hidden md:flex bg-white border-b border-gray-200 px-6 pt-4 shrink-0 gap-6 z-10 shadow-sm">
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

                        {filters.drillLevel === 'Division' && (
                            <div className="w-full max-w-4xl mx-auto flex justify-center mb-6">
                                <div className="bg-white border text-sm font-bold border-[#003366] rounded-full flex overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setDivisionGrouping('municipality')}
                                        className={`px-6 py-2 transition-colors ${divisionGrouping === 'municipality' ? 'bg-[#003366] text-white' : 'text-[#003366] hover:bg-blue-50'}`}
                                    >
                                        Summary By Municipality
                                    </button>
                                    <button
                                        onClick={() => setDivisionGrouping('legislative_district')}
                                        className={`px-6 py-2 transition-colors ${divisionGrouping === 'legislative_district' ? 'bg-[#003366] text-white' : 'text-[#003366] hover:bg-blue-50'}`}
                                    >
                                        Summary By Legislative District
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="w-full max-w-4xl mx-auto bg-gray-50 border border-gray-200 text-center p-3 rounded-md mb-8 text-gray-600 text-sm">
                            Current Filter: Viewing {filters.drillLevel === 'National' ? 'All Regions' :
                                filters.drillLevel === 'DistrictGroup' ? `District Group: ${filters.municipality || filters.legislative_district}` :
                                    `${filters.drillLevel}: ${filters[filters.drillLevel.toLowerCase()] || filters.region}`}
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
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto`}>
                                {dashboardBlocks.map((block) => (
                                    <div key={block.id} className="w-full border border-gray-200 shadow-md rounded-xl overflow-hidden bg-white flex flex-col hover:shadow-lg transition-shadow">
                                        <div className="bg-[#003366] text-white font-bold py-2.5 px-3 flex justify-between items-center text-sm">
                                            <div className="w-6 hidden md:block"></div> {/* spacer to keep strict center alignment */}
                                            <span className="truncate flex-1 text-center">{block.title}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMaximizedBlock(block); }}
                                                className="text-white hover:text-gray-300 transition-colors opacity-70 hover:opacity-100 flex-none w-6 h-6 flex items-center justify-center"
                                                title="Maximize Chart"
                                            >
                                                <Maximize2 size={16} />
                                            </button>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="bg-[#eef2f6] rounded-lg p-4 text-center mb-4 shadow-inner border border-blue-100">
                                                <h3 className="font-bold text-gray-700 text-xs mb-1 uppercase tracking-wider">Overall Total</h3>
                                                <p className="text-3xl font-black text-[#003366]">{block.total.toLocaleString()}</p>
                                            </div>

                                            <div
                                                className="flex-1 min-h-[250px] relative z-10 overflow-y-auto pr-1"
                                                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                onClickCapture={(e) => {
                                                    if (loading) return;
                                                    let clickedName = window._hoveredPoint;

                                                    // Fallback: forcefully read the Plotly tooltip from the DOM if event failed
                                                    if (!clickedName) {
                                                        try {
                                                            const plotContainer = e.currentTarget.querySelector('.js-plotly-plot');
                                                            if (plotContainer) {
                                                                const hoverLayers = plotContainer.querySelectorAll('g.hovertext text');
                                                                const sortedLabels = [...(block.data.labels || [])].sort((a, b) => b.length - a.length);

                                                                for (let i = 0; i < hoverLayers.length; i++) {
                                                                    const text = hoverLayers[i].textContent;
                                                                    for (const label of sortedLabels) {
                                                                        if (text.includes(label)) {
                                                                            clickedName = label;
                                                                            break;
                                                                        }
                                                                    }
                                                                    if (clickedName) break;
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error("Error reading fallback tooltip:", err);
                                                        }
                                                    }

                                                    console.log("Resolved Clicked Name:", clickedName);

                                                    if (clickedName) {
                                                        window._hoveredPoint = null; // Consume it immediately
                                                        const currentFilters = filtersRef.current;
                                                        if (block.type === 'numeric') {
                                                            if (currentFilters.drillLevel === 'National') drillDown('Region', clickedName);
                                                            else if (currentFilters.drillLevel === 'Region') drillDown('Division', clickedName);
                                                            else if (currentFilters.drillLevel === 'Division') drillDown('DistrictGroup', clickedName, divisionGrouping);
                                                        }
                                                    }
                                                }}
                                            >
                                                <div style={{ minHeight: `${Math.max(250, (block.data.values?.length || 0) * 35)}px`, height: '100%', position: 'relative', width: '100%' }}>
                                                    <Plot
                                                        data={[{
                                                            y: block.data.labels,
                                                            x: isAnimated ? block.data.values : block.data.values.map(() => 0),
                                                            type: 'bar',
                                                            orientation: 'h',
                                                            text: isLabelsVisible ? block.data.values.map(v => v.toLocaleString()) : block.data.values.map(() => ''),
                                                            textposition: 'outside',
                                                            insidetextanchor: 'end',
                                                            cliponaxis: false,
                                                            textfont: {
                                                                family: 'Inter, sans-serif',
                                                                size: 10,
                                                                color: '#475569'
                                                            },
                                                            marker: {
                                                                color: block.type === 'categorical' ? '#FFB81C' : '#0066CC',
                                                                opacity: 0.9
                                                            }
                                                        }]}
                                                        layout={{
                                                            ...layoutStyling,
                                                            transition: { duration: 750, easing: 'cubic-in-out' },
                                                            margin: { t: 5, r: 80, b: 25, l: 15 }, // Increased R margin for labels
                                                            dragmode: false,
                                                            hovermode: 'closest',
                                                            xaxis: {
                                                                visible: false,
                                                                range: [0, Math.max(...block.data.values) * 1.25] // Give 25% extra space for huge numbers to safely sit on screen
                                                            },
                                                        }}
                                                        config={{ displayModeBar: false, doubleClick: false, responsive: true }}
                                                        useResizeHandler={true}
                                                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                                        onHover={(event) => {
                                                            console.log("[Normal View] Plotly onHover fired!", event.points);
                                                            if (event.points && event.points.length > 0) {
                                                                if (window._hoverTimer) clearTimeout(window._hoverTimer);
                                                                window._hoveredPoint = String(event.points[0].label || event.points[0].y || event.points[0].text || '').trim();
                                                                console.log("[Normal View] Set window._hoveredPoint to:", window._hoveredPoint);
                                                            }
                                                        }}
                                                        onUnhover={() => {
                                                            console.log("[Normal View] Plotly onUnhover fired!");
                                                            if (window._hoverTimer) clearTimeout(window._hoverTimer);
                                                            window._hoverTimer = setTimeout(() => { window._hoveredPoint = null; }, 500);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center mt-2 text-[10px] text-gray-400 font-medium italic">
                                                {block.subtitle}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Full Screen Chart Modal */}
                        {maximizedBlock && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-black/60 backdrop-blur-sm shadow-2xl">
                                <div className="bg-white rounded-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="bg-[#003366] text-white flex justify-between items-center px-6 py-4 rounded-t-2xl">
                                        <div>
                                            <h2 className="text-xl font-black tracking-wide">{maximizedBlock.title}</h2>
                                            <p className="text-blue-200 text-xs mt-1 uppercase tracking-widest">{maximizedBlock.subtitle}</p>
                                        </div>
                                        <button
                                            onClick={() => setMaximizedBlock(null)}
                                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col overflow-hidden bg-gray-50/50 relative">

                                        {loading && (
                                            <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                                                <div className="text-[#003366] font-black text-xl animate-pulse">
                                                    Fetching Drilldown Details...
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center mb-6">
                                            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-widest mb-2">Overall Total</h3>
                                            <p className="text-5xl font-black text-[#003366]">{maximizedBlock.total.toLocaleString()}</p>
                                        </div>

                                        <div
                                            className="flex-1 relative z-10 w-full min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto pr-2"
                                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                            onClickCapture={(e) => {
                                                if (loading) return;
                                                let clickedName = window._hoveredPoint;

                                                // Fallback: forcefully read the Plotly tooltip from the DOM if event failed
                                                if (!clickedName) {
                                                    try {
                                                        const plotContainer = e.currentTarget.querySelector('.js-plotly-plot');
                                                        if (plotContainer) {
                                                            const hoverLayers = plotContainer.querySelectorAll('g.hovertext text');
                                                            const sortedLabels = [...(maximizedBlock.data.labels || [])].sort((a, b) => b.length - a.length);

                                                            for (let i = 0; i < hoverLayers.length; i++) {
                                                                const text = hoverLayers[i].textContent;
                                                                for (const label of sortedLabels) {
                                                                    if (text.includes(label)) {
                                                                        clickedName = label;
                                                                        break;
                                                                    }
                                                                }
                                                                if (clickedName) break;
                                                            }
                                                        }
                                                    } catch (err) {
                                                        console.error("Error reading fallback tooltip:", err);
                                                    }
                                                }

                                                if (clickedName) {
                                                    window._hoveredPoint = null; // Consume it immediately
                                                    const currentFilters = filtersRef.current;
                                                    if (maximizedBlock.type === 'numeric') {
                                                        if (currentFilters.drillLevel === 'National') drillDown('Region', clickedName);
                                                        else if (currentFilters.drillLevel === 'Region') drillDown('Division', clickedName);
                                                        else if (currentFilters.drillLevel === 'Division') drillDown('DistrictGroup', clickedName, divisionGrouping);
                                                    }
                                                }
                                            }}
                                        >
                                            <div style={{ minHeight: `${Math.max(300, (maximizedBlock.data.values?.length || 0) * 45)}px`, height: '100%', position: 'relative', width: '100%' }}>
                                                <Plot
                                                    data={[{
                                                        y: maximizedBlock.data.labels,
                                                        x: isModalAnimated ? maximizedBlock.data.values : maximizedBlock.data.values.map(() => 0),
                                                        type: 'bar',
                                                        orientation: 'h',
                                                        text: isModalLabelsVisible ? maximizedBlock.data.values.map(v => v.toLocaleString()) : maximizedBlock.data.values.map(() => ''),
                                                        textposition: 'outside',
                                                        insidetextanchor: 'end',
                                                        cliponaxis: false,
                                                        textfont: {
                                                            family: 'Inter, sans-serif',
                                                            size: 13,
                                                            color: '#475569'
                                                        },
                                                        marker: {
                                                            color: maximizedBlock.type === 'categorical' ? '#FFB81C' : '#0066CC',
                                                            opacity: 0.95
                                                        }
                                                    }]}
                                                    layout={{
                                                        ...layoutStyling,
                                                        transition: { duration: 750, easing: 'cubic-in-out' },
                                                        margin: { t: 20, r: 120, b: 40, l: 30 }, // Increased R margin for labels
                                                        dragmode: false,
                                                        hovermode: 'closest',
                                                        xaxis: {
                                                            visible: false,
                                                            range: [0, Math.max(...maximizedBlock.data.values) * 1.25]
                                                        },
                                                        yaxis: {
                                                            ...layoutStyling.yaxis,
                                                            cliponaxis: false,
                                                            tickfont: { size: 12, family: 'Inter, sans-serif' }
                                                        }
                                                    }}
                                                    config={{ displayModeBar: false, doubleClick: false, responsive: true }}
                                                    useResizeHandler={true}
                                                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                                    onHover={(event) => {
                                                        if (event.points && event.points.length > 0) {
                                                            if (window._hoverTimer) clearTimeout(window._hoverTimer);
                                                            window._hoveredPoint = String(event.points[0].label || event.points[0].y || event.points[0].text || '').trim();
                                                        }
                                                    }}
                                                    onUnhover={() => {
                                                        if (window._hoverTimer) clearTimeout(window._hoverTimer);
                                                        window._hoverTimer = setTimeout(() => { window._hoveredPoint = null; }, 500);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                            <SchoolLocatorTab filters={filters} isMobile={isMobile} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
