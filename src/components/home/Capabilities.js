"use client";

import { Search, Monitor, Globe } from "lucide-react";

export default function Capabilities() {
    const capabilities = [
        {
            title: "Drilldown Function",
            description: "Start with a high-level overview and seamlessly drill down into detailed data for regions, divisions, and individual schools.",
            icon: <Search className="w-10 h-10 text-white" />,
            bgColor: "bg-[#003366]"
        },
        {
            title: "Reactive Data Tables",
            description: "Interact with your data. Our tables are fully searchable, sortable, and filterable, updating in real-time as you make selections.",
            icon: <Monitor className="w-10 h-10 text-white" />,
            bgColor: "bg-[#003366]"
        },
        {
            title: "Geospatial Mapping",
            description: "Visualize resource distribution and key metrics on an interactive map. Understand your data in its geographic context.",
            icon: <Globe className="w-10 h-10 text-white" />,
            bgColor: "bg-[#003366]"
        }
    ];

    return (
        <section className="py-12 w-full max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#003366]">Discover STRIDE's Capabilities</h2>
                <div className="h-1 w-24 bg-[#FFB81C] mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {capabilities.map((item, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_12px_30px_rgb(0,0,0,0.1)] transition-all duration-300 group animate-slide-up`}
                        style={{ animationDelay: `${(index + 1) * 200}ms` }}
                    >
                        <div className={`p-4 rounded-full ${item.bgColor} mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#003366] transition-colors">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
