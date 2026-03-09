"use client";

export default function ResourceToolkits() {
    const toolkits = [
        {
            title: "ECP System Toolkit",
            description: "An implementation guide for teachers on navigating the Educational Facilities Profile, understanding core metrics, and streamlining data encoding efficiency.",
            image: "/img/ecp.png"
        },
        {
            title: "SIIF Toolkit",
            description: "A comprehensive manual for School Infrastructure Information Facility charting, spatial analysis, and reporting standards for DepEd facilities.",
            image: "/img/siif.png"
        },
        {
            title: "Teacher Workload Toolkit",
            description: "Strategic guidelines for mapping teacher workloads, assessing instructional capabilities, and resolving deployment imbalances across divisions.",
            image: "/img/teacher.png"
        }
    ];

    return (
        <section className="py-12 w-full max-w-7xl mx-auto px-4 mb-20 section-resource">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#003366]">Resources & Toolkits</h2>
                <div className="h-1 w-24 bg-[#FFB81C] mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {toolkits.map((card, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-xl transition-shadow duration-300 group animate-slide-up"
                        style={{ animationDelay: `${(idx + 1) * 200 + 400}ms` }}
                    >
                        <div className="h-48 w-full relative overflow-hidden bg-gray-100 flex items-center justify-center p-4">
                            <img
                                src={card.image}
                                alt={card.title}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-t-lg drop-shadow-md"
                                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e0e0e0/ffffff?text=Graphic' }}
                            />
                        </div>
                        <div className="p-6 flex flex-col flex-1 border-t border-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#003366] transition-colors">{card.title}</h3>
                            <p className="text-gray-600 text-sm flex-1 leading-relaxed mb-6">{card.description}</p>

                            <button className="w-full bg-[#003366] text-white font-semibold py-3 rounded-lg transition-all border border-transparent hover:bg-[#FFB81C] hover:text-[#003366] hover:border-[#e0a800] active:scale-[0.98]">
                                Learn More
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
