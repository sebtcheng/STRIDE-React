"use client";

export default function HeroBanner() {
    return (
        <div
            className="relative overflow-hidden w-full h-[320px] flex items-center justify-center -mt-0"
            style={{ background: 'linear-gradient(90deg, #002244 0%, #003366 40%, #D49A1C 100%)' }}
        >
            {/* Subtle dotted pattern overlay mapping to the screenshot background */}
            <div className="absolute inset-0 z-0 opacity-15" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">

                <div className="mb-4">
                    <img
                        src="/img/Stridelogo1.png"
                        alt="STRIDE Logo"
                        style={{ height: '90px', width: 'auto', objectFit: 'contain' }}
                        className="drop-shadow-md"
                    />
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-[38px] font-extrabold text-white mb-2 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Strategic Resource Inventory for Deployment Efficiency
                </h1>

                <p className="text-xs sm:text-sm md:text-[15px] max-w-3xl leading-relaxed text-gray-100/90 font-medium">
                    Empowering DepEd with data-driven insights to strengthen its education systems, optimize resource<br />
                    allocation, and promote informed decision-making nationwide.
                </p>

            </div>
        </div>
    );
}
