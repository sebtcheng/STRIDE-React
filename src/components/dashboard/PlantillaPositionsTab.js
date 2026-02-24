"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Users, UserPlus, UserCheck, AlertOctagon } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Chart Engine...</div> });

export default function PlantillaPositionsTab({ filters }) {
    const [data, setData] = useState({
        summary: { totalFilled: 0, totalUnfilled: 0, totalItems: 0, fillRate: 0 },
        chartData: { positions: [], filled: [], unfilled: [] },
        loading: true
    });

    useEffect(() => {
        const url = new URL(window.location.origin + "/api/plantilla-data");
        if (filters.region && filters.region !== "All Regions") url.searchParams.append("region", filters.region);
        if (filters.division) url.searchParams.append("division", filters.division);

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setData({ ...res.data, loading: false });
                }
            })
            .catch(err => console.error("Error fetching plantilla data:", err));
    }, [filters.region, filters.division]);

    const kpis = [
        { title: "Total National Items", value: data.summary.totalItems.toLocaleString(), icon: <Users className="text-[#003366]" />, color: "bg-blue-50 text-blue-800" },
        { title: "Filled Positions", value: data.summary.totalFilled.toLocaleString(), icon: <UserCheck className="text-green-600" />, color: "bg-green-50 text-green-800" },
        { title: "Unfilled Positions", value: data.summary.totalUnfilled.toLocaleString(), icon: <UserPlus className="text-orange-600" />, color: "bg-orange-50 text-orange-800" },
        { title: "National Fill Rate", value: `${data.summary.fillRate}%`, icon: <AlertOctagon className={data.summary.fillRate > 90 ? "text-green-600" : "text-red-500"} />, color: "bg-gray-50 text-gray-800" },
    ];

    const chartConfig = [
        {
            y: data.chartData.positions,
            x: data.chartData.filled,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#003366' },
            name: 'Filled'
        },
        {
            y: data.chartData.positions,
            x: data.chartData.unfilled,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#FFB81C' },
            name: 'Unfilled'
        }
    ];

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc]">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#003366] mb-1">Plantilla Item Deployment</h2>
                <p className="text-gray-500 text-sm">Real-time breakdown of filled versus unfilled national positions extracted from dfGMIS.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[#003366] transition-colors relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-3 rounded-bl-3xl ${kpi.color}`}>
                            {kpi.icon}
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide pr-8">{kpi.title}</p>
                    </div>
                ))}
            </div>

            {/* Main Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-[500px]">
                <h3 className="font-bold text-gray-800 mb-2">Top Volume Positions (Filled vs Gap)</h3>
                <div className="flex-1 min-h-0 relative w-full h-full">
                    <Plot
                        data={chartConfig}
                        layout={{
                            barmode: 'stack',
                            autosize: true,
                            margin: { l: 150, r: 20, t: 20, b: 40 },
                            font: { family: 'Inter, sans-serif' },
                            yaxis: { autorange: 'reversed' },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent'
                        }}
                        useResizeHandler
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}
