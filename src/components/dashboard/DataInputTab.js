"use client";

import { useState } from "react";
import { UploadCloud, DatabaseZap, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DataInputTab() {
    const { role } = useAuth();
    const [status, setStatus] = useState("idle");

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus("saving");
        setTimeout(() => {
            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        }, 1500);
    };

    if (role !== "structural") {
        return (
            <div className="flex-1 h-full flex items-center justify-center p-6 bg-gray-50">
                <div className="bg-white p-8 rounded-xl border border-red-200 shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#003366] mb-2">Access Restricted</h2>
                    <p className="text-gray-600 text-sm mb-6">
                        The Data Input Engine requires verified @deped.gov.ph authorization with active Structural level credentials. Guests cannot access write operations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col items-center py-12">
            <div className="max-w-3xl w-full">

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-[#003366] mb-2 flex items-center justify-center gap-3">
                        <DatabaseZap className="text-[#FFB81C]" size={36} />
                        Secure Operations Entry
                    </h2>
                    <p className="text-gray-500">Insert database parameters directly. Activity is securely logged under your credentials.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-[#003366] px-8 py-4 border-b border-[#002244]">
                        <h3 className="text-white font-semibold flex items-center gap-2"><UploadCloud size={18} /> New Allocation Entry Form</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-3 text-sm text-[#003366] mb-6">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <p>Ensure that values align with the ECP framework limits. Mismatched allocations will undergo a manual validation flag via SIIF processing.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">School ID</label>
                                <input required type="text" className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#003366] font-mono text-gray-900" placeholder="e.g. 101123" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Allocation Year Target</label>
                                <select className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#003366] text-gray-900">
                                    <option>FY 2026</option>
                                    <option>FY 2027</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Category</label>
                                <select className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#003366] text-gray-900">
                                    <option>Human Resources (Plantilla Request)</option>
                                    <option>Educational Facilities (Classroom Build)</option>
                                    <option>Connectivity / IT Packages</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Operational Justification Remarks</label>
                                <textarea required rows="3" className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#003366] text-gray-900 resize-none" placeholder="Provide strategic rationale..." />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                            <button
                                type="submit"
                                disabled={status !== "idle"}
                                className={`font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center min-w-[200px] shadow-md
                        ${status === "idle" ? "bg-[#CE1126] hover:bg-red-800 text-white" :
                                        status === "saving" ? "bg-gray-400 text-white cursor-not-allowed" :
                                            "bg-green-600 text-white"}`}
                            >
                                {status === "idle" && "Commit Transaction"}
                                {status === "saving" && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {status === "success" && "Successfully Logged!"}
                            </button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
}
