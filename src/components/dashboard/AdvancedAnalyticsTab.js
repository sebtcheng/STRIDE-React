"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, Info, MapPin, Loader2, Database, BarChart2, ArrowLeft } from "lucide-react";
import SchoolProfileModal from "./SchoolProfileModal";

const DynamicMap = dynamic(
    () => import('./SchoolLocatorMapInner'),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse text-[#003366] font-bold text-xs uppercase tracking-widest">Loading Map Engine...</div> }
);

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading Chart Engine...</div> });

export default function AdvancedAnalyticsTab({ filters, drillDown, goBack }) {
    const [results, setResults] = useState([]);
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [hasQueried, setHasQueried] = useState(false);
    const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'table'
    const [columnFilters, setColumnFilters] = useState({});
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalSchool, setSelectedModalSchool] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    useEffect(() => {
        const executeQuery = async () => {
            if (!filters.aa_variables || filters.aa_variables.length === 0) return;

            setLoading(true);
            setHasQueried(true);
            try {
                const req = await fetch('/api/advanced-analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variables: filters.aa_variables,
                        region: filters.region,
                        division: filters.division,
                        municipality: filters.municipality
                    })
                });
                const res = await req.json();

                if (res.status === "success") {
                    setResults(res.data.rows || []);
                    setTotal(res.data.totalMatched || 0);
                    setTotalEntries(res.data.totalEntries || 0);
                    setGraphData(res.data.graphData || null);
                }
            } catch (e) {
                console.error("Advanced Analytics Matrix failed:", e);
            } finally {
                setLoading(false);
            }
        };

        if (filters.aa_trigger) {
            executeQuery();
        }
    }, [filters.aa_trigger, filters.aa_variables, filters.region, filters.division, filters.municipality]);

    const filteredResults = useMemo(() => {
        return results.filter(row => {
            return Object.keys(columnFilters).every(key => {
                const filterVal = columnFilters[key].toLowerCase();
                if (!filterVal) return true;
                const rowVal = String(row[key] || '').toLowerCase();
                return rowVal.includes(filterVal);
            });
        });
    }, [results, columnFilters]);

    const columns = useMemo(() => [
        {
            name: (
                <div className="flex flex-col gap-1.5 py-2 w-full">
                    <span className="font-bold text-[#003366] text-[11px] uppercase tracking-wider">School ID</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-2 py-1 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-gray-700 bg-white/80"
                        onClick={(e) => e.stopPropagation()}
                        value={columnFilters.schoolid || ''}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, schoolid: e.target.value }))}
                    />
                </div>
            ),
            selector: (row) => row.schoolid,
            sortable: true,
            width: "125px"
        },
        {
            name: (
                <div className="flex flex-col gap-1.5 py-2 w-full">
                    <span className="font-bold text-[#003366] text-[11px] uppercase tracking-wider">School Name</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-2 py-1 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-gray-700 bg-white/80"
                        onClick={(e) => e.stopPropagation()}
                        value={columnFilters.name || ''}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>
            ),
            selector: (row) => row.name,
            sortable: true,
            grow: 2
        },
        {
            id: "division",
            name: (
                <div className="flex flex-col gap-1.5 py-2 w-full">
                    <span className="font-bold text-[#003366] text-[11px] uppercase tracking-wider">Division</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-2 py-1 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-gray-700 bg-white/80"
                        onClick={(e) => e.stopPropagation()}
                        value={columnFilters.division || ''}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, division: e.target.value }))}
                    />
                </div>
            ),
            selector: (row) => row.division,
            sortable: true
        },
        {
            name: (
                <div className="flex flex-col gap-1.5 py-2 w-full">
                    <span className="font-bold text-[#003366] text-[11px] uppercase tracking-wider">Municipality</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-2 py-1 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-gray-700 bg-white/80"
                        onClick={(e) => e.stopPropagation()}
                        value={columnFilters.municipality || ''}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, municipality: e.target.value }))}
                    />
                </div>
            ),
            selector: (row) => row.municipality,
            sortable: true
        },
        {
            name: (
                <div className="flex flex-col gap-1.5 py-2 w-full">
                    <span className="font-bold text-[#003366] text-[11px] uppercase tracking-wider">Sector Type</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-2 py-1 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-gray-700 bg-white/80"
                        onClick={(e) => e.stopPropagation()}
                        value={columnFilters.school_type || ''}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, school_type: e.target.value }))}
                    />
                </div>
            ),
            selector: (row) => row.school_type || 'Unknown',
            sortable: true
        }
    ], [columnFilters]);

    const handleRowClick = (row) => setSelectedSchool(row);

    const handleMarkerClick = async (school) => {
        setSelectedModalSchool(school);
        setIsModalOpen(true);
        setLoadingProfile(true);
        setFullProfile(null);
        try {
            const res = await fetch(`/api/school-profile/${school.id}`);
            const data = await res.json();
            if (data.status === "success") {
                setFullProfile(data.data);
            }
        } catch (e) {
            console.error("Profile fetch failed:", e);
        } finally {
            setLoadingProfile(false);
        }
    };

    const mapPoints = useMemo(() => {
        return filteredResults.map(r => ({
            id: r.schoolid,
            name: r.name,
            lat: r.lat,
            lng: r.lng,
            region: r.region,
            division: r.division,
            municipality: r.municipality
        }));
    }, [filteredResults]);

    if (!filters.aa_variables || filters.aa_variables.length === 0) {
        return (
            <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-12 justify-center items-center">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center justify-center text-gray-400 max-w-2xl text-center shadow-sm">
                    <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <Database size={48} className="opacity-20 text-[#003366]" />
                    </div>
                    <p className="font-black text-2xl text-gray-800 mb-2">Advanced Matrix Analytics</p>
                    <p className="text-sm font-medium">Use the left sidebar to add custom filters like Enrolment numbers or Resource Shortages to query the entire database.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-[#003366] text-sm flex items-center gap-2">
                        {filters.history && filters.history.length > 0 && goBack && (
                            <button
                                onClick={goBack}
                                className="mr-2 p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                                title="Go Back"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <Search size={16} />
                        <span className="flex items-center gap-1.5 ml-1">
                            Filtered Analytics:
                            <span className="text-blue-600 font-black">{Number(total).toLocaleString()}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-500">{Number(totalEntries).toLocaleString()} Total Entries</span>
                            {totalEntries > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                    {((total / totalEntries) * 100).toFixed(2)}% of Database
                                </span>
                            )}
                        </span>
                    </h3>
                    {loading && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            <Loader2 size={12} className="animate-spin" /> Querying Dataset...
                        </div>
                    )}
                </div>

                {hasQueried && !loading && results.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-20">
                        <Info size={32} className="mb-4 text-gray-300" />
                        <p className="font-bold">No schools matched your criteria.</p>
                        <p className="text-[10px] mt-2">Try widening the Min/Max thresholds or adding more Categorical variants.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                        {/* Tab Headers */}
                        <div className="flex px-4 pt-4 border-b border-gray-200 gap-4 bg-white">
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'graph' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                Graphical Summary View
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'table' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                Raw Database Table
                            </button>
                        </div>

                        {/* Graph Tab */}
                        {viewMode === 'graph' && graphData && graphData.values && graphData.values.length > 0 && (
                            <div className="flex-1 p-6 relative flex flex-col min-h-0">
                                <div className="flex items-center gap-2 mb-4 text-[#003366]">
                                    <BarChart2 size={20} />
                                    <h4 className="font-black text-lg">{graphData.title}</h4>
                                </div>
                                <div className="mb-4 bg-blue-50 p-3 rounded text-sm text-[#003366] font-medium border border-blue-100 flex items-center gap-2">
                                    <Info size={16} className="shrink-0" />
                                    <span>Click on any bar representing a geographic unit to drill down and filter the dataset further.</span>
                                </div>
                                <div
                                    className="flex-1 relative w-full pr-4 overflow-y-auto custom-scrollbar"
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
                                                    const sortedLabels = [...(graphData.labels || [])].sort((a, b) => b.length - a.length);

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

                                        if (clickedName && drillDown) {
                                            window._hoveredPoint = null; // Consume it immediately

                                            if (filters.municipality) {
                                                // If already drilled down to municipality level, typically we don't drill down further geopolitically
                                            } else if (filters.division) {
                                                drillDown('DistrictGroup', clickedName, 'municipality');
                                            } else if (filters.region && filters.region !== 'All Regions') {
                                                drillDown('Division', clickedName);
                                            } else {
                                                drillDown('Region', clickedName);
                                            }
                                        }
                                    }}
                                >
                                    <div style={{ height: `${Math.max(300, (graphData.values?.length || 0) * 40)}px`, position: 'relative', width: '100%' }}>
                                        <Plot
                                            data={[{
                                                y: graphData.labels,
                                                x: graphData.values,
                                                type: 'bar',
                                                orientation: 'h',
                                                text: graphData.values.map(v => v.toLocaleString()),
                                                textposition: 'outside',
                                                insidetextanchor: 'end',
                                                cliponaxis: false,
                                                textfont: {
                                                    family: 'Inter, sans-serif',
                                                    size: 11,
                                                    color: '#475569'
                                                },
                                                marker: {
                                                    color: '#0066CC',
                                                    opacity: 0.95
                                                }
                                            }]}
                                            layout={{
                                                font: { family: 'Inter, sans-serif', color: '#475569', size: 11 },
                                                paper_bgcolor: 'transparent',
                                                plot_bgcolor: 'transparent',
                                                autosize: true,
                                                showlegend: false,
                                                margin: { t: 5, r: 80, b: 35, l: 20 },
                                                hovermode: 'closest',
                                                dragmode: false,
                                                xaxis: {
                                                    visible: false,
                                                    range: [0, Math.max(...graphData.values) * 1.25]
                                                },
                                                yaxis: {
                                                    autorange: 'reversed',
                                                    automargin: true,
                                                    tickmode: 'linear',
                                                    dtick: 1
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
                        )}

                        {/* Table Tab */}
                        {/* Table & Map Split View */}
                        {viewMode === 'table' && (
                            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                                {/* Left: Table */}
                                <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-100 min-h-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto">
                                        <DataTable
                                            keyField="schoolid"
                                            columns={columns}
                                            data={filteredResults}
                                            highlightOnHover
                                            pointerOnHover
                                            pagination
                                            fixedHeader
                                            persistTableHead
                                            onRowClicked={handleRowClick}
                                            progressPending={loading}
                                            defaultSortFieldId="division"
                                            customStyles={{
                                                headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', minHeight: '80px' } },
                                                rows: { style: { minHeight: '52px', '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' } } }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Right: Map */}
                                <div className="hidden lg:block lg:w-1/2 bg-gray-50 relative min-h-0 h-full">
                                    <DynamicMap
                                        selectedSchool={selectedSchool ? { ...selectedSchool, id: selectedSchool.schoolid } : null}
                                        activeSchools={mapPoints}
                                        onMarkerClick={handleMarkerClick}
                                    />
                                    {!selectedSchool && mapPoints.length > 0 && (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-blue-100 shadow-sm text-[10px] font-bold text-[#003366] flex items-center gap-2">
                                            <MapPin size={12} /> Click a school row to center map
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SchoolProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                school={selectedModalSchool}
                fullProfile={fullProfile}
                loadingProfile={loadingProfile}
            />



            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
