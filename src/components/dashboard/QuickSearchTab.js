"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Search, MapPin, Download, Filter, Settings2, Loader2, Building2, Users, Building, AlertTriangle, AlertCircle, CheckSquare, Database, Info, X } from "lucide-react";
import dynamic from "next/dynamic";
import SchoolProfileModal from "./SchoolProfileModal";
import useIsMobile from "@/hooks/useIsMobile";

const SchoolPreviewMap = dynamic(() => import("./SchoolPreviewMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map Engine...</div>
});

export default function QuickSearchTab({ filters, setFilters }) {
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [totalMatches, setTotalMatches] = useState(0);
    const [filterText, setFilterText] = useState("");
    const [columnFilters, setColumnFilters] = useState({
        region: "",
        division: "",
        name: "",
        id: ""
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const detailRef = useRef(null);

    // 1. Search Logic
    useEffect(() => {
        const executeSearch = async () => {
            setLoadingSearch(true);
            try {
                const url = new URL(window.location.origin + '/stride-api/quick-search');
                if (filters.q) url.searchParams.append("q", filters.q);
                if (filters.region && filters.region !== "All Regions") url.searchParams.append("region", filters.region);
                if (filters.division) url.searchParams.append("division", filters.division);
                if (filters.district) url.searchParams.append("district", filters.district);
                if (filters.municipality) url.searchParams.append("municipality", filters.municipality);

                const req = await fetch(url);
                const res = await req.json();

                if (res.status === "success") {
                    setSearchResults(res.data.rows);
                    setTotalMatches(res.data.totalMatched);
                }
            } catch (e) {
                console.error("Search failed:", e);
            } finally {
                setLoadingSearch(false);
            }
        };

        const timer = setTimeout(() => {
            if (filters.q || filters.region !== 'All Regions' || filters.triggerSearch) {
                executeSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.q, filters.region, filters.division, filters.district, filters.municipality, filters.triggerSearch]);

    // 2. Profile Fetching Logic
    // ESC Key Listener for Modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };
        if (isModalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen]);

    // 3. Client-side Filtering Logic
    const filteredResults = useMemo(() => {
        return searchResults.filter(item => {
            // Global Filter
            const matchesGlobal = filterText === "" ||
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(filterText.toLowerCase())
                );

            // Column Filters
            const matchesRegion = columnFilters.region === "" ||
                String(item.region).toLowerCase().includes(columnFilters.region.toLowerCase());
            const matchesDivision = columnFilters.division === "" ||
                String(item.division).toLowerCase().includes(columnFilters.division.toLowerCase());
            const matchesName = columnFilters.name === "" ||
                String(item.name).toLowerCase().includes(columnFilters.name.toLowerCase());
            const matchesId = columnFilters.id === "" ||
                String(item.id).toLowerCase().includes(columnFilters.id.toLowerCase());

            return matchesGlobal && matchesRegion && matchesDivision && matchesName && matchesId;
        });
    }, [searchResults, filterText, columnFilters]);

    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
    };

    const columns = [
        {
            name: (
                <div className="flex flex-col gap-1 py-1">
                    <span>Region</span>
                    <input
                        type="text"
                        placeholder="Filter..."
                        className="font-normal text-[9px] p-1 border border-gray-100 rounded w-full focus:outline-none focus:border-blue-300 bg-white/50"
                        value={columnFilters.region}
                        onChange={e => handleColumnFilterChange('region', e.target.value)}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ),
            selector: (row) => row.region,
            sortable: true,
            width: "110px"
        },
        {
            name: (
                <div className="flex flex-col gap-1 py-1">
                    <span>Division</span>
                    <input
                        type="text"
                        placeholder="Filter..."
                        className="font-normal text-[10px] p-1 border border-gray-100 rounded w-full focus:outline-none focus:border-blue-300 bg-white/50"
                        value={columnFilters.division}
                        onChange={e => handleColumnFilterChange('division', e.target.value)}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ),
            selector: (row) => row.division,
            sortable: true,
            width: "130px"
        },
        {
            name: (
                <div className="flex flex-col gap-1 py-1">
                    <span>School Name</span>
                    <input
                        type="text"
                        placeholder="Filter name..."
                        className="font-normal text-[10px] p-1 border border-gray-100 rounded w-full focus:outline-none focus:border-blue-300 bg-white/50"
                        value={columnFilters.name}
                        onChange={e => handleColumnFilterChange('name', e.target.value)}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ),
            selector: (row) => row.name,
            sortable: true,
            width: "200px"
        },
        {
            name: (
                <div className="flex flex-col gap-1 py-1">
                    <span>School ID</span>
                    <input
                        type="text"
                        placeholder="Search ID..."
                        className="font-normal text-[10px] p-1 border border-gray-100 rounded w-full focus:outline-none focus:border-blue-300 bg-white/50"
                        value={columnFilters.id}
                        onChange={e => handleColumnFilterChange('id', e.target.value)}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ),
            selector: (row) => row.id,
            sortable: true,
            width: "100px"
        }
    ];

    const handleSelection = async (school, skipModal = false) => {
        setSelectedSchool(school);
        setLoadingProfile(true);
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
            if (!skipModal) setIsModalOpen(true);
        }
    };

    const isMobile = useIsMobile();

    // Mobile-Specific View
    if (isMobile) {
        return (
            <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto">
                <div className="p-4 flex flex-col gap-4">
                    {/* Simplified Search Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-4 mb-2">
                        <h2 className="font-bold text-[#003366] text-lg mb-2">Mobile Finder</h2>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by School Name or ID..."
                                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                value={filters.q || ''}
                                onChange={e => setFilters({ q: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Results List for Mobile */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-[#003366] text-sm flex items-center gap-2">
                                <Search size={14} /> Results ({filteredResults.length})
                            </h3>
                        </div>

                        {loadingSearch ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 text-[#003366] animate-spin opacity-50" />
                                <span className="text-xs font-bold text-gray-400">Loading...</span>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                                {filteredResults.slice(0, 50).map((school, i) => ( // Cap at 50 for performance
                                    <div
                                        key={school.id || i}
                                        onClick={() => {
                                            handleSelection(school, true); // true = skipModal
                                            if (detailRef.current) {
                                                detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                        className="p-4 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col gap-1 active:bg-blue-100"
                                    >
                                        <div className="font-bold text-[13px] text-gray-900 leading-tight">
                                            {school.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">ID: {school.id}</span>
                                            <span className="truncate">{school.municipality || school.city}, {school.province}</span>
                                        </div>
                                    </div>
                                ))}
                                {filteredResults.length > 50 && (
                                    <div className="p-4 text-center text-xs text-gray-400 italic bg-gray-50">
                                        Showing first 50 results. Use search to refine.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-10 text-center text-sm text-gray-400 font-medium">
                                No schools found. Try a different search.
                            </div>
                        )}
                    </div>
                </div>

                {/* Map View for Mobile */}
                <div
                    ref={detailRef}
                    className="p-4 pt-0 w-full"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-80 relative">
                        <SchoolPreviewMap
                            lat={selectedSchool?.lat || 12.8797}
                            lng={selectedSchool?.lng || 121.7740}
                            name={selectedSchool?.name || "Philippines"}
                            results={searchResults}
                            onMarkerClick={(school) => handleSelection(school, false)}
                            zoom={selectedSchool ? 15 : 6}
                        />
                    </div>
                </div>

                {/* Detail View Modal (Reused) */}
                <SchoolProfileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    school={selectedSchool}
                    fullProfile={fullProfile}
                    loadingProfile={loadingProfile}
                />
            </div>
        );
    }

    // Standard Desktop View
    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto">
            {/* Master View: Search & Map (6-6) */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                {/* Result Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-[#003366] text-sm flex items-center gap-2">
                            <Search size={16} /> Search Results ({totalMatches})
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <DataTable
                            keyField="unique_key"
                            columns={columns}
                            data={filteredResults}
                            onRowClicked={(row) => handleSelection(row, true)}
                            highlightOnHover
                            pointerOnHover
                            pagination
                            fixedHeader
                            subHeader
                            subHeaderComponent={
                                <div className="flex items-center gap-3 w-full pb-2">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Quick filter table results..."
                                            className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={filterText}
                                            onChange={e => setFilterText(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFilterText("");
                                            setColumnFilters({ region: "", division: "", name: "", id: "" });
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Clear all filters"
                                    >
                                        <Filter size={14} />
                                    </button>
                                </div>
                            }
                            progressPending={loadingSearch}
                            progressComponent={
                                <div className="p-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-10 h-10 text-[#003366] animate-spin opacity-20" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Searching Database...</span>
                                </div>
                            }
                            noDataComponent={<div className="p-20 text-gray-400 font-medium">Use Sidebar to filter and Search</div>}
                            conditionalRowStyles={[
                                {
                                    when: row => selectedSchool && row.id === selectedSchool.id,
                                    style: {
                                        backgroundColor: '#eff6ff',
                                        color: '#1e3a8a',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            cursor: 'pointer',
                                        },
                                    },
                                }
                            ]}
                            customStyles={{
                                headRow: {
                                    style: {
                                        backgroundColor: '#fcfcfc',
                                        borderBottom: '1px solid #f1f5f9',
                                        minHeight: '40px'
                                    }
                                },
                                headCells: {
                                    style: {
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#64748b',
                                        textTransform: 'uppercase'
                                    }
                                },
                                rows: {
                                    style: {
                                        minHeight: '40px',
                                        fontSize: '12px',
                                        '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' }
                                    }
                                },
                                cells: {
                                    style: {
                                        paddingLeft: '12px',
                                        paddingRight: '12px'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Map Component */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                    <SchoolPreviewMap
                        lat={selectedSchool?.lat || 12.8797}
                        lng={selectedSchool?.lng || 121.7740}
                        name={selectedSchool?.name || "Philippines"}
                        results={searchResults}
                        onMarkerClick={(school) => handleSelection(school, false)}
                        zoom={selectedSchool ? 15 : 6}
                    />
                </div>
            </div>

            {/* Detail View Modal */}
            <SchoolProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                school={selectedSchool}
                fullProfile={fullProfile}
                loadingProfile={loadingProfile}
            />
        </div>
    );
}

