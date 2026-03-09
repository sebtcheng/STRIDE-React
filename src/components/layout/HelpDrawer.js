"use client";

import { useState } from "react";
import { X, PlayCircle, FileText, HelpCircle, BookOpen } from "lucide-react";

export default function HelpDrawer({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("video");

    const tabs = [
        { id: "video", label: "Video Guide" },
        { id: "faqs", label: "FAQs" }
    ];

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
                {/* Header */}
                <div className="flex items-center justify-between p-5 bg-[#003366] text-white">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        STRIDE User Guide & Assistant
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-xs font-bold transition-all relative ${activeTab === tab.id
                                ? "text-[#CE1126]"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#CE1126]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 text-gray-800">
                    {activeTab === "video" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                            <h3 className="text-lg font-bold text-[#003366]">Video Walkthrough</h3>
                            <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 shadow-md bg-black">
                                <iframe
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/TirKDX1Wwz4"
                                    title="STRIDE Video Walkthrough"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed italic">
                                Watch this guide to learn how to navigate the STRIDE platform and maximize its analytical tools.
                            </p>
                        </div>
                    )}

                    {activeTab === "faqs" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <h3 className="text-lg font-bold text-[#003366] border-b pb-2 flex items-center gap-2">
                                <HelpCircle size={18} /> FAQs
                            </h3>
                            <div className="space-y-5">
                                <div className="group">
                                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#CE1126] transition-colors mb-1">How do I export a report?</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Navigate to any dashboard and click the green or red "Generate Report" button on the sidebar to download as PDF or XLS.</p>
                                </div>
                                <div className="group">
                                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#CE1126] transition-colors mb-1">Can I view data by municipality?</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Yes, the Quick Search/Locator tab allows filtering down to the district and municipality level.</p>
                                </div>
                                <div className="group">
                                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#CE1126] transition-colors mb-1">What is the "Structural" role?</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Verified @deped.gov.ph users who have access to strategic internal metrics and deployment logs.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Attribution */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-[10px] text-center text-gray-400 font-medium">
                    © 2026 STRIDE • STRATEGIC RESOURCE INVENTORY
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
