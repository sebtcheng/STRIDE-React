"use client";

import { X, PlayCircle, FileText, HelpCircle } from "lucide-react";

export default function HelpDrawer({ isOpen, onClose }) {
    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b bg-gray-50 text-[#003366]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-[#FFB81C]" />
                        Quick Guide
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 text-gray-800">

                    <section>
                        <h3 className="font-semibold text-lg border-b pb-2 mb-3 flex items-center gap-2 text-[#003366]">
                            <HelpCircle size={18} />
                            FAQs
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <strong className="block text-gray-900">How do I export a report?</strong>
                                <p className="text-gray-600">Navigate to the Education Resource Dashboard and click the red "Generate Report" button on the sidebar.</p>
                            </div>
                            <div>
                                <strong className="block text-gray-900">Can I view data by municipality?</strong>
                                <p className="text-gray-600">Yes, the Advanced Search allows filtering down to the district and municipality level.</p>
                            </div>
                            <div>
                                <strong className="block text-gray-900">What is the "Structural" role?</strong>
                                <p className="text-gray-600">Verified @deped.gov.ph users who have access to strategic internal metrics.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-semibold text-lg border-b pb-2 mb-3 flex items-center gap-2 text-[#003366]">
                            <PlayCircle size={18} />
                            Tutorial Videos
                        </h3>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 rounded bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors text-sm font-medium flex justify-between items-center group">
                                Dashboard Overview
                                <PlayCircle size={16} className="text-[#FFB81C] group-hover:scale-110 transition-transform" />
                            </button>
                            <button className="w-full text-left p-3 rounded bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors text-sm font-medium flex justify-between items-center group">
                                Using the Geospatial Map
                                <PlayCircle size={16} className="text-[#FFB81C] group-hover:scale-110 transition-transform" />
                            </button>
                            <button className="w-full text-left p-3 rounded bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors text-sm font-medium flex justify-between items-center group">
                                HR and Plantilla Tracking
                                <PlayCircle size={16} className="text-[#FFB81C] group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-semibold text-lg border-b pb-2 mb-3 flex items-center gap-2 text-[#003366]">
                            <FileText size={18} />
                            Glossary
                        </h3>
                        <ul className="text-sm space-y-2 text-gray-700">
                            <li><strong className="text-gray-900 font-medium">SIIF:</strong> School Infrastructure Information Facility</li>
                            <li><strong className="text-gray-900 font-medium">ECP:</strong> Educational Facilities Profile</li>
                            <li><strong className="text-gray-900 font-medium">Plantilla:</strong> Official roster of authorized government positions</li>
                        </ul>
                    </section>

                </div>
            </div>
        </>
    );
}

// Helper icon component
function BookOpenIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
    );
}
