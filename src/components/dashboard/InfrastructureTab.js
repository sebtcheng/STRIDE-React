"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Building, TrendingUp, Pickaxe, Search } from "lucide-react";
import DataTable from "react-data-table-component";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Charts...</div> });

const INFRA_COLORS = {
    "ALS-CLC": "#E41A1C",
    "Electrification": "#FF7F00",
    "Gabaldon": "#4DAF4A",
    "Health": "#1B9E77",
    "LMS": "#17BECF",
    "New Construction": "#A6CEE3",
    "QRF": "#984EA3",
    "Repairs": "#F781BF",
    "SPED-ILRC": "#FDBF6F",
    "LIH": "#CAB2D6"
};

export default function InfrastructureTab({ filters }) {
    const [infraData, setInfraData] = useState({
        summary: { totalProjects: 0 },
        yearlyData: {},
        loading: true
    });

    const [activeView, setActiveView] = useState('allocation');
    const [latestClickKey, setLatestClickKey] = useState(null);
    const [projectData, setProjectData] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");

    useEffect(() => {
        setInfraData(prev => ({ ...prev, loading: true }));
        fetch('/stride-api/infra-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters })
        })
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setInfraData({ ...res.data, loading: false });
                }
            })
            .catch(err => {
                console.error("Error fetching infra data:", err);
                setInfraData(prev => ({ ...prev, loading: false }));
            });
    }, [filters]);

    useEffect(() => {
        setLoadingProjects(true);
        fetch('/stride-api/infra-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters, clickKey: latestClickKey })
        })
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setProjectData(res.data);
                }
                setLoadingProjects(false);
            })
            .catch(err => {
                console.error("Error fetching infra projects:", err);
                setLoadingProjects(false);
            });
    }, [filters, latestClickKey]);

    const years = Object.keys(infraData.yearlyData).sort();
    const allCategories = new Set();
    years.forEach(y => {
        Object.keys(infraData.yearlyData[y].categories).forEach(c => allCategories.add(c));
    });

    const colors = ["#003366", "#FFB81C", "#CE1126", "#22C55E", "#3B82F6", "#EAB308", "#FF69B4"];
    const getColor = (c, i) => INFRA_COLORS[c] || colors[i % colors.length];

    const allocationTraces = [];
    const completionTraces = [];
    const trendTraces = [];

    Array.from(allCategories).forEach((cat, i) => {
        const catColor = getColor(cat, i);

        // Tab 1: Allocation Overview
        const allocationY = years.map(y => infraData.yearlyData[y].categories[cat]?.allocation || 0);
        const totalPerYear = years.map(y => infraData.yearlyData[y].total_allocation || 1);

        allocationTraces.push({
            x: years,
            y: allocationY,
            name: cat,
            type: 'bar',
            marker: { color: catColor },
            hovertemplate: '<b>%{x}</b><br>%{y:$,.0f}<br>%{customdata:.1f}% of Year<extra>%{data.name}</extra>',
            customdata: allocationY.map((val, idx) => (val / totalPerYear[idx]) * 100)
        });

        // Tab 2: Completion Overview (Exclude 2025 and 0 completions)
        const validCompletionYears = years.filter(y => y !== "2025");
        const completionYRaw = validCompletionYears.map(y => infraData.yearlyData[y].categories[cat]?.completion || 0);
        const hasValidCompletion = completionYRaw.some(v => v > 0.0001);

        if (hasValidCompletion) {
            completionTraces.push({
                x: validCompletionYears,
                y: completionYRaw.map(v => v > 0.0001 ? v * 100 : null),
                name: cat,
                type: 'bar',
                marker: { color: catColor },
                text: completionYRaw.map(v => v > 0.0001 ? `${(v * 100).toFixed(0)}%` : ""),
                textposition: 'outside',
                cliponaxis: false,
                textfont: { color: '#003366', size: 9 },
                hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra>%{data.name}</extra>'
            });
        }

        // Bottom: Allocation Trend Line Graph
        trendTraces.push({
            x: years,
            y: allocationY,
            name: cat,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: catColor, size: 6 },
            line: { width: 2 },
            hovertemplate: '<b>%{x}</b><br>%{y:$,.0f}<extra>%{data.name}</extra>'
        });
    });

    // Handle Report Generation Trigger
    useEffect(() => {
        if (filters.report_trigger && infraData.yearlyData) {
            const generateReport = async () => {
                const { generateHTMLReport } = await import("@/lib/reportGenerator");
                const subtitle = `Infrastructure Analysis - ${filters.infra_regions?.join(', ') || 'National'}`;

                const charts = [];
                if (activeView === 'allocation') {
                    charts.push({
                        title: "Total Allocation by Category",
                        data: allocationTraces.filter(t => t.y.some(v => v > 0)).map(t => ({
                            ...t,
                            x: t.y,
                            y: t.x,
                            orientation: 'h',
                            text: t.y.map(val => val > 0 ? new Intl.NumberFormat('en-PH', { notation: "compact", compactDisplay: "short" }).format(val) : ""),
                            textposition: 'outside',
                            cliponaxis: false,
                            textfont: { color: '#003366', size: 9 }
                        })),
                        layout: { barmode: 'stack', yaxis: { autorange: 'reversed' }, margin: { r: 80 } }
                    });
                } else {
                    charts.push({
                        title: "Average Completion Rate",
                        data: completionTraces.filter(t => t.y.some(v => v && v > 0)).map(t => ({
                            ...t,
                            x: t.y,
                            y: t.x,
                            orientation: 'h',
                            text: t.y.map(val => val ? `${val.toFixed(0)}%` : ""),
                            textposition: 'outside',
                            cliponaxis: false,
                            textfont: { color: '#003366', size: 9 }
                        })),
                        layout: { barmode: 'group', yaxis: { autorange: 'reversed' }, xaxis: { title: 'Completion %' }, margin: { r: 80 } }
                    });
                }

                generateHTMLReport(
                    `Infrastructure_${activeView}_Report_${new Date().toISOString().split('T')[0]}`,
                    subtitle,
                    charts,
                    {
                        drill_level: "Infrastructure Dashboard",
                        regions: filters.infra_regions,
                        divisions: filters.infra_divisions,
                        filters: {
                            categories: filters.infra_categories,
                            summary: infraData.summary,
                            activeTab: activeView
                        }
                    }
                );
            };
            generateReport();
        }
    }, [filters.report_trigger, activeView]);

    const handleChartClick = (e, chartType) => {
        if (e.points && e.points.length > 0) {
            const point = e.points[0];
            setLatestClickKey({
                year: point.x,
                category: point.data.name,
                chartType: chartType
            });
        }
    };

    const layoutStyling = {
        font: { family: 'Poppins, sans-serif' },
        margin: { t: 40, r: 20, b: 40, l: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true
    };

    // Calculate total annotations for Stacked Bar Chart
    const allocationAnnotations = years.map((y, idx) => {
        let total = 0;
        allocationTraces.forEach(t => total += t.y[idx] || 0);
        return {
            x: y,
            y: total,
            text: `<b>${new Intl.NumberFormat('en-PH', { notation: "compact", compactDisplay: "short" }).format(total)}</b>`,
            xanchor: 'center',
            yanchor: 'bottom',
            showarrow: false,
            font: { size: 12, color: '#003366', weight: 'bold' }
        };
    });

    // Filter projects locally when using search text or implicitly when 'completion' tab is active to exclude 2025
    const filteredProjects = useMemo(() => {
        let data = projectData || [];

        // Ensure 2025 is excluded if clicking completion chart... Though 'latestClickKey' from completion chart won't ever be 2025 as it's excluded from the trace. But just to be strictly robust based on instructions:
        if (latestClickKey && latestClickKey.chartType === 'completion') {
            data = data.filter(p => String(p.year) !== "2025");
        }

        if (tableSearchText) {
            const lower = tableSearchText.toLowerCase();
            data = data.filter(r =>
                (r.schoolname?.toLowerCase().includes(lower)) ||
                (r.region?.toLowerCase().includes(lower)) ||
                (r.division?.toLowerCase().includes(lower)) ||
                (r.category?.toLowerCase().includes(lower))
            );
        }
        return data;
    }, [projectData, tableSearchText, latestClickKey]);

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col gap-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-1">Allocation and Completion Overview</h2>
                    <p className="text-gray-500 text-sm">Analyze structural resource distribution, project statuses, and completion rates.</p>
                </div>
                <div className="flex bg-white shadow-sm border border-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('allocation')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeView === 'allocation' ? 'bg-[#003366] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Allocation Overview
                    </button>
                    <button
                        onClick={() => setActiveView('completion')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeView === 'completion' ? 'bg-[#003366] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Completion Overview
                    </button>
                </div>
            </div>

            {/* Selected View Chart Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[400px]">
                {activeView === 'allocation' ? (
                    <>
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Building size={16} className="text-[#003366]" /> Allocation Overview</h3>
                        <div className="flex-1 w-full min-h-[350px]">
                            <Plot
                                data={allocationTraces.filter(t => t.y.some(v => v > 0))}
                                layout={{ ...layoutStyling, barmode: 'stack', hovermode: 'closest', annotations: allocationAnnotations }}
                                useResizeHandler
                                style={{ width: '100%', height: '100%' }}
                                onClick={(e) => handleChartClick(e, 'allocation')}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Pickaxe size={16} className="text-[#003366]" /> Average Completion Rate</h3>
                        <div className="flex-1 w-full min-h-[350px]">
                            <Plot
                                data={completionTraces}
                                layout={{ ...layoutStyling, barmode: 'group', yaxis: { title: 'Completion %', range: [0, 100] }, hovermode: 'closest' }}
                                useResizeHandler
                                style={{ width: '100%', height: '100%' }}
                                onClick={(e) => handleChartClick(e, 'completion')}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Drilldown Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Building size={16} className="text-[#003366]" />
                        Detailed Project Data for Selected Bar Segment
                    </h3>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative group max-w-sm w-full outline-none">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                <Search size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Filter Region, Division, School..."
                                value={tableSearchText}
                                onChange={(e) => setTableSearchText(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-[#003366] focus:border-[#003366] block pl-9 p-2 outline-none font-medium"
                            />
                        </div>

                        {latestClickKey && (
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                                    {latestClickKey.year} - {latestClickKey.category} ({latestClickKey.chartType})
                                </span>
                                <button
                                    onClick={() => setLatestClickKey(null)}
                                    className="text-xs font-bold text-red-600 hover:text-red-800 underline transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative border rounded-lg overflow-hidden">
                    {loadingProjects ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading Projects Data...</div>
                    ) : (
                        <DataTable
                            columns={[
                                { name: "Region", selector: row => row.region, sortable: true, width: '100px' },
                                { name: "Division", selector: row => row.division, sortable: true, width: '140px' },
                                { name: "School", selector: row => row.schoolname, sortable: true, wrap: true },
                                { name: "Year", selector: row => row.year, sortable: true, width: '80px', center: true },
                                { name: "Category", selector: row => row.category, sortable: true, width: '160px' },
                                {
                                    name: "Allocation",
                                    selector: row => row.allocation,
                                    sortable: true,
                                    right: true,
                                    width: '140px',
                                    cell: row => <span className="font-bold text-[#003366]">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(row.allocation)}</span>
                                },
                                {
                                    name: "Completion",
                                    selector: row => row.completion_rate,
                                    sortable: true,
                                    width: '120px',
                                    cell: row => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">
                                                {row.completion_rate !== null && row.completion_rate !== undefined
                                                    ? (Number(row.completion_rate).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 }))
                                                    : '0%'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 truncate">{row.completion_status || 'N/A'}</span>
                                        </div>
                                    )
                                }
                            ]}
                            data={filteredProjects}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 50]}
                            highlightOnHover
                            pointerOnHover
                            fixedHeader
                            noDataComponent={<div className="p-10 text-gray-400 font-medium">No projects found. Adjust your filters or click a chart to explore data.</div>}
                            customStyles={{
                                headRow: { style: { backgroundColor: '#fcfcfc', borderBottom: '1px solid #f1f5f9' } },
                                rows: { style: { minHeight: '52px', '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' } } }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Bottom Trend Line Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[400px]">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-[#003366]" /> Allocation Trend per Category per Funding Year</h3>
                <div className="flex-1 w-full min-h-[350px]">
                    <Plot
                        data={trendTraces.filter(t => t.y.some(v => v > 0))}
                        layout={{ ...layoutStyling, hovermode: 'closest' }}
                        useResizeHandler
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>

        </div>
    );
}
