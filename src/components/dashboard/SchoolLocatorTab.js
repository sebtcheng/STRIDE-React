"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, MapPin, X, Info, Loader2 } from "lucide-react";
import SchoolProfileModal from "./SchoolProfileModal";

// Dynamically load the Leaflet wrapper to prevent SSR issues and React 18 piecemeal DOM chunking bugs
const DynamicMap = dynamic(
    () => import('./SchoolLocatorMapInner'),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse text-[#003366] font-bold">Loading Map Engine...</div> }
);

// Leaflet CSS needs to be imported or handled in layout, but let's mock the UI for now.

export default function SchoolLocatorTab({ filters, isMobile }) {
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalSchool, setSelectedModalSchool] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        async function fetchSchools() {
            // Prevent initial load until a filter is applied
            const hasFilter = filters.q ||
                (filters.region && filters.region !== 'All Regions') ||
                filters.division ||
                filters.municipality ||
                filters.legislative_district;

            if (!hasFilter) {
                setSchools([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (filters.q) params.append('q', filters.q);
                if (filters.region && filters.region !== 'All Regions') params.append('region', filters.region);
                if (filters.division) params.append('division', filters.division);
                if (filters.municipality) params.append('municipality', filters.municipality);
                if (filters.legislative_district) params.append('legislative_district', filters.legislative_district);

                const response = await fetch(`/stride-api/school-locator?${params.toString()}`);
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
        {
            name: "Action",
            cell: (row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isMobile) {
                            setSelectedSchool(row);
                        } else {
                            handleMarkerClick(row);
                        }
                    }}
                    className="p-1.5 bg-[#003366]/10 text-[#003366] rounded-full hover:bg-[#003366] hover:text-white transition-colors"
                    title={isMobile ? "Plot on Map" : "View Full Profile"}
                >
                    {isMobile ? <MapPin size={16} /> : <Info size={16} />}
                </button>
            ),
            width: "80px",
            button: true
        }
    ], [isMobile]);

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
        if (isMobile && mapRef.current) {
            mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Top Split View */}
            <div className={`flex-1 flex flex-col lg:flex-row h-full ${isMobile ? 'overflow-hidden' : ''}`}>

                {/* Left Data Table Pane */}
                <div className={`w-full lg:w-1/2 p-4 border-r border-gray-200 flex flex-col bg-gray-50/30 ${isMobile && !searchTerm ? 'h-auto' : 'h-full'}`}>
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

                    {(!isMobile || searchTerm) && (
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                            <DataTable
                                columns={columns}
                                data={filteredSchools}
                                progressPending={loading}
                                progressComponent={
                                    <div className="p-10 flex flex-col items-center justify-center gap-2">
                                        <div className="relative">
                                            <Loader2 className="w-8 h-8 text-[#003366] animate-spin" />
                                            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-[#003366] mt-2 uppercase tracking-widest opacity-60">Synchronizing...</span>
                                    </div>
                                }
                                pagination
                                fixedHeader
                                paginationPerPage={isMobile ? 3 : 10}
                                paginationRowsPerPageOptions={isMobile ? [3, 5, 10] : [10, 20, 30]}
                                highlightOnHover
                                pointerOnHover
                                onRowClicked={handleRowClick}
                                noDataComponent={<div className="p-10 text-gray-400">Search for a school or use filters to begin</div>}
                                customStyles={{
                                    headRow: { style: { backgroundColor: '#003366', color: 'white', fontWeight: 'bold' } },
                                    rows: { style: { '&:hover': { backgroundColor: '#f0f9ff' } } }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Right Map Pane */}
                <div
                    ref={mapRef}
                    className={`w-full lg:w-1/2 bg-gray-100 relative h-full transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {error && (
                        <div className="absolute top-4 left-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                            <strong>Error loading map data:</strong> {error}
                        </div>
                    )}
                    <DynamicMap selectedSchool={selectedSchool} activeSchools={deferredSchools} onMarkerClick={handleMarkerClick} />
                </div>
            </div>

            <SchoolProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                school={selectedModalSchool}
                fullProfile={fullProfile}
                loadingProfile={loadingProfile}
            />
        </div>
    );
}
