"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Building, TrendingUp, Pickaxe, MapPin } from "lucide-react";
import DataTable from "react-data-table-component";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Charts...</div> });

const INFRA_COLORS = {
    "Repairs": "#FF69B4",
    "Gabaldon": "#22C55E",
    "New Construction": "#3B82F6",
    "Electrification": "#EAB308",
    "ALS-CLC": "#8B5CF6",
    "Wash WINS": "#06B6D4",
    "Classrooms": "#F97316"
};

export default function InfrastructureTab({ filters }) {
    const [infraData, setInfraData] = useState({
        summary: { totalProjects: 0 },
        yearlyData: {},
        loading: true
    });

    const [latestClickKey, setLatestClickKey] = useState(null);
    const [projectData, setProjectData] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        setInfraData(prev => ({ ...prev, loading: true }));
        fetch('/api/infra-data', {
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
        fetch('/api/infra-projects', {
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

    // Handle Report Generation Trigger
    useEffect(() => {
        if (filters.report_trigger && infraData.yearlyData) {
            const generateReport = async () => {
                const { generateHTMLReport } = await import("@/lib/reportGenerator");
                const subtitle = `Infrastructure Analysis - ${filters.infra_regions?.join(', ') || 'National'}`;

                const charts = [
                    {
                        title: "Total Allocation by Category",
                        data: allocationTraces.filter(t => t.y.some(v => v > 0)).map(t => ({
                            ...t,
                            x: t.y, // Swap x and y for horizontal
                            y: t.x,
                            orientation: 'h'
                        })),
                        layout: { barmode: 'stack', yaxis: { autorange: 'reversed' } }
                    },
                    {
                        title: "Allocation Trends",
                        data: trendTraces.filter(t => t.y.some(v => v > 0)).map(t => ({
                            ...t,
                            x: t.y,
                            y: t.x,
                            orientation: 'h'
                        })),
                        layout: { yaxis: { autorange: 'reversed' } }
                    },
                    {
                        title: "Average Completion Rate",
                        data: completionTraces.filter(t => t.y.some(v => v > 0)).map(t => ({
                            ...t,
                            x: t.y,
                            y: t.x,
                            orientation: 'h'
                        })),
                        layout: { barmode: 'group', yaxis: { autorange: 'reversed' }, xaxis: { title: 'Completion %' } }
                    }
                ];

                generateHTMLReport(
                    "Infrastructure Dashboard Report",
                    subtitle,
                    charts,
                    {
                        drill_level: "Infrastructure Dashboard",
                        regions: filters.infra_regions,
                        divisions: filters.infra_divisions,
                        filters: {
                            categories: filters.infra_categories,
                            summary: infraData.summary
                        }
                    }
                );
            };
            generateReport();
        }
    }, [filters.report_trigger]);

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
        font: { family: 'Inter, sans-serif' },
        margin: { t: 40, r: 20, b: 40, l: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true
    };

    const years = Object.keys(infraData.yearlyData).sort();
    const allCategories = new Set();
    years.forEach(y => {
        Object.keys(infraData.yearlyData[y].categories).forEach(c => allCategories.add(c));
    });

    const colors = ["#003366", "#FFB81C", "#CE1126", "#22C55E", "#3B82F6", "#EAB308", "#FF69B4"];
    const getColor = (c, i) => INFRA_COLORS[c] || colors[i % colors.length];

    const allocationTraces = [];
    const pipelineTraces = [];
    const completionTraces = [];
    const trendTraces = [];

    Array.from(allCategories).forEach((cat, i) => {
        const catColor = getColor(cat, i);

        // 1. Total Allocation
        allocationTraces.push({
            x: years,
            y: years.map(y => infraData.yearlyData[y].categories[cat]?.allocation || 0),
            name: cat,
            type: 'bar',
            marker: { color: catColor },
            hovertemplate: '<b>%{x}</b><br>%{y:$,.0f}<extra>%{data.name}</extra>'
        });

        // 2. Trend Allocation
        trendTraces.push({
            x: years,
            y: years.map(y => infraData.yearlyData[y].categories[cat]?.allocation || 0),
            name: cat,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: catColor, size: 6 },
            line: { width: 2 },
            hovertemplate: '<b>%{x}</b><br>%{y:$,.0f}<extra>%{data.name}</extra>'
        });

        // 3. Average Completion Rate (>= 2023 to show sample data)
        const recentYears = years.filter(y => parseInt(y) >= 2023);
        completionTraces.push({
            x: recentYears,
            y: recentYears.map(y => (infraData.yearlyData[y].categories[cat]?.completion || 0) * 100),
            name: cat,
            type: 'bar',
            marker: { color: catColor },
            hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra>%{data.name}</extra>'
        });

        // 4. Future Pipeline (>= 2026)
        const futureYears = years.filter(y => parseInt(y) >= 2026);
        pipelineTraces.push({
            x: futureYears,
            y: futureYears.map(y => infraData.yearlyData[y].categories[cat]?.allocation || 0),
            name: cat,
            type: 'bar',
            marker: { color: catColor },
            hovertemplate: '<b>%{x}</b><br>%{y:$,.0f}<extra>%{data.name}</extra>'
        });
    });

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/infra-data/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters, clickKey: latestClickKey })
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `STRIDE_Infra_Report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col gap-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-1">Infrastructure & Education Facilities</h2>
                    <p className="text-gray-500 text-sm">Analyze structural resource distribution, project statuses, and completion rates.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded shadow flex items-center gap-2 font-bold text-sm transition-colors disabled:opacity-50"
                >
                    <Building size={16} /> {isExporting ? 'EXPORTING...' : 'EXPORT CSV'}
                </button>
            </div>

            {/* Dynamic ValueBoxes */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                <div className="bg-[#003366] border border-[#002244] rounded-xl p-5 shadow-sm min-w-[200px] text-white flex-shrink-0">
                    <div className="text-xs font-bold uppercase text-[#FFB81C] mb-1">Total Active Projects</div>
                    <div className="text-3xl font-bold">{infraData.summary.totalProjects.toLocaleString()}</div>
                </div>
                {years.map(y => (
                    <div key={y} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm min-w-[200px] flex-shrink-0">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{y} Total Allocation</div>
                        <div className="text-2xl font-bold text-[#003366]">
                            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(infraData.yearlyData[y].total_allocation)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Total Allocation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[350px]">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Building size={16} className="text-[#003366]" /> Total Allocation</h3>
                    <div className="flex-1 w-full relative">
                        <Plot
                            data={allocationTraces.filter(t => t.y.some(v => v > 0))}
                            layout={{ ...layoutStyling, barmode: 'stack', hovermode: 'closest' }}
                            useResizeHandler
                            className="w-full h-full absolute inset-0"
                            onClick={(e) => handleChartClick(e, 'allocation')}
                        />
                    </div>
                </div>

                {/* Chart 2: Allocation Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[350px]">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-[#003366]" /> Allocation Trend</h3>
                    <div className="flex-1 w-full relative">
                        <Plot
                            data={trendTraces.filter(t => t.y.some(v => v > 0))}
                            layout={{ ...layoutStyling, hovermode: 'closest' }}
                            useResizeHandler
                            className="w-full h-full absolute inset-0"
                            onClick={(e) => handleChartClick(e, 'trend')}
                        />
                    </div>
                </div>

                {/* Chart 3: Completion Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[350px]">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Pickaxe size={16} className="text-[#003366]" /> Average Completion Rate</h3>
                    <div className="flex-1 w-full relative">
                        <Plot
                            data={completionTraces.filter(t => t.y.some(v => v > 0))}
                            layout={{ ...layoutStyling, barmode: 'group', yaxis: { title: 'Completion %', range: [0, 100] }, hovermode: 'closest' }}
                            useResizeHandler
                            className="w-full h-full absolute inset-0"
                            onClick={(e) => handleChartClick(e, 'completion')}
                        />
                    </div>
                </div>

                {/* Chart 4: Future Pipeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-[350px]">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Building size={16} className="text-[#003366]" /> Future Pipeline Projections</h3>
                    <div className="flex-1 w-full relative">
                        <Plot
                            data={pipelineTraces.filter(t => t.y.some(v => v > 0))}
                            layout={{ ...layoutStyling, barmode: 'stack', hovermode: 'closest' }}
                            useResizeHandler
                            className="w-full h-full absolute inset-0"
                            onClick={(e) => handleChartClick(e, 'pipeline')}
                        />
                    </div>
                </div>
            </div>

            {/* Drilldown Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Building size={16} className="text-[#003366]" />
                        Project Detail Drilldown
                    </h3>
                    {latestClickKey && (
                        <div className="flex items-center gap-4">
                            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                                Filtering: {latestClickKey.year} - {latestClickKey.category} ({latestClickKey.chartType})
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

                <div className="relative border rounded-lg overflow-hidden">
                    {loadingProjects ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading Projects Data...</div>
                    ) : (
                        <DataTable
                            columns={[
                                { name: "Region", selector: row => row.region, sortable: true, width: '100px' },
                                { name: "Division", selector: row => row.division, sortable: true, width: '150px' },
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
                                    name: "Status",
                                    selector: row => row.completion_status,
                                    sortable: true,
                                    width: '120px',
                                    cell: row => (
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${(row.completion_status || '').toLowerCase().includes('complet') ? 'bg-green-100 text-green-800' :
                                            (row.completion_status || '').toLowerCase().includes('ongo') ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {row.completion_status || 'Unknown'}
                                        </span>
                                    )
                                }
                            ]}
                            data={projectData}
                            pagination
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
        </div>
    );
}
