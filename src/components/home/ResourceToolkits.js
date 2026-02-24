"use client";

import { FileText, Database, Briefcase, ExternalLink } from "lucide-react";

export default function ResourceToolkits() {
    const toolkits = [
        {
            title: "ECP System Guide",
            description: "Educational Facilities Profile operational rules.",
            icon: <Database className="w-5 h-5 text-[#003366]" />
        },
        {
            title: "SIIF Architecture",
            description: "School Infrastructure Information Facility mapping.",
            icon: <Briefcase className="w-5 h-5 text-[#003366]" />
        },
        {
            title: "Teacher Workload",
            description: "Guidelines on resolving parameter limits.",
            icon: <FileText className="w-5 h-5 text-[#003366]" />
        }
    ];

    return (
        <section className="bg-gray-50 py-16 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#003366]">Resource Toolkits</h2>
                        <p className="text-gray-500 text-sm mt-1">Official references for STRIDE data processing</p>
                    </div>
                    <button className="text-sm font-medium text-[#CE1126] hover:underline flex items-center gap-1 hidden sm:flex">
                        View All Resources <ExternalLink size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {toolkits.map((card, idx) => (
                        <div
                            key={idx}
                            className="group flex flex-col justify-between bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-[#FFB81C] hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-[#FFB81C]/20 transition-colors">
                                    {card.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-[#003366] transition-colors">{card.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
