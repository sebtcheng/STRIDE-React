"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Building, MapPin } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Charts...</div> });

export default function InfrastructureTab({ filters }) {
    const [infraData, setInfraData] = useState({
        allocation: { categories: [], funded: [], unfunded: [] },
        completion: [0, 0, 0],
        trend: { years: [], values: [] },
        summary: { totalProjects: 0 },
        loading: true
    });

    useEffect(() => {
        const regionParam = filters.region || 'All Regions';
        fetch(`/api/infra-data?region=${encodeURIComponent(regionParam)}`)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setInfraData({ ...res.data, loading: false });
                }
            })
            .catch(err => console.error("Error fetching EFD infra data:", err));
    }, [filters.region]);

    const layoutStyling = {
        font: { family: 'Inter, sans-serif' },
        margin: { t: 40, r: 20, b: 60, l: 40 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true
    };

    const allocationData = [
        {
            x: infraData.allocation.categories,
            y: infraData.allocation.funded,
            type: 'bar',
            marker: { color: '#003366' },
            name: 'Funded'
        },
        {
            x: infraData.allocation.categories,
            y: infraData.allocation.unfunded,
            type: 'bar',
            marker: { color: '#FFB81C' },
            name: 'Unfunded Needs'
        }
    ];

    const completionData = [{
        values: infraData.completion,
        labels: ['Completed', 'Ongoing', 'Delayed'],
        type: 'pie',
        hole: 0.5,
        marker: { colors: ['#003366', '#FFB81C', '#CE1126'] }
    }];

    const trendData = [
        {
            x: infraData.trend.years,
            y: infraData.trend.values,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Budget Allocation (Millions)',
            marker: { color: '#003366', size: 8 },
            line: { shape: 'spline', width: 3 }
        }
    ];

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col">
            <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-1">Infrastructure & Education Facilities</h2>
                    <p className="text-gray-500 text-sm">Analyze structural resource distribution, project statuses, and historical funding trends.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
                {/* Left Column - Allocations */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-[400px]">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Building size={18} className="text-[#003366]" /> Allocation Overview</h3>
                        <div className="flex-1 min-h-0 relative w-full h-full">
                            <Plot data={allocationData} layout={{ ...layoutStyling, barmode: 'stack' }} useResizeHandler className="w-full h-full" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full">
                        <h3 className="font-bold text-gray-800 mb-2">Funding Trends (5-Year Historical)</h3>
                        <div className="flex-1 min-h-0 relative w-full h-full">
                            <Plot data={trendData} layout={layoutStyling} useResizeHandler className="w-full h-full" />
                        </div>
                    </div>
                </div>

                {/* Right Column - Status */}
                <div className="flex flex-col gap-6 h-full min-h-[400px]">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-1/2">
                        <h3 className="font-bold text-gray-800 mb-2">Project Completion Overview</h3>
                        <div className="flex-1 min-h-0 relative w-full h-full flex justify-center">
                            <Plot data={completionData} layout={{ ...layoutStyling, showlegend: true, legend: { orientation: 'h', y: -0.2 } }} useResizeHandler className="w-full h-full" />
                        </div>
                    </div>

                    <div className="bg-[#003366] rounded-xl shadow-sm border border-[#002244] p-6 text-white h-1/2 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10 p-4">
                            <Building size={120} />
                        </div>
                        <h3 className="font-bold text-[#FFB81C] mb-2 relative z-10">System Alert</h3>
                        <p className="text-sm text-gray-200 mb-4 relative z-10">45 projects in {filters.region === 'All Regions' ? 'National Scope' : filters.region} are flagged for severe delay due to extreme weather constraints.</p>
                        <button className="bg-white text-[#003366] hover:bg-gray-100 px-4 py-2 rounded font-bold text-sm self-start transition-colors relative z-10 shadow-md">
                            View Flagged Projects
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
