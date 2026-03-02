"use client";

import { useState, useEffect } from "react";
import { Filter, Settings2, Search, Users, Home, Building, CheckSquare, AlertTriangle, Download, ListChecks, ArrowLeft, FileDown } from "lucide-react";

const MultiSelectDropdown = ({ title, groups, isOpen, onToggle, filters, handleMetricToggle }) => {
    const selectedCount = groups.flatMap(g => g.options).filter(o => (filters?.selected_metrics || []).includes(o.id)).length;

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
                                            checked={(filters?.selected_metrics || []).includes(opt.id)}
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

export default function SidebarControls({ activeTab, filters, setFilters, drillDown, goBack }) {
    const [resourceMappingMode, setResourceMappingMode] = useState("Standard");
    const [quickSearchAdvanced, setQuickSearchAdvanced] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

    const [dbSchema, setDbSchema] = useState({
        uniRegions: ["Region I"],
        uniDivisions: ["Div A"],
        uniDistricts: ["Dist 1"],
        uniMunicipalities: ["Muni Alpha"],
        gmisPositions: ["Loading dfGMIS Positions..."],
        efdCategories: ["Loading EFD_Projects..."],
        analyticsMap: []
    });

    useEffect(() => {
        fetch("/api/dropdowns")
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setDbSchema(res.data);
                }
            })
            .catch(err => console.error("Error piping dataset globals:", err));
    }, []);

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
        { name: "Admin Officer", icon: <Users size={16} /> }
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

    return (
        <aside className="w-64 lg:w-72 bg-white border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto flex flex-col shrink-0">
            {/* HIERARCHICAL NAVIGATION BAR */}
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
                                />
                            ))}
                        </section>

                        {/* C. Action Controls */}
                        <section className="pt-4 border-t border-gray-100 space-y-3">
                            <button className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-yellow-500 text-[#003366] font-black py-3 px-4 rounded-xl shadow border border-yellow-600/20 text-xs transition-all">
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
                    <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Position Presets</h3>
                        <div className="space-y-1.5 mb-6">
                            {plantillaFoci.map((p) => (
                                <label key={p.name} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" className="rounded text-[#003366] focus:ring-[#003366]" />
                                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                </label>
                            ))}
                        </div>
                        <SelectDropdown label="Specific Title Lookup" field="position" placeholder="Search positions..." options={dbSchema.gmisPositions} filters={filters} setFilters={setFilters} />
                    </section>
                )}

                {/* 1D. Infrastructure and Education Facilities */}
                {activeTab === "infra" && (
                    <section>
                        <SelectDropdown label="Program Category" field="infra_category" options={dbSchema.efdCategories} filters={filters} setFilters={setFilters} />
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <h4 className="text-[10px] font-bold text-orange-700 uppercase mb-1">Status Filter</h4>
                            <div className="space-y-1">
                                {["Ongoing", "Completed", "Cancelled", "Suspended"].map(s => (
                                    <label key={s} className="flex items-center gap-2 text-xs text-orange-800">
                                        <input type="checkbox" defaultChecked className="rounded text-orange-600" /> {s}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. Quick Search */}
                {activeTab === "search" && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-4 bg-gray-100 p-1.5 rounded-lg">
                            <button
                                onClick={() => setQuickSearchAdvanced(false)}
                                className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${!quickSearchAdvanced ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-[#003366]'}`}
                            >
                                SIMPLE
                            </button>
                            <button
                                onClick={() => setQuickSearchAdvanced(true)}
                                className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${quickSearchAdvanced ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-[#003366]'}`}
                            >
                                ADVANCED
                            </button>
                        </div>

                        {quickSearchAdvanced && (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-1">
                                <SelectDropdown label="Region" field="region" options={dbSchema.uniRegions} placeholder="All Regions" />
                                <SelectDropdown label="Division" field="division" options={dbSchema.uniDivisions} />
                                <SelectDropdown label="District" field="district" options={dbSchema.uniDistricts} />
                                <SelectDropdown label="Municipality" field="municipality" options={dbSchema.uniMunicipalities} />
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

                        <button
                            onClick={() => setFilters({ triggerSearch: Date.now() })}
                            className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md text-xs mt-2"
                        >
                            <Search size={14} />
                            SHOW SELECTION
                        </button>
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
                                        <SelectDropdown label="Infrastructure Project" field="infra_category" options={dbSchema.efdCategories} />
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Completed", "Ongoing"].map(s => (
                                                <button key={s} className="text-[9px] font-bold py-1.5 border border-gray-200 rounded hover:bg-white transition-colors">{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <SelectDropdown label="SDO / Division" field="division" options={dbSchema.uniDivisions} />

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
                                />
                                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-white">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Layer Overview</p>
                                    <p className="text-[10px] leading-relaxed opacity-80 italic">Optimized for nationwide rendering of 48,000+ school pins with sub-second cluster performance.</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 5A. Data Explorer - Dynamic Report Builder */}
                {activeTab === "data_explorer" && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 bg-[#003366] p-3 rounded-xl text-white shadow-lg">
                            <Settings2 size={18} className="text-[#FFB81C]" />
                            <h3 className="text-xs font-black uppercase tracking-tight">Report Builder Config</h3>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Select Data Domains</p>
                            {Object.keys(filters.data_explorer_domains).map(cat => (
                                <label key={cat} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${filters.data_explorer_domains[cat] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${filters.data_explorer_domains[cat] ? 'bg-[#003366]' : 'bg-gray-300'}`}></div>
                                        <span className={`text-xs font-bold ${filters.data_explorer_domains[cat] ? 'text-[#003366]' : 'text-gray-500'}`}>{cat}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.data_explorer_domains[cat]}
                                        onChange={() => {
                                            const updatedDomains = { ...filters.data_explorer_domains, [cat]: !filters.data_explorer_domains[cat] };
                                            setFilters({ data_explorer_domains: updatedDomains });
                                        }}
                                        className="rounded text-[#003366] focus:ring-[#003366]"
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-[#CE1126]/5 rounded-xl border border-[#CE1126]/10">
                            <h4 className="text-[10px] font-black text-[#CE1126] uppercase mb-2">Authenticated View</h4>
                            <p className="text-[10px] text-gray-600 leading-relaxed italic">Restricted data domain access. Exports are logged for security compliance.</p>
                        </div>
                    </section>
                )}

            </div>

            {/* Bottom Global Action Area */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10 flex flex-col gap-3">
                <button className="w-full group flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-xs">
                    <FileDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    Generate Intelligence Report
                </button>
                <button className="w-full group flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md text-sm">
                    <Download size={18} className="group-hover:animate-bounce" />
                    Export Current View
                </button>
            </div>
        </aside>
    );
}
