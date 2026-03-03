"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, MapPin } from "lucide-react";

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
        {
            name: "Resource Needs",
            selector: (row) => row.needsRes,
            sortable: true,
            cell: row => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.needsRes > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {row.needsRes} Flags
                </span>
            )
        },
    ], []);

    // Defer the expensive 47k DOM marker map generation so the UI and Table remain instantly responsive
    const deferredSchools = useDeferredValue(schools);

    const handleRowClick = (row) => {
        setSelectedSchool(row);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Split View */}
            <div className="flex-1 flex flex-col lg:flex-row h-[70vh]">

                {/* Left Data Table Pane */}
                <div className="w-full lg:w-1/2 p-4 border-r border-gray-200 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                        <DataTable
                            columns={columns}
                            data={schools}
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
                                <div><strong className="text-gray-500 block">Resource Flags Status</strong> <span className="font-bold text-red-600">Critical Alerts Active</span></div>
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
