"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, Info, MapPin, Loader2, Database, BarChart2, ArrowLeft, Download, X } from "lucide-react";
import SchoolProfileModal from "./SchoolProfileModal";
import useIsMobile from "@/hooks/useIsMobile";

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
    const [mapSearchText, setMapSearchText] = useState("");

    const isMobile = useIsMobile();

    useEffect(() => {
        const executeQuery = async () => {
            if (!filters.aa_variables || filters.aa_variables.length === 0) return;

            setLoading(true);
            setHasQueried(true);
            try {
                const req = await fetch('/stride-api/advanced-analytics', {
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

    const downloadCSV = async () => {
        if (!filters.aa_variables || filters.aa_variables.length === 0) return;
        try {
            const req = await fetch('/stride-api/advanced-analytics/export-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variables: filters.aa_variables,
                    region: filters.region,
                    division: filters.division,
                    municipality: filters.municipality
                })
            });
            if (!req.ok) throw new Error("Failed to export CSV");

            const blob = await req.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `STRIDE_AdvancedAnalytics_RawDB_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error("CSV Download Failed:", e);
            alert("Failed to download CSV.");
        }
    };

    const downloadReport = async () => {
        if (!graphData) return;
        try {
            const req = await fetch('/stride-api/advanced-analytics/export-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    graphData,
                    filters,
                    total,
                    totalEntries
                })
            });
            if (!req.ok) throw new Error("Failed to export Report");

            const blob = await req.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `STRIDE_AdvancedAnalytics_Report_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error("Report Download Failed:", e);
            alert("Failed to download Report.");
        }
    };

    const handleMarkerClick = async (school) => {
        setSelectedModalSchool(school);
        setIsModalOpen(true);
        setLoadingProfile(true);
        setFullProfile(null);
        try {
            const res = await fetch(`/stride-api/school-profile/${school.id}`);
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
                <div className={`p-4 border-b border-gray-100 flex ${isMobile ? 'flex-col gap-4' : 'flex-row justify-between items-center'} bg-gray-50/50`}>
                    <div className={`flex items-start gap-2 ${isMobile ? 'w-full' : ''}`}>
                        {filters.history && filters.history.length > 0 && goBack && (
                            <button
                                onClick={goBack}
                                className="mt-0.5 p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0"
                                title="Go Back"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div className="flex flex-col">
                            <h3 className="font-bold text-[#003366] text-xs xs:text-sm flex items-center gap-2">
                                <Search size={isMobile ? 14 : 16} />
                                <span>Filtered Analytics:</span>
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-blue-600 font-black text-xl leading-none">{Number(total).toLocaleString()}</span>
                                <span className="text-gray-300">/</span>
                                <span className="text-gray-500 text-[9px] font-bold uppercase tracking-tight">
                                    {Number(totalEntries).toLocaleString()} {isMobile ? "Total" : "Total Entries"}
                                </span>
                                {totalEntries > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center transition-all ml-1">
                                        {((total / totalEntries) * 100).toFixed(1)}% <span className="hidden xs:inline ml-1">OF DB</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 ${isMobile ? 'justify-between border-t border-gray-100 pt-3 w-full' : ''}`}>
                        {hasQueried && !loading && results.length > 0 && (
                            <>
                                <button
                                    onClick={downloadReport}
                                    className={`bg-white hover:bg-gray-100 text-[#003366] ${isMobile ? 'flex-1 justify-center' : 'px-3'} py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all`}
                                >
                                    <BarChart2 size={16} /> {!isMobile && "Export Report"}
                                </button>
                                <button
                                    onClick={downloadCSV}
                                    className={`bg-[#003366] hover:bg-[#002244] text-white ${isMobile ? 'flex-1 justify-center' : 'px-3'} py-2 rounded-xl shadow-md shadow-blue-900/10 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all`}
                                >
                                    <Download size={16} /> {!isMobile && "Export CSV"}
                                </button>
                            </>
                        )}
                        {loading && (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-2 rounded-full border border-blue-100 animate-pulse">
                                <Loader2 size={14} className="animate-spin" /> Querying...
                            </div>
                        )}
                    </div>
                </div>

                {hasQueried && !loading && results.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-20">
                        <Info size={32} className="mb-4 text-gray-300" />
                        <p className="font-bold">No schools matched your criteria.</p>
                        <p className="text-[10px] mt-2">Try widening the Min/Max thresholds or adding more Categorical variants.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                        <div className="flex px-4 pt-4 border-b border-gray-200 gap-6 bg-white shrink-0">
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`pb-2 text-xs xs:text-sm font-black uppercase tracking-wider border-b-2 transition-all ${viewMode === 'graph' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                {isMobile ? "Table View" : "Graphical Summary View"}
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`pb-2 text-xs xs:text-sm font-black uppercase tracking-wider border-b-2 transition-all ${viewMode === 'table' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                {isMobile ? "Map View" : "Raw Database Table"}
                            </button>
                        </div>

                        {/* Tab 1 Content: Graph (Desktop) or Table (Mobile) */}
                        {viewMode === 'graph' && (
                            isMobile ? (
                                <div className="flex-1 overflow-hidden flex flex-col">
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
                            ) : (
                                graphData && graphData.values && graphData.values.length > 0 && (
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
                                            style={{ pointerEvents: 'auto' }}
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
                                                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
                                                    onClick={(event) => {
                                                        if (loading) return;
                                                        if (event.points && event.points.length > 0) {
                                                            const clickedName = String(event.points[0].label || event.points[0].y || '').trim();
                                                            console.log("Plotly Native Click Resolved (AA):", clickedName);

                                                            if (clickedName && drillDown) {
                                                                if (filters.municipality) {
                                                                    // Already at municipality level
                                                                } else if (filters.division) {
                                                                    drillDown('DistrictGroup', clickedName, 'municipality');
                                                                } else if (filters.region && filters.region !== 'All Regions') {
                                                                    drillDown('Division', clickedName);
                                                                } else {
                                                                    drillDown('Region', clickedName);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            )
                        )}

                        {/* Table Tab */}
                        {/* Table & Map Split View */}
                        {viewMode === 'table' && (
                            <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
                                {/* Left: Table (Hidden on Mobile unless user wants it, but here we replace it with Map) */}
                                <div className={`${isMobile ? 'hidden' : 'w-full lg:w-1/2 flex flex-col border-r border-gray-100 min-h-0 overflow-hidden'}`}>
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

                                {/* Right: Map (Full screen on mobile) */}
                                <div className={`flex-1 bg-gray-50 relative min-h-0 h-full ${isMobile ? 'flex flex-col' : 'hidden lg:block lg:w-1/2'}`}>
                                    {/* Mobile Search Overlay */}
                                    {isMobile && (
                                        <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Search school to zoom..."
                                                    className="w-full pl-9 pr-4 py-2 text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                                    value={mapSearchText}
                                                    onChange={e => setMapSearchText(e.target.value)}
                                                />
                                                {mapSearchText && (
                                                    <button
                                                        onClick={() => setMapSearchText("")}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Top 3 Results for Mobile Map Search */}
                                            {mapSearchText && (
                                                <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                                    {filteredResults
                                                        .filter(s => s.name.toLowerCase().includes(mapSearchText.toLowerCase()) || String(s.schoolid).includes(mapSearchText))
                                                        .slice(0, 3)
                                                        .map(school => (
                                                            <div
                                                                key={school.schoolid}
                                                                onClick={() => {
                                                                    handleRowClick(school);
                                                                    setMapSearchText("");
                                                                }}
                                                                className="p-3 hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer flex flex-col gap-0.5"
                                                            >
                                                                <div className="font-black text-[11px] text-[#003366] leading-tight truncate">
                                                                    {school.name}
                                                                </div>
                                                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                                                    ID: {school.schoolid} | {school.division}
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                    {filteredResults.filter(s => s.name.toLowerCase().includes(mapSearchText.toLowerCase()) || String(s.schoolid).includes(mapSearchText)).length === 0 && (
                                                        <div className="p-3 text-[10px] text-gray-400 font-bold text-center italic">No schools found in current filter</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <DynamicMap
                                        selectedSchool={selectedSchool ? { ...selectedSchool, id: selectedSchool.schoolid } : null}
                                        activeSchools={mapPoints}
                                        onMarkerClick={handleMarkerClick}
                                    />

                                    {!selectedSchool && mapPoints.length > 0 && !isMobile && (
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
