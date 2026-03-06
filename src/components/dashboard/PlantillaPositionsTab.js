"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Users, UserPlus, UserCheck, AlertOctagon, ArrowLeft } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Chart Engine...</div> });

export default function PlantillaPositionsTab({ filters, drillDown, goBack }) {
    const [data, setData] = useState({
        positionsData: [],
        groupingLevel: "Region",
        loading: true
    });

    useEffect(() => {
        const url = new URL(window.location.origin + "/api/plantilla-data");

        if (filters.drillLevel === "Region" || filters.drillLevel === "Division" || filters.drillLevel === "DistrictGroup") {
            if (filters.region && filters.region !== "All Regions") {
                url.searchParams.append("region", filters.region);
            }
            if (filters.division) {
                url.searchParams.append("division", filters.division);
            }
        }

        const selected = filters.selected_positions || [];
        if (selected.length === 0) {
            setData({ positionsData: [], groupingLevel: "Region", loading: false });
            return;
        }

        selected.forEach(pos => url.searchParams.append("positions", pos));

        setData(prev => ({ ...prev, loading: true }));
        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setData({ ...res.data, loading: false });
                } else {
                    setData(prev => ({ ...prev, loading: false }));
                }
            })
            .catch(err => {
                console.error("Error fetching plantilla data:", err);
                setData(prev => ({ ...prev, loading: false }));
            });
    }, [filters.region, filters.division, filters.selected_positions, filters.drillLevel]);

    // Handle Report Generation Trigger
    useEffect(() => {
        if (filters.report_trigger && data.positionsData && data.positionsData.length > 0) {
            const generateReport = async () => {
                const { generateHTMLReport } = await import("@/lib/reportGenerator");
                const subtitle = `Plantilla Position Breakdown - ${filters.drillLevel} Scope`;

                const charts = data.positionsData.map(posData => {
                    const textLabels = posData.chartData.groupings.map((g, i) => {
                        const total = posData.chartData.filled[i] + posData.chartData.unfilled[i];
                        const rate = total > 0 ? ((posData.chartData.filled[i] / total) * 100).toFixed(1) : 0;
                        return `${total.toLocaleString()} (${rate}%)`;
                    });

                    return {
                        title: posData.position,
                        data: [
                            {
                                y: posData.chartData.groupings,
                                x: posData.chartData.filled,
                                type: 'bar',
                                orientation: 'h',
                                marker: { color: '#003366' },
                                name: 'Filled'
                            },
                            {
                                y: posData.chartData.groupings,
                                x: posData.chartData.unfilled,
                                type: 'bar',
                                orientation: 'h',
                                marker: { color: '#FFB81C' },
                                name: 'Unfilled',
                                text: textLabels,
                                textposition: 'outside',
                                cliponaxis: false
                            }
                        ],
                        layout: {
                            barmode: 'stack',
                            yaxis: { autorange: 'reversed', automargin: true }
                        }
                    };
                });

                generateHTMLReport(
                    "Plantilla Positions Report",
                    subtitle,
                    charts,
                    {
                        region: filters.region,
                        division: filters.division,
                        drill_level: filters.drillLevel,
                        filters: {
                            positions: filters.selected_positions
                        }
                    }
                );
            };
            generateReport();
        }
    }, [filters.report_trigger, data.positionsData]);

    const handleChartClick = (name, groupingLevel) => {
        if (!name) return;
        const clickedName = String(name).trim();

        if (groupingLevel === "Region") {
            drillDown("Region", clickedName, "region");
        } else if (groupingLevel === "Division") {
            drillDown("Division", clickedName, "division");
        }
    };

    if (data.loading) {
        return <div className="p-6 flex items-center justify-center h-full text-gray-500">Loading Plantilla Data...</div>;
    }

    if (!data.positionsData || data.positionsData.length === 0) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center bg-[#f8fafc]">
                <AlertOctagon size={48} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-500">No Positions Selected</h2>
                <p className="text-sm text-gray-400 mt-2">Use the Sidebar Controls to select Plantilla positions to analyze.</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-1">Plantilla Item Deployment</h2>
                    <p className="text-gray-500 text-sm">Real-time breakdown of filled versus unfilled national positions across {data.groupingLevel}s.</p>
                </div>
                {filters.drillLevel !== 'National' && (
                    <button
                        onClick={goBack}
                        className="flex items-center gap-2 bg-[#CE1126] hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-sm font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} /> GO BACK
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.positionsData.map((posData, idx) => (
                    <PositionCard
                        key={idx}
                        posData={posData}
                        groupingLevel={data.groupingLevel}
                        onChartClick={(name) => handleChartClick(name, data.groupingLevel)}
                    />
                ))}
            </div>
        </div>
    );
}

function PositionCard({ posData, groupingLevel, onChartClick }) {
    const kpis = [
        { title: "Total Items", value: posData.summary.totalItems.toLocaleString(), icon: <Users className="text-[#003366]" />, color: "bg-blue-50 text-blue-800" },
        { title: "Filled Positions", value: posData.summary.totalFilled.toLocaleString(), icon: <UserCheck className="text-green-600" />, color: "bg-green-50 text-green-800" },
        { title: "Unfilled Positions", value: posData.summary.totalUnfilled.toLocaleString(), icon: <UserPlus className="text-orange-600" />, color: "bg-orange-50 text-orange-800" },
        { title: "Efficiency Rate", value: `${posData.summary.fillRate}%`, icon: <AlertOctagon className={posData.summary.fillRate > 90 ? "text-green-600" : "text-red-500"} />, color: "bg-gray-50 text-gray-800" },
    ];

    const textLabels = posData.chartData.groupings.map((g, i) => {
        const total = posData.chartData.filled[i] + posData.chartData.unfilled[i];
        const rate = total > 0 ? ((posData.chartData.filled[i] / total) * 100).toFixed(1) : 0;
        return `${total.toLocaleString()} (${rate}%)`;
    });

    const chartConfig = [
        {
            y: posData.chartData.groupings,
            x: posData.chartData.filled,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#003366' },
            name: 'Filled'
        },
        {
            y: posData.chartData.groupings,
            x: posData.chartData.unfilled,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#FFB81C' },
            name: 'Unfilled',
            text: textLabels,
            textposition: 'outside',
            cliponaxis: false
        }
    ];

    const maxChartHeight = Math.max(300, posData.chartData.groupings.length * 40);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#003366] text-white px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-lg uppercase tracking-wide">{posData.position}</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded font-medium tracking-widest">{groupingLevel.toUpperCase()} BREAKDOWN</span>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg border border-gray-100 p-4 hover:border-blue-200 transition-colors relative overflow-hidden">
                            <div className={`absolute top-0 right-0 p-2 rounded-bl-xl ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                            <h4 className="text-2xl font-bold text-gray-900">{kpi.value}</h4>
                        </div>
                    ))}
                </div>

                <div
                    className="w-full relative overflow-y-auto pr-1"
                    style={{ height: `${maxChartHeight}px`, pointerEvents: 'auto', cursor: 'pointer' }}
                    onClickCapture={(e) => {
                        let clickedName = window._hoveredPoint;

                        // Fallback: forcefully read the Plotly tooltip from the DOM if event failed
                        if (!clickedName) {
                            try {
                                const plotContainer = e.currentTarget.querySelector('.js-plotly-plot');
                                if (plotContainer) {
                                    const hoverLayers = plotContainer.querySelectorAll('g.hovertext text');
                                    const sortedLabels = [...posData.chartData.groupings].sort((a, b) => b.length - a.length);

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
                            window._hoveredPoint = null;
                            onChartClick(clickedName);
                        }
                    }}
                >
                    <Plot
                        data={chartConfig}
                        layout={{
                            barmode: 'stack',
                            autosize: true,
                            margin: { l: 150, r: 90, t: 10, b: 40 },
                            font: { family: 'Inter, sans-serif' },
                            yaxis: { autorange: 'reversed', tickfont: { size: 10 } },
                            xaxis: { title: 'Number of Positions' },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            showlegend: true,
                            legend: { orientation: 'h', y: -0.15, x: 0.5, xanchor: 'center' },
                            dragmode: false,
                            hovermode: 'closest'
                        }}
                        useResizeHandler
                        className="w-full h-full"
                        config={{ displayModeBar: false, doubleClick: false, responsive: true }}
                        onHover={(event) => {
                            if (event.points && event.points.length > 0) {
                                if (window._hoverTimer) clearTimeout(window._hoverTimer);
                                window._hoveredPoint = String(event.points[0].label || event.points[0].y || event.points[0].text || '').trim();
                            }
                        }}
                        onUnhover={() => {
                            if (window._hoverTimer) clearTimeout(window._hoverTimer);
                            window._hoverTimer = setTimeout(() => {
                                window._hoveredPoint = null;
                            }, 500);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
