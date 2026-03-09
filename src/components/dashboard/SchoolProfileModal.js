"use client";

import React, { useEffect } from "react";
import { X, Download, Building2, MapPin, Users, AlertCircle, Building, AlertTriangle, Settings2, CheckSquare, Info, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";

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

export default function SchoolProfileModal({ isOpen, onClose, school, fullProfile, loadingProfile }) {
    const isMobile = useIsMobile();
    const { role } = useAuth();
    // ESC Key Listener for Modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-12">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#001a33]/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-6xl max-h-full rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                {/* Modal Header */}
                {!school ? null : (
                    <div className="p-4 lg:p-6 bg-[#003366] text-white flex justify-between items-center shrink-0 gap-3">
                        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                            <div className="bg-[#FFB81C] p-2 rounded-xl text-[#003366] shadow-lg shadow-orange-500/20 shrink-0">
                                <Building2 size={isMobile ? 18 : 24} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm lg:text-2xl font-black leading-tight tracking-tight truncate">{fullProfile?.profile?.school_name || school?.name || school?.school_name || 'Unknown School'}</h2>
                                <p className="text-blue-200 text-[10px] lg:text-xs font-bold tracking-widest uppercase flex items-center gap-2 truncate">
                                    ID: {school?.id || school?.schoolid}
                                    <span className="opacity-30">•</span>
                                    {fullProfile?.profile?.municipality || school?.municipality}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                            <button
                                disabled={role === 'guest'}
                                title={role === 'guest' ? "Downloads are disabled for Guest accounts" : "Export School Profile to PDF"}
                                onClick={() => {
                                    window.open(`/stride-api/quick-search/export-profile?schoolId=${school.id}`, '_blank');
                                }}
                                className={`p-2 lg:px-4 lg:py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm transition-all ${role === 'guest' ? 'bg-white/5 text-white/50 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 text-white shadow-inner whitespace-nowrap'}`}
                            >
                                <Download size={isMobile ? 18 : 14} />
                                <span className="hidden lg:inline">EXPORT PDF</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-[#CE1126] hover:bg-red-800 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-xl font-black text-[10px] lg:text-xs flex items-center gap-1.5 lg:gap-2 shadow-lg transition-all active:scale-95 border border-red-400/20 shadow-red-900/40"
                            >
                                <X size={isMobile ? 16 : 18} /> <span className="uppercase">Exit</span>
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
                                    <DataItem label="Barangay" value={fullProfile.profile.barangay || 'N/A'} subValue={`Coord: ${fullProfile.profile.latitude || '0'}, ${fullProfile.profile.longitude || '0'}`} />
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
                                        <DataItem label="Kinder" value={Number(fullProfile.profile.kinder || 0).toLocaleString()} />
                                        <DataItem label="Grade 1" value={Number(fullProfile.profile.g1 || 0).toLocaleString()} />
                                        <DataItem label="Grade 2" value={Number(fullProfile.profile.g2 || 0).toLocaleString()} />
                                        <DataItem label="Grade 3" value={Number(fullProfile.profile.g3 || 0).toLocaleString()} />
                                        <DataItem label="Grade 4" value={Number(fullProfile.profile.g4 || 0).toLocaleString()} />
                                        <DataItem label="Grade 5" value={Number(fullProfile.profile.g5 || 0).toLocaleString()} />
                                        <DataItem label="Grade 6" value={Number(fullProfile.profile.g6 || 0).toLocaleString()} />
                                        <div className="pt-2 mt-2 border-t border-green-200">
                                            <DataItem label="Elem Subtotal" value={((Number(fullProfile.profile.kinder) || 0) + (Number(fullProfile.profile.g1) || 0) + (Number(fullProfile.profile.g2) || 0) + (Number(fullProfile.profile.g3) || 0) + (Number(fullProfile.profile.g4) || 0) + (Number(fullProfile.profile.g5) || 0) + (Number(fullProfile.profile.g6) || 0)).toLocaleString()} />
                                        </div>
                                    </InfoCard>
                                    <InfoCard title="Secondary Population" icon={<Users size={16} />} color="green">
                                        <DataItem label="Grade 7" value={Number(fullProfile.profile.g7 || 0).toLocaleString()} />
                                        <DataItem label="Grade 8" value={Number(fullProfile.profile.g8 || 0).toLocaleString()} />
                                        <DataItem label="Grade 9" value={Number(fullProfile.profile.g9 || 0).toLocaleString()} />
                                        <DataItem label="Grade 10" value={Number(fullProfile.profile.g10 || 0).toLocaleString()} />
                                        <div className="pt-1 mt-1 border-t border-green-200/50 mb-2">
                                            <DataItem label="JHS Subtotal" value={((Number(fullProfile.profile.g7) || 0) + (Number(fullProfile.profile.g8) || 0) + (Number(fullProfile.profile.g9) || 0) + (Number(fullProfile.profile.g10) || 0)).toLocaleString()} />
                                        </div>
                                        <DataItem label="Grade 11" value={Number(fullProfile.profile.g11 || 0).toLocaleString()} />
                                        <DataItem label="Grade 12" value={Number(fullProfile.profile.g12 || 0).toLocaleString()} />
                                        <div className="pt-1 mt-1 border-t border-green-200/50 mb-2">
                                            <DataItem label="SHS Subtotal" value={((Number(fullProfile.profile.g11) || 0) + (Number(fullProfile.profile.g12) || 0)).toLocaleString()} />
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-green-200">
                                            <DataItem label="Total Enrolment" value={Number(fullProfile.profile.totalenrolment || 0).toLocaleString()} />
                                        </div>
                                    </InfoCard>
                                    <InfoCard title="Ancillary Metrics" icon={<AlertCircle size={16} />} color="purple">
                                        <DataItem label="LMS Status" value={fullProfile.profile.sha_2024_index ? "YES" : "NO"} />
                                        <DataItem label="School Size" value={fullProfile.profile.school_size_typology || "Standard"} />
                                        <DataItem label="Implementing Unit" value={fullProfile.profile.implementing_unit == '1' || fullProfile.profile.implementing_unit === 1 ? "Yes" : "No"} />
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
                                        <DataItem label="Elem Teachers" value={Number(fullProfile.profile.es_teachers || 0).toLocaleString()} />
                                        <DataItem label="JHS Teachers" value={Number(fullProfile.profile.jhs_teachers || 0).toLocaleString()} />
                                        <DataItem label="SHS Teachers" value={Number(fullProfile.profile.shs_teachers || 0).toLocaleString()} />
                                        <div className="pt-2 mt-2 border-t border-blue-200">
                                            <DataItem label="Total Teachers" value={((Number(fullProfile.profile.es_teachers) || 0) + (Number(fullProfile.profile.jhs_teachers) || 0) + (Number(fullProfile.profile.shs_teachers) || 0)).toLocaleString()} />
                                        </div>
                                    </InfoCard>
                                    <InfoCard title="Resource Gap Analysis" icon={<AlertCircle size={16} />} color="red">
                                        <DataItem label="Total Shortage" value={Number(fullProfile.profile.total_shortage || 0).toLocaleString()} />
                                        <DataItem label="Total Excess" value={Number(fullProfile.profile.total_excess || 0).toLocaleString()} />
                                        <div className="pt-2 mt-2 border-t border-red-200">
                                            <DataItem label="Net Requirement" value={(Number(fullProfile.profile.total_shortage || 0) - Number(fullProfile.profile.total_excess || 0)).toLocaleString()} />
                                        </div>
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
                                        <DataItem label="Total Buildings" value={Number(fullProfile.profile.buildings || 0).toLocaleString()} />
                                        <DataItem label="Total Classrooms" value={Number(fullProfile.profile.instructional_rooms_2023_2024 || 0).toLocaleString()} />
                                        <DataItem label="Major Repairs" value={Number(fullProfile.profile.major_repair_2023_2024 || 0).toLocaleString()} />
                                    </InfoCard>
                                    <InfoCard title="Facility Gaps" icon={<AlertTriangle size={16} />} color="orange">
                                        <DataItem label="Classroom Requirement" value={Number(fullProfile.profile.classroom_requirement || 0).toLocaleString()} />
                                        <DataItem label="Classroom Shortage" value={Number(fullProfile.profile.est_cs || 0).toLocaleString()} />
                                        <DataItem label="Buildable Space" value={fullProfile.profile.buidable_space == '1' || fullProfile.profile.buidable_space === 1 ? "Yes" : "No"} />
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
                                                <span className="text-lg font-black text-[#003366]">{Number(fullProfile.profile[spec.field] || 0).toLocaleString()}</span>
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
    );
}
