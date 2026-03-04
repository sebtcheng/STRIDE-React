"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Search, MapPin, Download, Filter, Settings2, Loader2, Building2, Users, Building, AlertTriangle, AlertCircle, CheckSquare, Database, Info, X } from "lucide-react";
import dynamic from "next/dynamic";

const SchoolPreviewMap = dynamic(() => import("./SchoolPreviewMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map Engine...</div>
});

export default function QuickSearchTab({ filters }) {
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
                const url = new URL(window.location.origin + '/api/quick-search');
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
    const handleSelection = async (school, skipModal = false) => {
        setSelectedSchool(school);
        setLoadingProfile(true);
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
            if (!skipModal) setIsModalOpen(true);
        }
    };

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

    const InfoCard = ({ title, icon, children, color = "blue" }) => {
        const colors = {
            blue: "border-blue-100 bg-blue-50/30 text-blue-800",
            green: "border-green-100 bg-green-50/30 text-green-800",
            orange: "border-orange-100 bg-orange-50/30 text-orange-800",
            purple: "border-purple-100 bg-purple-50/30 text-purple-800",
            red: "border-red-100 bg-red-50/30 text-red-800"
        };
        return (
            <div className={`p-4 rounded-xl border ${colors[color]} shadow-sm h-full`}>
                <div className="flex items-center gap-2 mb-3 border-b border-current/10 pb-2">
                    {icon}
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">{title}</h4>
                </div>
                <div className="space-y-1">{children}</div>
            </div>
        );
    };

    const DataItem = ({ label, value, subValue }) => (
        <div className="flex justify-between items-baseline py-1">
            <span className="text-[11px] font-medium opacity-70">{label}</span>
            <div className="text-right">
                <span className="text-sm font-bold">{value || '0'}</span>
                {subValue && <span className="text-[9px] block opacity-50 font-bold">{subValue}</span>}
            </div>
        </div>
    );

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
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-12">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#001a33]/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-6xl max-h-full rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        {/* Modal Header */}
                        {!selectedSchool ? null : (
                            <div className="p-6 bg-[#003366] text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#FFB81C] p-2.5 rounded-xl text-[#003366] shadow-lg shadow-orange-500/20">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black leading-tight tracking-tight">{selectedSchool.name}</h2>
                                        <p className="text-blue-200 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                            ID: {selectedSchool.id}
                                            <span className="opacity-30">•</span>
                                            {selectedSchool.municipality}, {selectedSchool.region}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            window.open(`/api/quick-search/export-profile?schoolId=${selectedSchool.id}`, '_blank');
                                        }}
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/10 backdrop-blur-sm transition-all"
                                    >
                                        <Download size={14} /> EXPORT PDF
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                                    >
                                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 p-8">
                            {loadingProfile ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4 text-blue-600">
                                    <Loader2 size={48} className="animate-spin" />
                                    <p className="font-black text-sm tracking-widest animate-pulse uppercase">Syncing Portfolio Data...</p>
                                </div>
                            ) : fullProfile && (
                                <div className="space-y-10">
                                    {/* SECTION A: IDENTITY & GEOGRAPHY */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InfoCard title="Identity & Leadership" icon={<Building2 size={16} />}>
                                            <DataItem label="School Head" value={fullProfile.profile.school_head_name || 'Unspecified'} subValue={fullProfile.profile.sh_position} />
                                            <DataItem label="Curricular Offering" value={fullProfile.profile.modified_coc || 'N/A'} />
                                            <DataItem label="Sector / Type" value={`${fullProfile.profile.sector || 'Public'} - ${fullProfile.profile.school_type || 'General'}`} />
                                        </InfoCard>
                                        <InfoCard title="Geographic Coordinates" icon={<MapPin size={16} />} color="purple">
                                            <DataItem label="Region / Division" value={`${fullProfile.profile.region} | ${fullProfile.profile.division}`} />
                                            <DataItem label="District / Mun" value={`${fullProfile.profile.district || 'N/A'} | ${fullProfile.profile.municipality}`} />
                                            <DataItem label="Barangay" value={fullProfile.profile.barangay} subValue={`Coord: ${fullProfile.profile.latitude}, ${fullProfile.profile.longitude}`} />
                                        </InfoCard>
                                    </div>

                                    {/* SECTION B: ENROLMENT PROFILE */}
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                            Student Population Dynamics
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <InfoCard title="Elementary Breakdown" icon={<Users size={16} />} color="green">
                                                <DataItem label="Kinder" value={(fullProfile.profile.kinder || 0).toLocaleString()} />
                                                <DataItem label="Grades 1-3" value={((Number(fullProfile.profile.g1) || 0) + (Number(fullProfile.profile.g2) || 0) + (Number(fullProfile.profile.g3) || 0)).toLocaleString()} />
                                                <DataItem label="Grades 4-6" value={((Number(fullProfile.profile.g4) || 0) + (Number(fullProfile.profile.g5) || 0) + (Number(fullProfile.profile.g6) || 0)).toLocaleString()} />
                                            </InfoCard>
                                            <InfoCard title="Secondary Population" icon={<Users size={16} />} color="green">
                                                <DataItem label="Junior High (7-10)" value={((Number(fullProfile.profile.g7) || 0) + (Number(fullProfile.profile.g8) || 0) + (Number(fullProfile.profile.g9) || 0) + (Number(fullProfile.profile.g10) || 0)).toLocaleString()} />
                                                <DataItem label="Senior High (11-12)" value={((Number(fullProfile.profile.g11) || 0) + (Number(fullProfile.profile.g12) || 0)).toLocaleString()} />
                                                <DataItem label="Total Enrolment" value={(fullProfile.profile.totalenrolment || 0).toLocaleString()} />
                                            </InfoCard>
                                            <InfoCard title="Ancillary Metrics" icon={<AlertCircle size={16} />} color="purple">
                                                <DataItem label="LMS Status" value={fullProfile.profile.sha_2024_index ? "YES" : "NO"} />
                                                <DataItem label="School Size" value={fullProfile.profile.school_size_typology || "Standard"} />
                                                <DataItem label="Implementing Unit" value={fullProfile.profile.implementing_unit || "No"} />
                                            </InfoCard>
                                        </div>
                                    </div>

                                    {/* SECTION C: HUMAN RESOURCES */}
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                            Personnel Management & Teacher Gaps
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <InfoCard title="Teacher Inventory (Active)" icon={<Users size={16} />} color="blue">
                                                <DataItem label="Elem Teachers" value={(fullProfile.profile.es_teachers || 0).toLocaleString()} />
                                                <DataItem label="JHS Teachers" value={(fullProfile.profile.jhs_teachers || 0).toLocaleString()} />
                                                <DataItem label="SHS Teachers" value={(fullProfile.profile.shs_teachers || 0).toLocaleString()} />
                                            </InfoCard>
                                            <InfoCard title="Resource Gap Analysis" icon={<AlertCircle size={16} />} color="red">
                                                <DataItem label="Total Shortage" value={(fullProfile.profile.total_shortage || 0).toLocaleString()} />
                                                <DataItem label="Total Excess" value={(fullProfile.profile.total_excess || 0).toLocaleString()} />
                                                <DataItem label="Net Requirement" value={(Number(fullProfile.profile.total_shortage || 0) - Number(fullProfile.profile.total_excess || 0)).toLocaleString()} />
                                            </InfoCard>
                                            <InfoCard title="Non-Teaching & Admin" icon={<CheckSquare size={16} />} color="blue">
                                                <DataItem label="Clustering Status" value={fullProfile.profile.clustering_status || "N/A"} />
                                                <DataItem label="PDO-I Deployment" value={fullProfile.profile.pdoi_deployment || "None"} />
                                                <DataItem label="Outlier Status" value={fullProfile.profile.outlier_status || "Normal"} />
                                            </InfoCard>
                                        </div>
                                    </div>

                                    {/* SECTION D: PHYSICAL FACILITIES */}
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                            Physical Assets & Infrastructure
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <InfoCard title="Rooms & Buildings" icon={<Building size={16} />} color="orange">
                                                <DataItem label="Total Buildings" value={(Number(fullProfile.profile.buildings) || 0).toLocaleString()} />
                                                <DataItem label="Total Classrooms" value={(Number(fullProfile.profile.instructional_rooms_2023_2024) || 0).toLocaleString()} />
                                                <DataItem label="Major Repairs" value={(Number(fullProfile.profile.major_repair_2023_2024) || 0).toLocaleString()} />
                                            </InfoCard>
                                            <InfoCard title="Facility Gaps" icon={<AlertTriangle size={16} />} color="orange">
                                                <DataItem label="Room Requirement" value={(fullProfile.profile.classroom_requirement || 0).toLocaleString()} />
                                                <DataItem label="Room Shortage" value={(fullProfile.profile.est_cs || 0).toLocaleString()} />
                                                <DataItem label="Buildable Space" value={fullProfile.profile.buidable_space === '1' || fullProfile.profile.buidable_space === 1 ? "Yes" : "No"} />
                                            </InfoCard>
                                            <InfoCard title="Utilities & Logistics" icon={<Settings2 size={16} />} color="blue">
                                                <DataItem label="Electricity Source" value={fullProfile.profile.electricitysource || "N/A"} />
                                                <DataItem label="Water Source" value={fullProfile.profile.watersource || "N/A"} />
                                                <DataItem label="Shifting Schedule" value={fullProfile.profile.shifting || "N/A"} />
                                            </InfoCard>
                                        </div>
                                    </div>

                                    {/* SECTION E: SPECIALIZATION */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-4">
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                            Personnel Specialization (Secondary)
                                            <div className="h-[2px] bg-gray-100 flex-1 rounded-full"></div>
                                        </h3>

                                        {(fullProfile.profile.modified_coc || "").includes("Purely ES") ? (
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4 text-gray-400">
                                                <Info size={24} />
                                                <p className="text-xs italic">Specialization data is not applicable for Purely Elementary schools. Personnel are deployed as General Education generalists.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { label: "Math", field: "mathematics" },
                                                    { label: "Science", field: "science" },
                                                    { label: "English", field: "english" },
                                                    { label: "Filipino", field: "filipino" },
                                                    { label: "Araling Pan", field: "araling_panlipunan" },
                                                    { label: "MAPEH", field: "mapeh" },
                                                    { label: "TLE", field: "tle" },
                                                    { label: "SPED", field: "sped" }
                                                ].map(spec => (
                                                    <div key={spec.label} className="bg-white border border-gray-100 p-4 rounded-xl flex justify-between items-center shadow-sm hover:border-blue-200 transition-colors">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{spec.label}</span>
                                                        <span className="text-lg font-black text-[#003366]">{(fullProfile.profile[spec.field] || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
