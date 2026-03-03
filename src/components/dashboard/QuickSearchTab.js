"use client";

import { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MapPin, Download, Filter, Settings2, Loader2, Building2, Users, Building, AlertTriangle, AlertCircle, CheckSquare, Database, Info } from "lucide-react";
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
    const handleSelection = async (school) => {
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
        }
    };

    const columns = [
        { name: "ID", selector: (row) => row.id, sortable: true, width: "100px" },
        { name: "School Name", selector: (row) => row.name, sortable: true, grow: 2 },
        { name: "Division", selector: (row) => row.division, sortable: true },
        { name: "Enrolment", selector: (row) => row.enrolment, sortable: true, width: "100px", format: r => Number(r.enrolment).toLocaleString() }
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
                            columns={columns}
                            data={searchResults}
                            onRowClicked={handleSelection}
                            highlightOnHover
                            pointerOnHover
                            pagination
                            fixedHeader
                            progressPending={loadingSearch}
                            noDataComponent={<div className="p-20 text-gray-400 font-medium">Use Sidebar to filter and Search</div>}
                            customStyles={{
                                headRow: { style: { backgroundColor: '#fcfcfc', borderBottom: '1px solid #f1f5f9' } },
                                rows: { style: { minHeight: '52px', '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' } } }
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
                        onMarkerClick={handleSelection}
                        zoom={selectedSchool ? 15 : 6}
                    />
                </div>
            </div>

            {/* Detail View (12-width) */}
            <div ref={detailRef} className="px-6 pb-12 mt-2">
                {!selectedSchool ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-20 flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <Database size={48} className="opacity-20" />
                        </div>
                        <p className="font-bold text-lg">Detailed Breakdown Hub</p>
                        <p className="text-sm">Select a school from the table or map above to initialize profile analytics.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {/* Detail Header */}
                        <div className="p-6 bg-[#003366] text-white flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#FFB81C] p-2 rounded-lg text-[#003366]">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold leading-tight">{selectedSchool.name}</h2>
                                        <p className="text-blue-200 text-xs font-bold tracking-widest uppercase">School ID: {selectedSchool.id} • {selectedSchool.municipality}, {selectedSchool.region}</p>
                                    </div>
                                </div>
                            </div>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-sm transition-all">
                                <Download size={14} /> DOWNLOAD SUMMARY (PDF)
                            </button>
                        </div>

                        {loadingProfile ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4 text-blue-600">
                                <Loader2 size={40} className="animate-spin" />
                                <p className="font-bold animate-pulse">Analyzing Resource Portfolio...</p>
                            </div>
                        ) : fullProfile && (
                            <div className="p-8 space-y-8">
                                {/* SECTION A: IDENTITY & GEOGRAPHY */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoCard title="Identity & Leadership" icon={<Building2 size={16} />}>
                                        <DataItem label="School Head" value={fullProfile.profile.school_head_name || 'Unspecified'} subValue={fullProfile.profile.sh_position} />
                                        <DataItem label="Curricular Offering" value={fullProfile.profile.curricular_offering || 'Complete Elementary'} />
                                        <DataItem label="Sector / Type" value={`${fullProfile.profile.sector || 'Public'} - ${fullProfile.profile.school_type || 'General'}`} />
                                    </InfoCard>
                                    <InfoCard title="Geographic Coordinates" icon={<MapPin size={16} />} color="purple">
                                        <DataItem label="Region / Division" value={`${fullProfile.profile.region} | ${fullProfile.profile.division}`} />
                                        <DataItem label="District / Mun" value={`${fullProfile.profile.legislative_district || 'N/A'} | ${fullProfile.profile.municipality}`} />
                                        <DataItem label="Barangay" value={fullProfile.profile.barangay} subValue={`Coord: ${fullProfile.profile.latitude}, ${fullProfile.profile.longitude}`} />
                                    </InfoCard>
                                </div>

                                {/* SECTION B: ENROLMENT PROFILE */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                        Student Population Dynamics
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                            <DataItem label="LMS Status" value={fullProfile.profile.lms_school == 1 ? "YES" : "NO"} />
                                            <DataItem label="School Size" value={fullProfile.profile.school_type || "Standard"} />
                                            <DataItem label="Implementing Unit" value={fullProfile.profile.sector || "No"} />
                                        </InfoCard>
                                    </div>
                                </div>

                                {/* SECTION C: HUMAN RESOURCES */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                        Personnel Management & Teacher Gaps
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InfoCard title="Teacher Inventory (Active)" icon={<Users size={16} />} color="blue">
                                            <DataItem label="Elem Teachers" value={(fullProfile.profile.es_teachers || 0).toLocaleString()} />
                                            <DataItem label="JHS Teachers" value={(fullProfile.profile.jhs_teachers || 0).toLocaleString()} />
                                            <DataItem label="SHS Teachers" value={(fullProfile.profile.shs_teachers || 0).toLocaleString()} />
                                        </InfoCard>
                                        <InfoCard title="Resource Gap Analysis" icon={<AlertCircle size={16} />} color="red">
                                            <DataItem label="Total Shortage" value={(fullProfile.profile.total_shortage || 0).toLocaleString()} />
                                            <DataItem label="Total Excess" value={"0"} />
                                            <DataItem label="Net Requirement" value={(Number(fullProfile.profile.total_shortage || 0)).toLocaleString()} />
                                        </InfoCard>
                                        <InfoCard title="Non-Teaching & Admin" icon={<CheckSquare size={16} />} color="blue">
                                            <DataItem label="Clustering Status" value={fullProfile.profile.clustering_status || "Independent"} />
                                            <DataItem label="PDO-I Deployment" value={fullProfile.profile.pdoi_deployment || "Pending"} />
                                            <DataItem label="Outlier Status" value={fullProfile.profile.outlier_status || "Normal"} />
                                        </InfoCard>
                                    </div>
                                </div>

                                {/* SECTION D: PHYSICAL FACILITIES */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                        Physical Assets & Infrastructure
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InfoCard title="Rooms & Buildings" icon={<Building size={16} />} color="orange">
                                            <DataItem label="Total Buildings" value={(Number(fullProfile.profile.building_count_good_condition) || 0).toLocaleString()} />
                                            <DataItem label="Good Rms" value={(Number(fullProfile.profile.number_of_rooms_good_condition) || 0).toLocaleString()} />
                                            <DataItem label="Major Repairs" value={(Number(fullProfile.profile.building_count_needs_major_repair) || 0).toLocaleString()} />
                                        </InfoCard>
                                        <InfoCard title="Facility Gaps" icon={<AlertTriangle size={16} />} color="orange">
                                            <DataItem label="Room Requirement" value={(fullProfile.profile.classroom_shortage || 0).toLocaleString()} />
                                            <DataItem label="Room Shortage" value={(fullProfile.profile.classroom_shortage || 0).toLocaleString()} />
                                            <DataItem label="Buildable Space" value={fullProfile.profile.with_buildable_space || "No"} />
                                        </InfoCard>
                                        <InfoCard title="Utilities & Logistics" icon={<Settings2 size={16} />} color="blue">
                                            <DataItem label="Electricity Source" value={fullProfile.profile.electricitysource || "Grid"} />
                                            <DataItem label="Water Source" value={fullProfile.profile.watersource || "Local"} />
                                            <DataItem label="Shifting Schedule" value={fullProfile.profile.shifting || "No"} />
                                        </InfoCard>
                                    </div>
                                </div>

                                {/* SECTION E: SPECIALIZATION */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-tighter flex items-center gap-2">
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                        Personnel Specialization (Secondary)
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                    </h3>

                                    {(fullProfile.profile.curricular_offering || "").includes("Elementary") && !(fullProfile.profile.curricular_offering || "").includes("High") ? (
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4 text-gray-400">
                                            <Info size={24} />
                                            <p className="text-xs italic">Specialization data is not applicable for Purely Elementary schools. Personnel are deployed as General Education generalists.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                <div key={spec.label} className="bg-white border border-gray-100 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{spec.label}</span>
                                                    <span className="text-sm font-black text-[#003366]">{(fullProfile.profile[spec.field] || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
