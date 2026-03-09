"use client";

import { Mail, MessageSquare, ExternalLink } from "lucide-react";

export default function ContactUsTab() {
    return (
        <div className="p-6 h-full overflow-y-auto w-full bg-[#f8fafc] flex flex-col items-center">
            {/* Page Header */}
            <div className="w-full max-w-5xl mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Mail className="text-[#003366]" size={32} />
                    <h2 className="text-3xl font-extrabold text-[#003366]">Contact Us</h2>
                </div>
                <p className="text-gray-500 font-medium">We're here to help. Reach out to the STRIDE team for support, feedback, or to report any concerns.</p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Support Channels Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare size={20} className="text-[#CE1126]" />
                            Support Channels
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Support</p>
                                <a
                                    href="mailto:support.stride@deped.gov.ph"
                                    className="flex items-center gap-2 text-[#003366] hover:text-[#CE1126] font-bold transition-colors group"
                                >
                                    <Mail size={16} className="text-gray-400 group-hover:text-[#CE1126]" />
                                    support.stride@deped.gov.ph
                                </a>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">User Concern Form</p>
                                <a
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSeMF0ovtg7LlrcRTBRiSszknestVcIPiGx7eXVNPV8_7HYFlQ/viewform?usp=dialog"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-[#CE1126] hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs shadow-sm"
                                >
                                    Open Form in New Tab
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Tip:</strong> For faster resolution, please include your School ID or Division Name in your message.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feedback Form Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">Feedback & Concern Form</h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">Embedded</span>
                        </div>
                        <div className="w-full relative bg-gray-50" style={{ height: '800px' }}>
                            <iframe
                                src="https://docs.google.com/forms/d/e/1FAIpQLScmWmVzlAHgsitxUncINy4OC_5gkyg2LvYcJAkAGlGAzQHNvw/viewform?embedded=true"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                marginHeight="0"
                                marginWidth="0"
                                className="absolute inset-0"
                            >
                                Loading…
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
