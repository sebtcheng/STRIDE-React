"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, MapPin, X } from "lucide-react";

// Dynamically load the Leaflet wrapper to prevent SSR issues and React 18 piecemeal DOM chunking bugs
const DynamicMap = dynamic(
    () => import('./SchoolLocatorMapInner'),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse text-[#003366] font-bold">Loading Map Engine...</div> }
);

// Leaflet CSS needs to be imported or handled in layout, but let's mock the UI for now.

export default function SchoolLocatorTab({ filters }) {
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchSchools() {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (filters.q) params.append('q', filters.q);
                if (filters.region && filters.region !== 'All Regions') params.append('region', filters.region);
                if (filters.division) params.append('division', filters.division);
                if (filters.municipality) params.append('municipality', filters.municipality);
                if (filters.legislative_district) params.append('legislative_district', filters.legislative_district);

                const response = await fetch(`/api/school-locator?${params.toString()}`);
                const data = await response.json();

                if (data.status === 'success') {
                    setSchools(data.data);
                } else {
                    setError(data.message || 'Error fetching school location data');
                }
            } catch (err) {
                console.error("Failed to fetch schools:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchSchools();
    }, [filters]);

    // Memoize the datatable columns to prevent deep comparison re-renders when data updates
    const columns = useMemo(() => [
        { name: "School ID", selector: (row) => row.id, sortable: true, width: "120px" },
        { name: "School Name", selector: (row) => row.name, sortable: true, grow: 2 },
        { name: "Region", selector: (row) => row.region, sortable: true },
        { name: "Division", selector: (row) => row.division, sortable: true },
    ], []);

    // Local Search Filtering
    const filteredSchools = useMemo(() => {
        if (!searchTerm) return schools;
        const lowerTerm = searchTerm.toLowerCase();
        return schools.filter(s =>
            s.name?.toLowerCase().includes(lowerTerm) ||
            s.id?.toString().includes(lowerTerm)
        );
    }, [schools, searchTerm]);

    // Defer the expensive 47k DOM marker map generation so the UI and Table remain instantly responsive
    const deferredSchools = useDeferredValue(filteredSchools);

    const handleRowClick = (row) => {
        setSelectedSchool(row);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Split View */}
            <div className="flex-1 flex flex-col lg:flex-row h-[70vh]">

                {/* Left Data Table Pane */}
                <div className="w-full lg:w-1/2 p-4 border-r border-gray-200 flex flex-col h-full bg-gray-50/30">
                    <div className="mb-4 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Schools by Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all text-sm font-medium"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                        <DataTable
                            columns={columns}
                            data={filteredSchools}
                            progressPending={loading}
                            progressComponent={<div className="p-4 text-[#003366] font-bold animate-pulse">Fetching Schools...</div>}
                            pagination
                            fixedHeader
                            paginationPerPage={10}
                            highlightOnHover
                            pointerOnHover
                            onRowClicked={handleRowClick}
                            customStyles={{
                                headRow: { style: { backgroundColor: '#003366', color: 'white', fontWeight: 'bold' } },
                                rows: { style: { '&:hover': { backgroundColor: '#f0f9ff' } } }
                            }}
                        />
                    </div>
                </div>

                {/* Right Map Pane */}
                <div className={`w-full lg:w-1/2 bg-gray-100 relative h-full transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {error && (
                        <div className="absolute top-4 left-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                            <strong>Error loading map data:</strong> {error}
                        </div>
                    )}
                    <DynamicMap selectedSchool={selectedSchool} activeSchools={deferredSchools} />
                </div>
            </div>

            {/* Bottom Detail Panel */}
            <div className="h-48 border-t-4 border-[#003366] bg-zinc-50 p-6 flex items-center justify-center shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-10">
                {selectedSchool ? (
                    <div className="w-full max-w-4xl flex items-start gap-6">
                        <div className="p-4 bg-blue-100 rounded-full text-[#003366]">
                            <MapPin size={32} />
                        </div>
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">
                                {selectedSchool.name} <span className="text-sm font-normal text-gray-500 ml-2">({selectedSchool.id})</span>
                            </h3>
                            <div className="grid grid-cols-3 gap-8 mt-4 text-sm">
                                <div><strong className="text-gray-500 block">Region</strong> <span className="font-semibold text-gray-900">{selectedSchool.region}</span></div>
                                <div><strong className="text-gray-500 block">Division</strong> <span className="font-semibold text-gray-900">{selectedSchool.division}</span></div>
                                <div><strong className="text-gray-500 block">Municipality</strong> <span className="font-semibold text-gray-900">{selectedSchool.municipality || 'N/A'}</span></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 font-medium">Select a school from the table to view granular details.</p>
                )}
            </div>
        </div>
    );
}
