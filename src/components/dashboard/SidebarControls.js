"use client";

import { useState, useEffect } from "react";
import { Filter, Settings2, Search, Users, Home, Building, CheckSquare, AlertTriangle, Download, ListChecks, ArrowLeft, FileDown, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MultiSelectDropdown = ({ title, groups, isOpen, onToggle, filters, handleMetricToggle, onSelectAll, selectedKey = "selected_metrics" }) => {
    const selectedArray = filters?.[selectedKey] || [];
    const allOptions = groups.flatMap(g => g.options.map(o => o.id));
    const isAllSelected = allOptions.length > 0 && allOptions.every(id => selectedArray.includes(id));
    const selectedCount = groups.flatMap(g => g.options).filter(o => selectedArray.includes(o.id)).length;

    return (
        <div className="mb-4 relative border border-gray-300 rounded-lg bg-gray-50">
            <button
                onClick={onToggle}
                className="w-full text-left p-3 text-[11px] font-bold text-gray-700 flex justify-between items-center outline-none uppercase tracking-wide hover:bg-gray-100 transition-colors rounded-lg"
            >
                <span className="truncate pr-2">{title} {selectedCount > 0 && <span className="ml-1 bg-[#003366] text-white px-2 py-0.5 rounded-full text-[10px]">{selectedCount}</span>}</span>
                <span className="text-gray-400 shrink-0">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[280px] bg-white border border-[#003366] shadow-2xl rounded-lg max-h-80 overflow-y-auto left-0 origin-top overflow-x-hidden">
                    <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectAll) {
                                    onSelectAll(isAllSelected ? [] : allOptions);
                                }
                            }}
                            className="text-[10px] font-black text-[#003366] hover:text-[#CE1126] transition-colors flex items-center gap-1 px-1"
                        >
                            <ListChecks size={12} /> {isAllSelected ? "DESELECT ALL" : "SELECT ALL"}
                        </button>
                    </div>
                    {groups.map((group, idx) => (
                        <div key={idx} className="border-b border-gray-100 last:border-b-0">
                            <div className="bg-[#f0f4f8] text-[10px] font-black uppercase tracking-widest text-[#003366] px-3 py-2 border-b border-[#dce6f1]">
                                {group.group}
                            </div>
                            <div className="p-2 space-y-1">
                                {group.options.map((opt) => (
                                    <label key={opt.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors w-full group">
                                        <input
                                            type="checkbox"
                                            checked={selectedArray.includes(opt.id)}
                                            onChange={() => handleMetricToggle(opt.id)}
                                            className="w-4 h-4 rounded border-gray-400 text-[#003366] focus:ring-[#003366] cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-[#003366] truncate">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SelectDropdown = ({ label, options, field, placeholder = "All...", filters, setFilters }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
        <select
            value={filters[field] || ''}
            onChange={(e) => {
                setFilters({ [field]: e.target.value });
            }}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-[#003366] focus:border-[#003366] block p-2 outline-none appearance-none transition-all"
        >
            <option value="">{placeholder}</option>
            {options && options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default function SidebarControls({ activeTab, filters, setFilters, drillDown, goBack, isMobile, onShowMobileResults }) {
    const [resourceMappingMode, setResourceMappingMode] = useState("Standard");
    const [quickSearchAdvanced, setQuickSearchAdvanced] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
    const { role } = useAuth();

    const [dbSchema, setDbSchema] = useState({
        uniRegions: ["Region I"],
        uniDivisions: ["Div A"],
        uniDistricts: ["Dist 1"],
        uniMunicipalities: ["Muni Alpha"],
        gmisPositions: ["Loading dfGMIS Positions..."],
        efdCategories: ["Loading EFD_Projects..."],
        analyticsMap: []
    });

    const [schemaAA, setSchemaAA] = useState({ ranges: {} });

    useEffect(() => {
        // Fetch Universal App Schema
        const url = new URL(window.location.origin + "/stride-api/dropdowns");

        if (activeTab === "infra") {
            if (filters.infra_regions && filters.infra_regions.length > 0) {
                url.searchParams.append("regions", filters.infra_regions.join(','));
            }
            if (filters.infra_divisions && filters.infra_divisions.length > 0) {
                url.searchParams.append("divisions", filters.infra_divisions.join(','));
            }
        } else {
            if (filters.region && filters.region !== "All Regions") url.searchParams.append("region", filters.region);
            if (filters.division) url.searchParams.append("division", filters.division);
        }

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setDbSchema(prev => ({
                        ...prev,
                        uniRegions: res.data.uniRegions || prev.uniRegions,
                        uniDivisions: res.data.uniDivisions || prev.uniDivisions,
                        uniDistricts: res.data.uniDistricts || prev.uniDistricts,
                        uniMunicipalities: res.data.uniMunicipalities || prev.uniMunicipalities,
                        gmisPositions: res.data.gmisPositions || prev.gmisPositions,
                        efdCategories: res.data.efdCategories || prev.efdCategories
                    }));
                }
            })
            .catch(err => console.error("Error piping dataset globals:", err));

        // Fetch Advanced Analytics Specific Schema
        fetch('/stride-api/analytics-schema')
            .then(res => res.json())
            .then(res => {
                if (res.status === "success" && res.data) {
                    setSchemaAA(res.data);
                }
            })
            .catch(err => console.error("Error fetching analytics schema:", err));
    }, [filters.region, filters.division, filters.infra_regions, filters.infra_divisions, activeTab]);

    const foci = [
        { name: "Teacher Focus", icon: <Users size={18} /> },
        { name: "School Focus", icon: <Home size={18} /> },
        { name: "Infrastructure Focus", icon: <Building size={18} /> },
        { name: "Enrolment Focus", icon: <CheckSquare size={18} /> },
        { name: "Building/Room Condition", icon: <AlertTriangle size={18} /> }
    ];

    const plantillaFoci = [
        { name: "Teacher", icon: <Users size={16} /> },
        { name: "Master Teacher", icon: <Users size={16} /> },
        { name: "Principal", icon: <Users size={16} /> },
        { name: "Head Teacher", icon: <Users size={16} /> },
        { name: "Guidance Coordinator", icon: <Users size={16} /> },
        { name: "Guidance Counselor", icon: <Users size={16} /> },
        { name: "Engineer", icon: <Users size={16} /> },
        { name: "Admin Officer", icon: <Users size={16} /> },
        { name: "Admin Assistant", icon: <Users size={16} /> }
    ];

    const presetMappings = {
        "Teacher Focus": ["TotalTeachers", "TotalShortage"],
        "School Focus": ["TotalSchools", "SchoolSizeTypology", "ModifiedCOC", "Shifting"],
        "Infrastructure Focus": ["TotalClassrooms", "ClassroomRequirement", "ClassroomShortage", "BuildableSpace"],
        "Enrolment Focus": ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"],
        "Building Condition": ["BuildingCountGood", "BuildingCountNeedsMajorRepair", "BuildingCountCondemned", "BuildingCountForDemolition", "BuildingCountForCompletion", "BuildingCountOngoing"],
        "Classroom Condition": ["RoomsGood", "RoomsNeedsMajorRepair", "RoomsCondemned", "RoomsForDemolition", "RoomsForCompletion", "RoomsOngoing"]
    };

    const advancedFiltersOptions = {
        "Select Human Resource Metrics": [
            { group: "School Information", options: [{ id: "TotalSchools", label: "Number of Schools" }, { id: "SchoolSizeTypology", label: "School Size Typology" }, { id: "ModifiedCOC", label: "Curricular Offering" }, { id: "Shifting", label: "Shifting" }] },
            { group: "Teaching Data", options: [{ id: "TotalTeachers", label: "Total Teachers" }, { id: "TotalShortage", label: "Teacher Shortage" }] },
            { group: "Non-teaching Data", options: [{ id: "COS", label: "COS (Outlier Status)" }, { id: "AOII", label: "AOII Clustering Status" }] },
            { group: "Enrolment Data", options: [{ id: "TotalEnrolment", label: "Total Enrolment" }, { id: "Kinder", label: "Kinder" }, { id: "G1", label: "Grade 1" }, { id: "G2", label: "Grade 2" }, { id: "G3", label: "Grade 3" }, { id: "G4", label: "Grade 4" }, { id: "G5", label: "Grade 5" }, { id: "G6", label: "Grade 6" }, { id: "G7", label: "Grade 7" }, { id: "G8", label: "Grade 8" }, { id: "G9", label: "Grade 9" }, { id: "G10", label: "Grade 10" }, { id: "G11", label: "Grade 11" }, { id: "G12", label: "Grade 12" }] },
            { group: "Specialization Data", options: [{ id: "SpecEnglish", label: "English" }, { id: "SpecMath", label: "Mathematics" }, { id: "SpecScience", label: "Science" }, { id: "SpecBio", label: "Biological Sciences" }, { id: "SpecPhysics", label: "Physical Sciences" }] }
        ],
        "Select Infrastructure Metrics": [
            { group: "Classroom", options: [{ id: "TotalClassrooms", label: "Classrooms" }, { id: "ClassroomRequirement", label: "Classroom Requirement" }, { id: "LMS", label: "Last Mile School" }, { id: "ClassroomShortage", label: "Classroom Shortage" }, { id: "Buildings", label: "Buildings" }, { id: "BuildableSpace", label: "Buildable Space" }, { id: "MajorRepairsNeeded", label: "Major Repairs Needed" }] },
            { group: "Facilities", options: [{ id: "SeatsInventory", label: "Seats Inventory" }, { id: "SeatsShortage", label: "Seats Shortage" }] },
            { group: "Resources", options: [{ id: "OwnershipType", label: "Ownership Type" }, { id: "ElectricitySource", label: "Electricity Source" }, { id: "WaterSource", label: "Water Source" }] }
        ],
        "Select Condition Metrics": [
            { group: "Building Status", options: [{ id: "BuildingCountCondemned", label: "Condemned" }, { id: "BuildingCountForDemolition", label: "For Condemnation" }, { id: "BuildingCountForCompletion", label: "For Completion" }, { id: "BuildingCountOngoing", label: "On-going Construction" }, { id: "BuildingCountGood", label: "Good Condition" }, { id: "BuildingCountNeedsMinorRepair", label: "Minor Repairs" }, { id: "BuildingCountNeedsMajorRepair", label: "Major Repairs" }] },
            { group: "Classroom Status", options: [{ id: "RoomsCondemned", label: "Condemned" }, { id: "RoomsForDemolition", label: "For Condemnation" }, { id: "RoomsForCompletion", label: "For Completion" }, { id: "RoomsOngoing", label: "On-going Construction" }, { id: "RoomsGood", label: "Good Condition" }, { id: "RoomsNeedsMinorRepair", label: "Minor Repairs" }, { id: "RoomsNeedsMajorRepair", label: "Major Repairs" }] }
        ],
        "Infrastructure Programs": [
            { group: "Funding Logs", options: [{ id: "ProgALS_CLC", label: "ALS/CLC" }, { id: "ProgElec", label: "Electrification 2017-2024" }, { id: "ProgGabaldon", label: "Gabaldon 2020-2024" }, { id: "ProgLMS", label: "LMS 2020-2024" }, { id: "ProgNC", label: "NC" }, { id: "ProgQRF", label: "QRF" }, { id: "ProgRepair", label: "Repair" }, { id: "ProgSPED", label: "SPED/ILRC" }] }
        ]
    };

    const handlePresetToggle = (preset) => {
        setFilters({ dashboard_preset: preset, selected_metrics: presetMappings[preset] || [] });
    };

    const handleMetricToggle = (metricId) => {
        const current = new Set(filters.selected_metrics || []);
        if (current.has(metricId)) {
            current.delete(metricId);
        } else {
            current.add(metricId);
        }
        setFilters({ dashboard_preset: null, selected_metrics: Array.from(current) });
    };

    const handleMetricSelectAll = (allIds) => {
        setFilters({ dashboard_preset: null, selected_metrics: allIds });
    };

    const handlePlantillaPresetToggle = (presetName) => {
        let matched = [];
        if (presetName === "Teacher") {
            matched = ["Teacher I", "Teacher II", "Teacher III", "Special Science Teacher I", "Special Science Teacher II"];
        } else if (presetName === "Master Teacher") {
            matched = ["Master Teacher I", "Master Teacher II", "Master Teacher III", "Master Teacher IV"];
        } else if (presetName === "Principal") {
            matched = ["School Principal I", "School Principal II", "School Principal III", "School Principal IV"];
        } else if (presetName === "Head Teacher") {
            matched = ["Head Teacher I", "Head Teacher II", "Head Teacher III", "Head Teacher IV", "Head Teacher V", "Head Teacher VI"];
        } else if (presetName === "Guidance Coordinator") {
            matched = ["Guidance Coordinator I", "Guidance Coordinator II", "Guidance Coordinator III"];
        } else if (presetName === "Guidance Counselor") {
            matched = ["Guidance Counselor I", "Guidance Counselor II", "Guidance Counselor III"];
        } else if (presetName === "Engineer") {
            matched = ["Engineer II", "Engineer III", "Engineer IV", "Engineer V"];
        } else if (presetName === "Admin Officer") {
            matched = ["Administrative Officer I", "Administrative Officer II", "Administrative Officer III", "Administrative Officer IV", "Administrative Officer V", "Chief Administrative Officer", "Supervising Administrative Officer "];
        } else if (presetName === "Admin Assistant") {
            matched = ["Administrative Assistant I", "Administrative Assistant II", "Administrative Assistant III", "Administrative Assistant V", "Administrative Assistant VI", "Senior Administrative Assistant I", "Senior Administrative Assistant II", "Senior Administrative Assistant III", "Senior Administrative Assistant V"];
        }

        if (filters.plantilla_preset === presetName) {
            setFilters({ plantilla_preset: null, selected_positions: [] });
        } else {
            setFilters({ plantilla_preset: presetName, selected_positions: matched });
        }
    };

    const handleExplorerToggle = (domain, colId) => {
        const currentSelections = { ...(filters.data_explorer_selections || {}) };
        const domainColIds = currentSelections[domain] || [];

        let nextIds;
        if (domainColIds.includes(colId)) {
            nextIds = domainColIds.filter(id => id !== colId);
        } else {
            nextIds = [...domainColIds, colId];
        }

        setFilters({
            data_explorer_selections: {
                ...currentSelections,
                [domain]: nextIds
            }
        });
    };

    const explorerDomainOptions = {
        "School Information Data Toggles": [
            { group: "Categorization", options: [{ id: "school_size_typology", label: "School Size Typology" }, { id: "curricular_offering", label: "Curricular Offering" }] }
        ],
        "Teaching Data Toggles": [
            { group: "Staff Counts", options: [{ id: "totalteachers", label: "Total Teachers" }, { id: "total_excess", label: "Teacher Excess" }, { id: "total_shortage", label: "Teacher Shortage" }] }
        ],
        "Non-teaching Data Toggles": [
            { group: "Staff Counts", options: [{ id: "outlier_status", label: "COS" }, { id: "clustering_status", label: "AOII Clustering Status" }] }
        ],
        "Enrolment Data Toggles": [
            {
                group: "By Level", options: [
                    { id: "totalenrolment", label: "Total Enrolment" },
                    { id: "kinder", label: "Kinder" }, { id: "g1", label: "Grade 1" }, { id: "g2", label: "Grade 2" }, { id: "g3", label: "Grade 3" },
                    { id: "g4", label: "Grade 4" }, { id: "g5", label: "Grade 5" }, { id: "g6", label: "Grade 6" },
                    { id: "g7", label: "Grade 7" }, { id: "g8", label: "Grade 8" }, { id: "g9", label: "Grade 9" }, { id: "g10", label: "Grade 10" },
                    { id: "g11", label: "Grade 11" }, { id: "g12", label: "Grade 12" }
                ]
            }
        ],
        "Specialization Data Toggles": [
            {
                group: "Specialization", options: [
                    { id: "english", label: "English" }, { id: "mathematics", label: "Mathematics" },
                    { id: "science", label: "Science" }, { id: "biological_sciences", label: "Biological Sciences" },
                    { id: "physical_sciences", label: "Physical Sciences" }, { id: "general_ed", label: "General Ed" },
                    { id: "araling_panlipunan", label: "Araling Panlipunan" }, { id: "tle", label: "TLE" },
                    { id: "mapeh", label: "MAPEH" }, { id: "filipino", label: "Filipino" },
                    { id: "esp", label: "ESP" }, { id: "agriculture", label: "Agriculture" },
                    { id: "ece", label: "ECE" }, { id: "sped", label: "SPED" }
                ]
            }
        ],
        "Infrastructure Data Toggles": [
            { group: "Classrooms", options: [{ id: "instructional_rooms_2023_2024", label: "Classrooms" }, { id: "classroom_requirement", label: "Classroom Requirement" }, { id: "classroom_shortage", label: "Classroom Shortage" }] },
            { group: "Buildings & Space", options: [{ id: "buildings", label: "Buildings" }, { id: "buidable_space", label: "Buildable Space" }, { id: "major_repair_2023_2024", label: "Major Repairs Needed" }] },
            { group: "Other", options: [{ id: "total_seats_2023_2024", label: "Seats Inventory" }, { id: "total_seats_shortage_2023_2024", label: "Seats Shortage" }] },
            { group: "Utilities", options: [{ id: "ownershiptype", label: "Ownership Type" }, { id: "electricitysource", label: "Electricity Source" }, { id: "watersource", label: "Water Source" }] }
        ]
    };

    const explorerDomainToFilterKey = {
        "School Information Data Toggles": "School Info",
        "Teaching Data Toggles": "Teaching Data",
        "Non-teaching Data Toggles": "Non-Teaching",
        "Enrolment Data Toggles": "Enrolment",
        "Specialization Data Toggles": "Specialization",
        "Infrastructure Data Toggles": "Infrastructure"
    };

    const handlePositionToggle = (posId) => {
        const current = new Set(filters.selected_positions || []);
        if (current.has(posId)) {
            current.delete(posId);
        } else {
            current.add(posId);
        }
        setFilters({ selected_positions: Array.from(current), plantilla_preset: null });
    };

    const handlePositionSelectAll = (allIds) => {
        setFilters({ selected_positions: allIds, plantilla_preset: null });
    };

    const handleGenericMultiToggle = (key, val) => {
        const current = new Set(filters[key] || []);
        if (current.has(val)) {
            current.delete(val);
        } else {
            current.add(val);
        }

        // Cascading reset logic: If regions change, reset divisions.
        if (key === 'infra_regions') {
            setFilters({ [key]: Array.from(current), infra_divisions: [] });
        } else {
            setFilters({ [key]: Array.from(current) });
        }
    };

    const handleGenericSelectAll = (key, allOptions) => {
        if (key === 'infra_regions') {
            setFilters({ [key]: allOptions, infra_divisions: [] });
        } else {
            setFilters({ [key]: allOptions });
        }
    };

    if (activeTab === "resource_mapping") return null;

    return (
        <aside className="w-full lg:w-72 bg-white lg:border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto flex flex-col shrink-0 relative">
            <div className="p-4 bg-[#003366] text-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Operational Logic</span>
                    <div className="p-1.5 bg-white/10 rounded-full cursor-pointer hover:bg-white/20"><Settings2 size={12} /></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-[9px] text-blue-300 font-bold uppercase tracking-tighter">Current Scope</p>
                        <h2 className="text-sm font-bold truncate">
                            {filters.drillLevel === 'National' ? 'National View' :
                                filters.drillLevel === 'DistrictGroup' ? `District Group: ${filters.municipality || filters.legislative_district}` :
                                    `${filters.drillLevel}: ${filters[filters.drillLevel.toLowerCase()] || filters.region}`}
                        </h2>
                    </div>
                    {filters.history.length > 0 && (
                        <button
                            onClick={goBack}
                            className="bg-[#CE1126] hover:bg-red-800 text-white p-2 rounded-lg shadow-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                        >
                            <ArrowLeft size={12} /> BACK
                        </button>
                    )}
                </div>
            </div>



            <div className="flex-1 p-5 space-y-6">

                {/* 1A. Education Resource Dashboard */}
                {activeTab === "interactive" && (
                    <div className="space-y-6">
                        {/* A. Dashboard Presets */}
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Dashboard Presets</h3>
                            <div className="space-y-2">
                                {Object.keys(presetMappings).map(preset => (
                                    <label key={preset} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${filters.dashboard_preset === preset ? 'bg-blue-50 border-blue-200 text-[#003366]' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                        <input
                                            type="radio"
                                            name="dashboardPreset"
                                            className="w-4 h-4 text-[#003366] border-gray-300 focus:ring-[#003366] bg-white cursor-pointer"
                                            checked={filters.dashboard_preset === preset}
                                            onChange={() => handlePresetToggle(preset)}
                                        />
                                        <span className="text-sm font-bold">{preset}</span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* B. Advanced Filters (Granular) */}
                        <section className="space-y-3 pt-4 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between items-center">
                                Advanced Dropdowns
                                {(filters.selected_metrics || []).length > 0 && !filters.dashboard_preset && (
                                    <button onClick={() => setFilters({ selected_metrics: [] })} className="text-[9px] text-red-500 hover:underline">Clear Mix</button>
                                )}
                            </h3>

                            {Object.entries(advancedFiltersOptions).map(([title, groups]) => (
                                <MultiSelectDropdown
                                    key={title}
                                    title={title}
                                    groups={groups}
                                    isOpen={openDropdown === title}
                                    onToggle={() => setOpenDropdown(openDropdown === title ? null : title)}
                                    filters={filters}
                                    handleMetricToggle={handleMetricToggle}
                                    onSelectAll={handleMetricSelectAll}
                                />
                            ))}
                        </section>

                        {/* C. Action Controls */}
                        <section className="pt-4 border-t border-gray-100 space-y-3">
                            <button
                                disabled={role === 'guest'}
                                title={role === 'guest' ? "Downloads are disabled for Guest accounts" : "Generate Dashboard Report"}
                                onClick={() => setFilters({ report_trigger: Date.now() })}
                                className={`w-full flex items-center justify-center gap-2 font-black py-3 px-4 rounded-xl shadow border text-xs transition-all ${role === 'guest' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-[#FFB81C] hover:bg-yellow-500 text-[#003366] border-yellow-600/20'}`}
                            >
                                <FileDown size={16} /> GENERATE REPORT
                            </button>

                            {filters.drillLevel !== 'National' && (
                                <button
                                    onClick={() => setFilters({ drillLevel: 'National', region: 'All Regions', division: '', history: [] })}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl shadow-sm text-xs border border-gray-200 transition-all"
                                >
                                    <Home size={14} className="text-[#CE1126]" /> GO BACK TO REGIONAL VIEW
                                </button>
                            )}
                        </section>
                    </div>
                )}

                {/* 1C. Plantilla Positions */}
                {activeTab === "plantilla" && (
                    <section className="space-y-6">

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Position Presets</h3>
                            <div className="space-y-2 mb-6">
                                {plantillaFoci.map((p) => (
                                    <label key={p.name} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${filters.plantilla_preset === p.name ? 'bg-blue-50 border-blue-200 text-[#003366]' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                        <input
                                            type="radio"
                                            name="plantillaPreset"
                                            checked={filters.plantilla_preset === p.name}
                                            onChange={() => handlePlantillaPresetToggle(p.name)}
                                            className="w-4 h-4 text-[#003366] border-gray-300 focus:ring-[#003366] bg-white cursor-pointer"
                                        />
                                        <span className="text-sm font-bold">{p.name}</span>
                                    </label>
                                ))}
                            </div>

                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between items-center">
                                Specific Positions
                                {(filters.selected_positions || []).length > 0 && !filters.plantilla_preset && (
                                    <button onClick={() => setFilters({ selected_positions: [] })} className="text-[9px] text-red-500 hover:underline">Clear</button>
                                )}
                            </h3>
                            <MultiSelectDropdown
                                title="Select Plantilla Items"
                                groups={[{ group: "Positions", options: dbSchema.gmisPositions.map(p => ({ id: p, label: p })) }]}
                                isOpen={openDropdown === "plantilla_positions"}
                                onToggle={() => setOpenDropdown(openDropdown === "plantilla_positions" ? null : "plantilla_positions")}
                                filters={filters}
                                handleMetricToggle={handlePositionToggle}
                                onSelectAll={handlePositionSelectAll}
                                selectedKey="selected_positions"
                            />

                            <div className="pt-4 border-t border-gray-100 mt-6 pb-20 lg:pb-0">
                                <button
                                    disabled={role === 'guest'}
                                    title={role === 'guest' ? "Downloads are disabled for Guest accounts" : "Generate Plantilla Report"}
                                    onClick={() => setFilters({ report_trigger: Date.now() })}
                                    className={`w-full flex items-center justify-center gap-2 font-black py-3 px-4 rounded-xl shadow border text-xs transition-all ${role === 'guest' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-[#FFB81C] hover:bg-yellow-500 text-[#003366] border-yellow-600/20'}`}
                                >
                                    <FileDown size={16} /> GENERATE REPORT
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* 1D. Infrastructure and Education Facilities */}
                {activeTab === "infra" && (
                    <section className="space-y-4">
                        <MultiSelectDropdown
                            title="Filter by Region"
                            groups={[{ group: "Regions", options: dbSchema.uniRegions.map(p => ({ id: p, label: p })) }]}
                            isOpen={openDropdown === "infra_regions"}
                            onToggle={() => setOpenDropdown(openDropdown === "infra_regions" ? null : "infra_regions")}
                            filters={filters}
                            handleMetricToggle={(val) => handleGenericMultiToggle("infra_regions", val)}
                            onSelectAll={(all) => handleGenericSelectAll("infra_regions", all)}
                            selectedKey="infra_regions"
                        />
                        <MultiSelectDropdown
                            title="Filter by Division"
                            groups={[{ group: "Divisions", options: dbSchema.uniDivisions.map(p => ({ id: p, label: p })) }]}
                            isOpen={openDropdown === "infra_divisions"}
                            onToggle={() => setOpenDropdown(openDropdown === "infra_divisions" ? null : "infra_divisions")}
                            filters={filters}
                            handleMetricToggle={(val) => handleGenericMultiToggle("infra_divisions", val)}
                            onSelectAll={(all) => handleGenericSelectAll("infra_divisions", all)}
                            selectedKey="infra_divisions"
                        />
                        <MultiSelectDropdown
                            title="Program Category"
                            groups={[{ group: "Funding Programs", options: dbSchema.efdCategories.map(p => ({ id: p, label: p })) }]}
                            isOpen={openDropdown === "infra_categories"}
                            onToggle={() => setOpenDropdown(openDropdown === "infra_categories" ? null : "infra_categories")}
                            filters={filters}
                            handleMetricToggle={(val) => handleGenericMultiToggle("infra_categories", val)}
                            onSelectAll={(all) => handleGenericSelectAll("infra_categories", all)}
                            selectedKey="infra_categories"
                        />

                        <div className="pt-4 border-t border-gray-100 mt-6 pb-20 lg:pb-0">
                            <button
                                disabled={role === 'guest'}
                                title={role === 'guest' ? "Downloads are disabled for Guest accounts" : "Generate Infrastructure Report"}
                                onClick={() => setFilters({ report_trigger: Date.now() })}
                                className={`w-full flex items-center justify-center gap-2 font-black py-3 px-4 rounded-xl shadow border text-xs transition-all ${role === 'guest' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-[#CE1126] hover:bg-red-800 text-white border-red-900/20'}`}
                            >
                                <FileDown size={16} /> GENERATE REPORT
                            </button>
                        </div>
                    </section>
                )}

                {/* 1E. Advanced Analytics Query Engine */}
                {activeTab === "advanced_analytics" && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center bg-[#003366] text-white p-3 rounded-xl shadow-md">
                            <span className="text-[10px] font-black uppercase tracking-widest">Query Engine</span>
                            <Settings2 size={14} className="opacity-80" />
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected Variables</p>
                            {(filters.aa_variables || []).map((v, i) => {
                                const isNumeric = schemaAA.ranges && Object.keys(schemaAA.ranges).includes(v.column);
                                const isCategorical = schemaAA[v.column] !== undefined;

                                return (
                                    <div key={v.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 relative shadow-sm">
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-[#003366] mb-1 block uppercase">Select Column</label>
                                                <select
                                                    value={v.column}
                                                    onChange={(e) => {
                                                        const newVars = [...(filters.aa_variables || [])];
                                                        const newCol = e.target.value;
                                                        newVars[i].column = newCol;

                                                        // Auto-populate default min/max or selected values
                                                        if (schemaAA.ranges && schemaAA.ranges[newCol]) {
                                                            newVars[i].min = Math.max(1, schemaAA.ranges[newCol][0]);
                                                            newVars[i].max = schemaAA.ranges[newCol][1];
                                                            delete newVars[i].values;
                                                        } else if (schemaAA[newCol]) {
                                                            newVars[i].values = [...schemaAA[newCol]]; // Default to all selected
                                                            delete newVars[i].min;
                                                            delete newVars[i].max;
                                                        }
                                                        setFilters({ aa_variables: newVars });
                                                    }}
                                                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs text-gray-800 font-bold outline-none focus:ring-[#003366] focus:border-[#003366] transition-all"
                                                >
                                                    <option value="">-- Select Variable --</option>
                                                    {[
                                                        { val: "school_type", label: "School Type" },
                                                        { val: "curricular_offering", label: "Curricular Offering" },
                                                        { val: "with_buildable_space", label: "Buildable Space" },
                                                        { val: "totalenrolment", label: "Total Enrolment" },
                                                        { val: "totalteachers", label: "Total Teachers" },
                                                        { val: "es_teachers", label: "ES Teachers" },
                                                        { val: "jhs_teachers", label: "JHS Teachers" },
                                                        { val: "shs_teachers", label: "SHS Teachers" },
                                                        { val: "total_shortage", label: "Teacher Shortage" },
                                                        { val: "classroom_shortage", label: "Classroom Shortage" },
                                                        { val: "number_of_rooms_good_condition", label: "Rooms in Good Condition" }
                                                    ].map(col => (
                                                        <option key={col.val} value={col.val}>{col.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newVars = (filters.aa_variables || []).filter((_, idx) => idx !== i);
                                                    setFilters({ aa_variables: newVars });
                                                }}
                                                className="mt-5 p-2 bg-[#CE1126] text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center"
                                                title="Remove Variable"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Dynamic Sub-inputs based on Column Type */}
                                        {isNumeric && (
                                            <div className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase">Min:</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={v.min !== undefined ? v.min : (Math.max(1, schemaAA.ranges[v.column][0]) || 1)}
                                                        onChange={(e) => {
                                                            const newVars = [...(filters.aa_variables || [])];
                                                            const val = Number(e.target.value);
                                                            newVars[i].min = val < 1 ? 1 : val;
                                                            setFilters({ aa_variables: newVars });
                                                        }}
                                                        className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs focus:border-[#003366] outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase">Max:</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={v.max !== undefined ? v.max : (schemaAA.ranges[v.column][1] || 1)}
                                                        onChange={(e) => {
                                                            const newVars = [...(filters.aa_variables || [])];
                                                            const val = Number(e.target.value);
                                                            newVars[i].max = val < 1 ? 1 : val;
                                                            setFilters({ aa_variables: newVars });
                                                        }}
                                                        className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs focus:border-[#003366] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {isCategorical && (
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase">Select Value(s):</label>
                                                <div className="grid grid-cols-2 gap-2 mt-2 bg-white p-2 rounded border border-gray-200">
                                                    {schemaAA[v.column].map(opt => (
                                                        <label key={opt} className="flex items-center gap-2 text-[10px] cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={(v.values || schemaAA[v.column]).includes(opt)}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    const currentValues = v.values || [...schemaAA[v.column]];
                                                                    const newVars = [...(filters.aa_variables || [])];

                                                                    if (isChecked) {
                                                                        newVars[i].values = [...currentValues, opt];
                                                                    } else {
                                                                        newVars[i].values = currentValues.filter(val => val !== opt);
                                                                    }
                                                                    setFilters({ aa_variables: newVars });
                                                                }}
                                                                className="rounded text-[#003366] focus:ring-[#003366]"
                                                            />
                                                            <span className="truncate">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(filters.aa_variables || []).length === 0 && (
                                <p className="text-xs italic text-gray-400">No variables structured yet. Add a filter to begin.</p>
                            )}

                            <button
                                onClick={() => {
                                    const newVars = [...(filters.aa_variables || []), { id: Date.now() + Math.random(), column: "" }];
                                    setFilters({ aa_variables: newVars });
                                }}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-[#003366] font-bold text-xs rounded-xl border border-gray-200 transition-colors shadow-sm"
                            >
                                + Add another variable
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-4 pb-20 lg:pb-0">
                            <button
                                onClick={() => setFilters({ aa_trigger: Date.now() })}
                                className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#eab308] text-[#003366] font-black py-3 px-4 rounded-xl transition-all shadow-md text-[10px] uppercase tracking-wider"
                            >
                                <Settings2 size={16} /> Analyze and Plot
                            </button>
                        </div>
                    </section>
                )}

                {/* 2. Quick Search */}
                {activeTab === "search" && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-4 bg-gray-100 p-1.5 rounded-lg">
                            <button
                                onClick={() => {
                                    setQuickSearchAdvanced(false);
                                    setFilters({ q: '', region: 'All Regions', division: '', district: '', municipality: '' });
                                }}
                                className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${!quickSearchAdvanced ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-[#003366]'}`}
                            >
                                SIMPLE
                            </button>
                            <button
                                onClick={() => {
                                    setQuickSearchAdvanced(true);
                                    setFilters({ q: '', region: 'All Regions', division: '', district: '', municipality: '' });
                                }}
                                className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${quickSearchAdvanced ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-[#003366]'}`}
                            >
                                ADVANCED
                            </button>
                        </div>

                        {quickSearchAdvanced && (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-1">
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-600 mb-1 tracking-tight">Search School Name / ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366] transition-colors">
                                            <Search size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Keyword or ID..."
                                            value={filters.q || ''}
                                            onChange={(e) => setFilters({ q: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-[#003366] block pl-9 p-2 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        />
                                    </div>
                                </div>
                                <SelectDropdown label="Region" field="region" options={dbSchema.uniRegions} placeholder="All Regions" filters={filters} setFilters={setFilters} />
                                <SelectDropdown label="Division" field="division" options={dbSchema.uniDivisions} filters={filters} setFilters={setFilters} />
                                <SelectDropdown label="District" field="district" options={dbSchema.uniDistricts} filters={filters} setFilters={setFilters} />
                                <SelectDropdown label="Municipality" field="municipality" options={dbSchema.uniMunicipalities} filters={filters} setFilters={setFilters} />
                            </div>
                        )}

                        {!quickSearchAdvanced && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                                <Search className="mx-auto text-blue-400 mb-2" size={24} />
                                <p className="text-[10px] font-bold text-blue-800 uppercase leading-tight mb-3">Fast Lookup Mode</p>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Type School Name or ID..."
                                        value={filters.q || ''}
                                        onChange={(e) => setFilters({ q: e.target.value })}
                                        className="w-full text-sm py-2 px-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {!isMobile && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setFilters({ q: '', region: 'All Regions', division: '', district: '', municipality: '' })}
                                    className="flex-1 text-xs font-bold py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200 shadow-sm"
                                >
                                    CLEAR
                                </button>
                                <button
                                    disabled={!filters.q && (!filters.region || filters.region === 'All Regions')}
                                    onClick={() => setFilters({ triggerSearch: Date.now() })}
                                    className="flex-[2] flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md text-xs"
                                >
                                    <Search size={14} />
                                    SHOW SELECTION
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* 3. Resource Mapping */}
                {activeTab === "resource_mapping" && (
                    <section className="space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilters({ resource_view_mode: "Standard" })}
                                className={`flex-1 text-[10px] py-1.5 font-black rounded transition-all ${filters.resource_view_mode === "Standard" ? "bg-white shadow-sm text-[#003366]" : "text-gray-500 hover:text-[#003366]"}`}
                            >
                                STANDARD VIEW
                            </button>
                            <button
                                onClick={() => setFilters({ resource_view_mode: "Immersive" })}
                                className={`flex-1 text-[10px] py-1.5 font-black rounded transition-all ${filters.resource_view_mode === "Immersive" ? "bg-white shadow-sm text-[#003366]" : "text-gray-500 hover:text-[#003366]"}`}
                            >
                                IMMERSIVE VIEW
                            </button>
                        </div>

                        {filters.resource_view_mode === "Standard" ? (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                <SelectDropdown
                                    label="Resource Category"
                                    field="resource_mapping_type"
                                    options={["Teaching Deployment", "Infrastructure", "Senior High Industries", "Last Mile Schools"]}
                                    placeholder="Select Resource..."
                                    filters={filters}
                                    setFilters={setFilters}
                                />

                                {filters.resource_mapping_type === "Teaching Deployment" && (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                        <h4 className="text-[10px] font-bold text-red-800 uppercase mb-2">Refine Status</h4>
                                        <div className="space-y-1.5">
                                            {["Shortage", "Excess", "Balanced"].map(s => (
                                                <label key={s} className="flex items-center gap-2 text-xs font-medium text-red-900 cursor-pointer">
                                                    <input type="checkbox" defaultChecked className="rounded text-red-600 focus:ring-red-600" /> {s}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {filters.resource_mapping_type === "Infrastructure" && (
                                    <div className="space-y-3">
                                        <MultiSelectDropdown
                                            title="Facility Category"
                                            groups={[{
                                                group: "Select Facility Type",
                                                options: (dbSchema.efdCategories || []).map(cat => ({ id: cat, label: cat }))
                                            }]}
                                            isOpen={openDropdown === "efd"}
                                            onToggle={() => setOpenDropdown(openDropdown === "efd" ? null : "efd")}
                                            filters={filters}
                                            handleMetricToggle={handleEfdToggle}
                                            selectedKey="efd_type"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setFilters({ efd_type: dbSchema.efdCategories })}
                                                className="flex-1 text-[9px] font-bold py-1.5 bg-gray-100 hover:bg-gray-200 text-[#003366] rounded border border-gray-200 transition-colors uppercase"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={() => setFilters({ efd_type: [] })}
                                                className="flex-1 text-[9px] font-bold py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 transition-colors uppercase"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Completed", "Ongoing"].map(s => (
                                                <button key={s} className="text-[9px] font-bold py-1.5 border border-gray-200 rounded hover:bg-white transition-colors">{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <SelectDropdown label="SDO / Division" field="division" options={dbSchema.uniDivisions} filters={filters} setFilters={setFilters} />

                                <button
                                    onClick={() => setFilters({ mapping_trigger: Date.now() })}
                                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#eab308] text-[#003366] font-black py-3 px-4 rounded-lg transition-all shadow-md text-[10px] uppercase tracking-wider"
                                >
                                    <MapPin size={14} />
                                    Mapping Run
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                <SelectDropdown
                                    label="Spatial Intelligence Layer"
                                    field="active_layer"
                                    options={["All Schools", "Last Mile School", "Teacher Shortage", "Classroom Shortage"]}
                                    placeholder="Choose Layer..."
                                    filters={filters}
                                    setFilters={setFilters}
                                />
                                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-white">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Layer Overview</p>
                                    <p className="text-[10px] leading-relaxed opacity-80 italic">Optimized for nationwide rendering of 48,000+ school pins with sub-second cluster performance.</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 5A. Data Explorer (Information Database) */}
                {activeTab === "data_explorer" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4 bg-[#003366] p-3 rounded-xl text-white shadow-lg">
                            <Settings2 size={18} className="text-[#FFB81C]" />
                            <h3 className="text-xs font-black uppercase tracking-tight">Report Builder Config</h3>
                        </div>

                        {/* A. Geo Filters */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Scope Selection</h3>
                            <SelectDropdown
                                label="Select a Region:"
                                field="region"
                                options={dbSchema.uniRegions}
                                placeholder="All Regions"
                                filters={filters}
                                setFilters={setFilters}
                            />

                            <MultiSelectDropdown
                                title="Select a Division:"
                                groups={[{ group: "Divisions", options: dbSchema.uniDivisions.map(d => ({ id: d, label: d })) }]}
                                isOpen={openDropdown === "explorer_divisions"}
                                onToggle={() => setOpenDropdown(openDropdown === "explorer_divisions" ? null : "explorer_divisions")}
                                filters={filters}
                                handleMetricToggle={(val) => {
                                    const current = new Set(filters.explorer_divisions || []);
                                    if (current.has(val)) current.delete(val);
                                    else current.add(val);
                                    setFilters({ explorer_divisions: Array.from(current) });
                                }}
                                selectedKey="explorer_divisions"
                            />
                        </section>

                        {/* B. Data Toggles */}
                        <section className="space-y-3 pt-4 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Data Toggles</h3>

                            {Object.entries(explorerDomainOptions).map(([title, groups]) => {
                                const filterKey = explorerDomainToFilterKey[title];
                                return (
                                    <MultiSelectDropdown
                                        key={title}
                                        title={title}
                                        groups={groups}
                                        isOpen={openDropdown === title}
                                        onToggle={() => setOpenDropdown(openDropdown === title ? null : title)}
                                        filters={{ ...filters, explorer_selections: filters.data_explorer_selections?.[filterKey] || [] }}
                                        handleMetricToggle={(colId) => handleExplorerToggle(filterKey, colId)}
                                        selectedKey="explorer_selections"
                                    />
                                );
                            })}
                        </section>

                        <div className="mt-6 p-4 bg-[#CE1126]/5 rounded-xl border border-[#CE1126]/10">
                            <h4 className="text-[10px] font-black text-[#CE1126] uppercase mb-2">Authenticated View</h4>
                            <p className="text-[10px] text-gray-600 leading-relaxed italic">Restricted data domain access. Exports are logged for security compliance.</p>
                        </div>
                    </div>
                )}

            </div>

            {/* Mobile Fixed Bottom Bar */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-50 animate-slide-up">
                    <button
                        onClick={onShowMobileResults}
                        className="w-full bg-[#003366] text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
                    >
                        Show Selected Data
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </aside>
    );
}
