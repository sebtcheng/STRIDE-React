import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Map, Layers, MapPin, Database, AlertCircle, Maximize2, Minimize2, Search, Table, Info, BarChart2, ChevronUp, ChevronDown } from "lucide-react";
import SchoolProfileModal from "./SchoolProfileModal";

// Dynamically load the Map Wrapper
const ResourceMapArea = dynamic(() => import("./ResourceMapArea"), { ssr: false });

// Columns are now handled inside the component via useMemo to be tab-aware


export default function ResourceMappingTab({ filters, setFilters }) {
    const [mapData, setMapData] = useState({ points: [], industryPoints: [], loading: false, totalMatched: 0 });
    const [mapFocus, setMapFocus] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedSchoolIndustries, setSelectedSchoolIndustries] = useState(null);
    const mapRef = useRef(null);

    // Local UI State for Layout Redesign
    const [activeCategory, setActiveCategory] = useState("Teaching Deployment");
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalSchool, setSelectedModalSchool] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const handleMarkerClick = async (school) => {
        setSelectedModalSchool({ ...school, id: school.id || school.school_id });
        setIsModalOpen(true);
        setLoadingProfile(true);
        setFullProfile(null);
        try {
            const schoolId = school.id || school.school_id;
            if (!schoolId) throw new Error("No school ID found");
            const res = await fetch(`/api/school-profile/${schoolId}`);
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

    // Local Custom Sidebar Filter State
    const [localFilters, setLocalFilters] = useState({
        region: filters.region || "All Regions",
        division: filters.division || "",
        legislative_district: "",
        level: "ES",
        efd_type: ["New Construction"]
    });

    const [efdDropdownOpen, setEfdDropdownOpen] = useState(false);

    useEffect(() => {
        if (selectedSchool && activeCategory === 'Industries (SHS)') {
            setSelectedSchoolIndustries(null);
            const params = new URLSearchParams({
                school_id: selectedSchool.id,
                ...(localFilters.region && localFilters.region !== "All Regions" && { region: localFilters.region })
            });
            fetch(`/api/resource-mapping/industries?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setSelectedSchoolIndustries(data.data);
                    }
                })
                .catch(console.error);
        } else {
            setSelectedSchoolIndustries(null);
        }
    }, [selectedSchool, activeCategory, localFilters.region]);

    // Database Dropdown Schema State
    const [dbSchema, setDbSchema] = useState({
        uniRegions: [],
        uniDivisions: [],
        uniDistricts: [],
        uniLegislativeDistricts: [],
        uniMunicipalities: [],
        efdCategories: [],
    });

    // Initial Schema Fetch
    useEffect(() => {
        const url = new URL(window.location.origin + "/api/dropdowns");
        if (localFilters.region && localFilters.region !== "All Regions") url.searchParams.append("region", localFilters.region);
        if (localFilters.division) url.searchParams.append("division", localFilters.division);

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setDbSchema(prev => ({
                        ...prev,
                        uniRegions: res.data.uniRegions || prev.uniRegions,
                        uniDivisions: res.data.uniDivisions || [],
                        uniDistricts: res.data.uniDistricts || [],
                        uniLegislativeDistricts: res.data.uniLegislativeDistricts || [],
                        efdCategories: res.data.efdCategories || [],
                    }));
                }
            })
            .catch(err => console.error("Error fetching schema:", err));
    }, [localFilters.region, localFilters.division]);

    useEffect(() => {
        // Prevent initial load until clicked
        if (!filters || !filters.mapping_trigger) return;
        fetchGISData();
    }, [filters.mapping_trigger, filters.active_layer, filters.resource_view_mode, filters.resource_mapping_type]);

    const fetchGISData = async () => {
        setMapData(prev => ({ ...prev, loading: true }));
        try {
            const params = new URLSearchParams({
                mode: filters.resource_view_mode,
                type: filters.resource_mapping_type,
                layer: filters.active_layer,
                region: filters.region !== 'All Regions' ? filters.region : '',
                division: filters.division || '',
                legislative_district: filters.legislative_district || '',
                level: filters.level || '',
                efd_type: Array.isArray(filters.efd_type) ? filters.efd_type.join(',') : (filters.efd_type || '')
            });

            const res = await fetch(`/api/resource-mapping?${params.toString()}`);
            const data = await res.json();
            if (data.status === "success") {
                setMapData({ points: data.data.points, industryPoints: data.data.industryPoints || [], summary: data.data.summary, totalMatched: data.data.totalMatched, loading: false });
            }
        } catch (e) {
            console.error("GIS Sync Failed:", e);
        } finally {
            setMapData(prev => ({ ...prev, loading: false }));
        }
    };

    const handleTabClick = (tab) => {
        setActiveCategory(tab);
        if (setFilters) {
            setSelectedSchool(null);
            setMapFocus(null);

            setFilters({
                region: localFilters.region,
                division: localFilters.division,
                legislative_district: localFilters.legislative_district,
                level: tab === 'Teaching Deployment' ? localFilters.level : null,
                efd_type: tab === 'Facilities' ? localFilters.efd_type : null,
                resource_mapping_type: tab,
                mapping_trigger: (filters.mapping_trigger || 0) + 1
            });
        }
    };

    const memoizedColumns = useMemo(() => {
        const getMetricName = () => {
            switch (activeCategory) {
                case 'Teaching Deployment': return 'Teacher Shortage';
                case 'Non-teaching Deployment': return 'AO II Deployment';
                case 'Classrooms': return 'Classroom Shortage';
                case 'Congestion': return 'Congestion Index';
                case 'Industries (SHS)': return 'Total Enrolment';
                case 'Facilities': return 'Contract Amount';
                case 'Last Mile Schools': return 'Classroom Shortage';
                default: return 'Metric';
            }
        };

        const getTeachingColumns = () => [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Teacher Shortage', selector: row => row.shortage || 0, sortable: true, width: '130px' },
            { name: 'Teacher Excess', selector: row => row.excess || 0, sortable: true, width: '130px' },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getNonTeachingColumns = () => [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'AO II Deployment', selector: row => row.metric_label || 'None Deployed', sortable: true },
            { name: 'PDO I Deployment', selector: row => row.pdoi_deployment || 'Without PDO I', sortable: true },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getClassroomsColumns = () => [
            { name: 'School', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Total Enrolment', selector: row => row.enrollment || 0, sortable: true },
            { name: 'Classroom Inventory', selector: row => row.inventory || 0, sortable: true },
            { name: 'Estimate Classroom Shortage', selector: row => row.shortage || 0, sortable: true },
            {
                name: 'Buildable Space',
                selector: row => row.buildable_space === '1' || row.buildable_space === 1 ? 'Yes' : 'No',
                sortable: true
            },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getFacilitiesColumns = () => [
            { name: 'School', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Facility Type', selector: row => row.metric_label || 'Unknown', sortable: true },
            { name: 'Funding Year', selector: row => row.fundingyear || 'N/A', sortable: true },
            {
                name: 'Allocation',
                selector: row => row.metric_val ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.metric_val) : 'N/A',
                sortable: true
            },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getLastMileSchoolsColumns = () => [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Total Enrolment', selector: row => row.enrollment || 0, sortable: true },
            { name: 'Classrooms Inventory', selector: row => row.inventory || 0, sortable: true },
            { name: 'Classroom Shortage', selector: row => row.shortage || 0, sortable: true },
            {
                name: 'Buildable Space',
                selector: row => row.buildable_space === '1' || row.buildable_space === 1 || row.buildable_space === 'Yes' ? 'Yes' : 'No',
                sortable: true
            },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getCongestionColumns = () => [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Region', selector: row => row.region, sortable: true, width: '120px' },
            { name: 'Division', selector: row => row.division, sortable: true, width: '150px' },
            { name: 'Total Enrolment', selector: row => row.enrollment || 0, sortable: true, width: '120px' },
            { name: 'Total Classrooms', selector: row => row.total_classrooms || '0', sortable: true },
            { name: 'Congestion Index (Normalized)', selector: row => row.congestion_index || '0.00', sortable: true },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        const getIndustriesColumns = () => [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            { name: 'Total Enrolment', selector: row => row.metric_val || 0, sortable: true },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];

        if (activeCategory === 'Teaching Deployment') return getTeachingColumns();
        if (activeCategory === 'Non-teaching Deployment') return getNonTeachingColumns();
        if (activeCategory === 'Classrooms') return getClassroomsColumns();
        if (activeCategory === 'Facilities') return getFacilitiesColumns();
        if (activeCategory === 'Last Mile Schools') return getLastMileSchoolsColumns();
        if (activeCategory === 'Congestion') return getCongestionColumns();
        if (activeCategory === 'Industries (SHS)') return getIndustriesColumns();

        return [
            { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
            {
                name: getMetricName(),
                selector: row => {
                    if (activeCategory === 'Congestion' || activeCategory === 'Last Mile Schools') return row.metric_val;
                    if (activeCategory === 'Facilities' && row.metric_val) {
                        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.metric_val);
                    }
                    if (activeCategory === 'Classrooms') return row.shortage;
                    return row.metric_label || row.shortage || row.type || row.metric_val;
                },
                sortable: true
            },
            {
                name: 'Action',
                cell: row => (
                    <div className="flex gap-2">
                        <button onClick={() => handleMarkerClick(row)} className="p-1 hover:bg-blue-100 rounded-full transition-colors" title="View Profile">
                            <Info size={14} className="text-blue-600" />
                        </button>
                    </div>
                ),
                width: '60px'
            }
        ];
    }, [activeCategory]);

    const memoizedDataTable = useMemo(() => (
        <DataTable
            columns={memoizedColumns}
            data={mapData.points}
            pagination
            highlightOnHover
            pointerOnHover
            dense
            onRowClicked={(row) => {
                setSelectedSchool(row);
                if (row.lat && row.lng) setMapFocus([Number(row.lat), Number(row.lng)]);
            }}
            noDataComponent={<div className="p-10 text-gray-400">Click "Mapping Run" to load data</div>}
            customStyles={{
                headRow: { style: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' } },
                rows: { style: { minHeight: '40px' } }
            }}
        />
    ), [mapData.points, memoizedColumns]);

    // --- Haversine Distance Utility ---
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    // --- Compute Nearby Industries (within 5km) ---
    const nearbyIndustries = useMemo(() => {
        if (activeCategory !== 'Industries (SHS)' || !selectedSchool || !mapData.industryPoints || mapData.industryPoints.length === 0) {
            return [];
        }

        const schoolLat = Number(selectedSchool.lat);
        const schoolLng = Number(selectedSchool.lng);

        if (isNaN(schoolLat) || isNaN(schoolLng)) return [];

        const nearby = mapData.industryPoints.map(ind => {
            const indLat = Number(ind.lat);
            const indLng = Number(ind.lng);
            if (isNaN(indLat) || isNaN(indLng)) return null;

            const dist = getDistance(schoolLat, schoolLng, indLat, indLng);
            return {
                ...ind,
                distance: dist
            };
        }).filter(ind => ind !== null && ind.distance <= 5.0)
            .sort((a, b) => a.distance - b.distance);

        return nearby;
    }, [selectedSchool, mapData.industryPoints, activeCategory]);

    const nearbyIndustryColumns = [
        { name: 'Company Name', selector: row => row.name, sortable: true, grow: 2 },
        { name: 'Sector', selector: row => row.sector, sortable: true },
        {
            name: 'Distance (km)',
            selector: row => row.distance.toFixed(2),
            sortable: true,
            right: true
        }
    ];

    const memoizedMap = useMemo(() => (
        <ResourceMapArea
            mapData={mapData}
            mapFocus={mapFocus}
            setSelectedSchool={setSelectedSchool}
            setMapFocus={setMapFocus}
            activeCategory={activeCategory}
            selectedSchoolIndustries={selectedSchoolIndustries}
            selectedSchool={selectedSchool}
            onMarkerClick={handleMarkerClick}
        />
    ), [mapData.points, mapFocus, activeCategory, selectedSchoolIndustries, selectedSchool]);

    return (
        <div className="flex h-full bg-white overflow-hidden relative">
            <SchoolProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                school={selectedModalSchool}
                fullProfile={fullProfile}
                loadingProfile={loadingProfile}
            />
            {/* Custom Left Sidebar (RESOURCE MAPPING FILTERS) */}
            <div className="w-[280px] bg-[#003366] shrink-0 flex flex-col h-full shadow-xl z-20">
                <div className="p-6 text-center">
                    <h2 className="text-[#FFB81C] font-black tracking-wide text-xl leading-tight">RESOURCE MAPPING<br />FILTERS</h2>
                </div>

                <div className="flex-1 p-4">
                    <div className="bg-[#004080] rounded-xl border border-[#00509e]">
                        <div className="bg-[#004b93] p-3 text-center border-b border-[#00509e]">
                            <h3 className="text-white font-bold text-sm">Data Filters</h3>
                        </div>
                        <div className="p-4 space-y-4 bg-white relative">

                            <div className="space-y-1 text-center">
                                <label className="text-xs font-bold text-gray-800">Region:</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-2 outline-none"
                                    value={localFilters.region}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalFilters({
                                            ...localFilters,
                                            region: val,
                                            division: '',
                                            legislative_district: ''
                                        });
                                    }}
                                >
                                    <option value="All Regions">All Regions</option>
                                    {dbSchema.uniRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1 text-center">
                                <label className="text-xs font-bold text-gray-800">Select a Division:</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-2 outline-none"
                                    value={localFilters.division}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalFilters({
                                            ...localFilters,
                                            division: val,
                                            legislative_district: ''
                                        });
                                    }}
                                    disabled={localFilters.region === "All Regions" || !localFilters.region}
                                >
                                    <option value="">All Divisions</option>
                                    {dbSchema.uniDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1 text-center">
                                <label className="text-xs font-bold text-gray-800">Select Legislative District(s):</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-2 outline-none"
                                    value={localFilters.legislative_district}
                                    onChange={(e) => setLocalFilters({ ...localFilters, legislative_district: e.target.value })}
                                    disabled={!localFilters.division}
                                >
                                    <option value="">All Districts</option>
                                    {dbSchema.uniLegislativeDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {activeCategory === 'Teaching Deployment' && (
                                <div className="space-y-1 text-center">
                                    <label className="text-xs font-bold text-gray-800">Select Level:</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-2 outline-none"
                                        value={localFilters.level}
                                        onChange={(e) => setLocalFilters({ ...localFilters, level: e.target.value })}
                                    >
                                        <option value="ES">ES</option>
                                        <option value="JHS">JHS</option>
                                        <option value="SHS">SHS</option>
                                    </select>
                                </div>
                            )}

                            {activeCategory === 'Facilities' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block text-center">Select Facility Category:</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setEfdDropdownOpen(!efdDropdownOpen)}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-2 flex justify-between items-center hover:bg-white transition-colors"
                                        >
                                            <span className="truncate">
                                                {localFilters.efd_type.length === 0 ? "None Selected" :
                                                    localFilters.efd_type.length === dbSchema.efdCategories.length ? "All Selected" :
                                                        localFilters.efd_type.join(", ")}
                                            </span>
                                            <span>{efdDropdownOpen ? "▲" : "▼"}</span>
                                        </button>

                                        {efdDropdownOpen && (
                                            <div className="absolute z-50 mt-1 w-full bg-white border border-[#003366] rounded shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
                                                <div className="flex gap-2 mb-2 pb-2 border-b border-gray-100">
                                                    <button
                                                        onClick={() => setLocalFilters({ ...localFilters, efd_type: dbSchema.efdCategories })}
                                                        className="flex-1 text-[9px] font-bold py-1 bg-blue-50 text-[#003366] rounded"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        onClick={() => setLocalFilters({ ...localFilters, efd_type: [] })}
                                                        className="flex-1 text-[9px] font-bold py-1 bg-gray-50 text-gray-500 rounded"
                                                    >
                                                        Deselect All
                                                    </button>
                                                </div>
                                                {(dbSchema.efdCategories.length > 0 ? dbSchema.efdCategories : ["New Construction", "Repair", "Electrification"]).map(cat => (
                                                    <label key={cat} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors group">
                                                        <input
                                                            type="checkbox"
                                                            checked={localFilters.efd_type.includes(cat)}
                                                            onChange={() => {
                                                                const current = new Set(localFilters.efd_type);
                                                                if (current.has(cat)) current.delete(cat);
                                                                else current.add(cat);
                                                                setLocalFilters({ ...localFilters, efd_type: Array.from(current) });
                                                            }}
                                                            className="w-3.5 h-3.5 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                                                        />
                                                        <span className="text-xs font-medium text-gray-700 group-hover:text-[#003366]">{cat}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        if (setFilters) {
                                            // Reset focus so map can auto-fit to the new regional/divisional extent
                                            setSelectedSchool(null);
                                            setMapFocus(null);

                                            setFilters({
                                                region: localFilters.region,
                                                division: localFilters.division,
                                                legislative_district: localFilters.legislative_district,
                                                level: activeCategory === 'Teaching Deployment' ? localFilters.level : null,
                                                efd_type: activeCategory === 'Facilities' ? localFilters.efd_type : null,
                                                resource_mapping_type: activeCategory,
                                                mapping_trigger: (filters.mapping_trigger || 0) + 1
                                            });
                                        }
                                    }}
                                    className="w-full bg-[#FFB81C] hover:bg-yellow-500 text-[#003366] font-black py-2.5 rounded shadow transition-colors text-sm"
                                >
                                    Generate Map & Data
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-y-auto">

                {/* Top Navigation Tabs */}
                <div className="bg-white px-6 pt-4 border-b border-[#003366]">
                    <div className="flex bg-[#003366] rounded-t-lg overflow-hidden">
                        {['Teaching Deployment', 'Non-teaching Deployment', 'Classrooms', 'Congestion', 'Industries (SHS)', 'Facilities', 'Last Mile Schools'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`px-4 py-2.5 text-sm font-bold transition-colors ${activeCategory === tab ? 'bg-white text-[#003366]' : 'text-blue-200 hover:text-white hover:bg-[#004080]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col max-w-[1600px] w-full mx-auto">

                    {/* Header Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-gray-800">{activeCategory} Overview</h1>
                    </div>

                    {/* Accordion Summary */}
                    {activeCategory !== 'Facilities' && activeCategory !== 'Congestion' && (
                        <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
                            <button
                                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                className="w-full bg-[#003366] text-white p-3 flex justify-between items-center outline-none"
                            >
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <BarChart2 size={16} />
                                    {activeCategory} Summary
                                </div>
                                {isSummaryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {isSummaryExpanded && (
                                <div className="p-4 bg-gray-50 flex gap-4 overflow-x-auto text-[10px]">
                                    {(() => {
                                        const summary = mapData?.summary || {};
                                        const Card = ({ title, value }) => (
                                            <div className="flex-1 min-w-[150px] bg-white rounded shadow-sm border border-gray-100 p-0 text-center flex flex-col overflow-hidden">
                                                <div className="bg-[#004b93] text-white text-[10px] font-bold p-1.5">{title}</div>
                                                <div className="p-3 text-lg font-black text-gray-800">{value !== undefined ? value : '--'}</div>
                                            </div>
                                        );

                                        if (activeCategory === 'Teaching Deployment') {
                                            return (
                                                <>
                                                    <Card title="RO Filling-up Rate" value={summary.roFillRate} />
                                                    <Card title="RO Unfilled Items" value={summary.roUnfilled} />
                                                    <Card title="SDO Filling-up Rate" value={summary.sdoFillRate} />
                                                    <Card title="SDO Unfilled Items" value={summary.sdoUnfilled} />
                                                </>
                                            );
                                        } else if (activeCategory === 'Non-teaching Deployment') {
                                            return (
                                                <>
                                                    <Card title="Reg Clustered AO II" value={summary.regClustered} />
                                                    <Card title="Reg Dedicated AO II" value={summary.regDedicated} />
                                                    <Card title="Div Clustered AO II" value={summary.divClustered} />
                                                    <Card title="Div Dedicated AO II" value={summary.divDedicated} />
                                                </>
                                            );
                                        } else if (activeCategory === 'Classrooms') {
                                            return (
                                                <>
                                                    <Card title="Regional Classroom Shortage" value={summary.regShortage} />
                                                    <Card title="Division Classroom Shortage" value={summary.divShortage} />
                                                </>
                                            );
                                        } else if (activeCategory === 'Industries (SHS)') {
                                            return (
                                                <>
                                                    <Card title="Total SHS Count" value={summary.totalSHS} />
                                                    <Card title="Total Industry Count" value={summary.totalIndustry} />
                                                </>
                                            );
                                        } else if (activeCategory === 'Last Mile Schools') {
                                            return (
                                                <>
                                                    <Card title="Total LMS by Region" value={summary.regLMS} />
                                                    <Card title="Total LMS by Division" value={summary.divLMS} />
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lower Split Sections */}
                    <div className="flex-1 flex gap-6 min-h-[500px]">

                        {/* Left Panel: Table */}
                        <div className="w-[35%] flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-[#004b93] text-white p-3 text-center border-b border-[#003366]">
                                <h3 className="font-bold text-sm">School Data List</h3>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {memoizedDataTable}
                            </div>
                        </div>

                        {/* Right Panel: Map Container */}
                        <div className="w-[65%] flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                            <div className="bg-[#004b93] text-white p-3 text-center border-b border-[#003366]">
                                <h3 className="font-bold text-sm">Personnel Deployment Mapping</h3>
                            </div>
                            <div className="flex-1 relative bg-blue-50">
                                {memoizedMap}
                            </div>
                        </div>

                    </div>

                    {/* Secondary Lower Section for SHS Industries */}
                    {activeCategory === 'Industries (SHS)' && selectedSchool && (
                        <div className="mt-6 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-[#004b93] text-white p-3 text-center border-b border-[#003366]">
                                <h3 className="font-bold text-sm">Nearby Industries within 5km of {selectedSchool.name}</h3>
                            </div>
                            <div className="p-4 overflow-auto max-h-[400px]">
                                <DataTable
                                    columns={nearbyIndustryColumns}
                                    data={nearbyIndustries}
                                    pagination
                                    highlightOnHover
                                    dense
                                    noDataComponent={<div className="p-10 text-gray-400">No industries found within 5km.</div>}
                                    customStyles={{
                                        headCells: { style: { backgroundColor: '#f3f4f6', fontWeight: 'bold', fontSize: '12px', color: '#1f2937' } },
                                        cells: { style: { fontSize: '13px' } }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Loader overlay */}
            {mapData.loading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-[#FFB81C] border-t-[#003366] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em]">Executing Mapping Run...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
