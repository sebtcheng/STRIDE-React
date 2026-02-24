"use client";

import { ZoomIn, Table, MapPinned } from "lucide-react";

const capabilities = [
    {
        title: "Drilldown Function",
        description: "Deep dive from National to Regional context, all the way down to a specific school's micro-data.",
        icon: <ZoomIn className="w-8 h-8 text-[#FFB81C] mb-4" />,
        color: "border-[#FFB81C]"
    },
    {
        title: "Reactive Data Tables",
        description: "Instantaneous filtering across 48,000+ school records utilizing server-side pagination and optimized queries.",
        icon: <Table className="w-8 h-8 text-[#003366] mb-4" />,
        color: "border-[#003366]"
    },
    {
        title: "Geospatial Mapping",
        description: "Visual pinpointing of educational facilities across the Philippines with custom regional polygons.",
        icon: <MapPinned className="w-8 h-8 text-[#CE1126] mb-4" />,
        color: "border-[#CE1126]"
    }
];

export default function Capabilities() {
    return (
        <section className="py-16 mt-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#003366]">Core Capabilities</h2>
                <p className="text-gray-500 mt-2">Powerful analytics designed for structural decision making</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
                {capabilities.map((item, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-xl shadow-md p-8 border-t-4 ${item.color} cursor-pointer hover:-translate-y-2 transition-transform duration-300 hover:shadow-xl`}
                    >
                        {item.icon}
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
