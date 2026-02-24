"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Users, FileUser, CheckSquare } from "lucide-react";

// Plotly dynamically loaded
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading HR Analytics Engine...</div> });

export default function HRTrackingTab() {
    const [selectedTitles, setSelectedTitles] = useState(["Teacher I-III"]);

    const jobTitles = ["Teacher I-III", "Master Teacher", "Principal", "Admin Officer"];

    const toggleTitle = (title) => {
        setSelectedTitles(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const layoutStyling = {
        font: { family: 'Inter, sans-serif' },
        margin: { t: 40, r: 20, b: 60, l: 40 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        autosize: true
    };

    // Mock data changing based on selection
    const fillRateData = selectedTitles.length > 0 ? [
        {
            x: ['Region I', 'Region II', 'Region III', 'CALABARZON', 'MIMAROPA'],
            y: [85, 90, 78, 92, 88].map(y => y - (selectedTitles.length * 2)), // simulate reactivity
            type: 'bar',
            marker: { color: '#003366' },
            name: 'Filled Positions'
        },
        {
            x: ['Region I', 'Region II', 'Region III', 'CALABARZON', 'MIMAROPA'],
            y: [15, 10, 22, 8, 12].map(y => y + (selectedTitles.length * 2)),
            type: 'bar',
            marker: { color: '#FFB81C' },
            name: 'Unfilled Positions'
        }
    ] : [];

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-1">HR / Plantilla Positions Tracker</h2>
                    <p className="text-gray-500 text-sm">Monitor job positions, filling-up rates, and staffing shortages dynamically.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Left Filters Pane */}
                <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col shrink-0">
                    <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <Users size={18} className="text-[#003366]" /> Filter Job Titles
                    </h3>
                    <div className="space-y-3">
                        {jobTitles.map((title) => (
                            <label key={title} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#003366] rounded border-gray-300 focus:ring-[#003366]"
                                    checked={selectedTitles.includes(title)}
                                    onChange={() => toggleTitle(title)}
                                />
                                <span className="text-sm font-medium text-gray-700">{title}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                            <FileUser className="text-[#003366] shrink-0 mt-1" size={20} />
                            <div>
                                <strong className="block text-sm text-[#003366]">Total Authorized Plantilla</strong>
                                <span className="text-2xl font-bold text-gray-900 mt-1 block">942,105</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Dynamic UI Data pane */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6 h-full">
                    {/* Top Quick Stats based on selection */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-l-[#003366]">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Selected Filling-Up Rate</h4>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{90 - (selectedTitles.length)}%</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-l-[#FFB81C]">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Vacant Positions</h4>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{(selectedTitles.length * 1540).toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-l-[#CE1126]">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Critical Needs Regions</h4>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{selectedTitles.includes("Principal") ? 3 : 1}</p>
                        </div>
                    </div>

                    {/* Filling Rate Chart */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-5 min-h-0 flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-2">Plantilla Filling-Up Rates by Region</h3>
                        {selectedTitles.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                                <CheckSquare size={48} className="mb-4 opacity-50" />
                                <p>Select at least one job title to generate analytics</p>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 relative w-full h-full">
                                <Plot data={fillRateData} layout={{ ...layoutStyling, barmode: 'stack', legend: { orientation: 'h', y: -0.2 } }} useResizeHandler className="w-full h-full" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
