"use client";

import { Database, Map, BarChart2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HeroBanner() {
    const router = useRouter();

    return (
        <section
            className="relative w-full text-white pt-[80px] md:pt-[100px] pb-[80px] md:pb-[100px] px-6 md:px-12 flex flex-col items-center text-center overflow-hidden"
            style={{
                backgroundColor: '#001b3a',
                backgroundImage: 'radial-gradient(ellipse at top, #002855, #00152e)',
                color: '#ffffff'
            }}
        >
            {/* Decorative background glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[100px] rounded-full pointer-events-none"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            ></div>

            {/* Agency Logos Row */}
            <div className="relative z-10 flex items-center justify-center gap-6 md:gap-10 mb-8 animate-fade-in">
                {/* Logo 2 (Left) - Bagong Pilipinas */}
                <div className="flex items-center justify-center" style={{ width: '115px', height: '115px' }}>
                    <img
                        src="/img/logo2.png"
                        alt="Bagong Pilipinas Logo"
                        className="max-h-full max-w-full object-contain"
                    />
                </div>

                {/* DepEd Logo (Center) */}
                <div className="flex items-center justify-center" style={{ width: '115px', height: '115px' }}>
                    <img
                        src="/img/deped_logo.png"
                        alt="DepEd Logo"
                        className="max-h-full max-w-full object-contain"
                    />
                </div>

                {/* HROD LOGO (Right) */}
                <div className="flex items-center justify-center" style={{ width: '115px', height: '115px' }}>
                    <img
                        src="/img/HROD LOGO1.png"
                        alt="HROD Logo"
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            </div>

            {/* Main Headline */}
            <h1
                className="relative z-10 text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.3] md:leading-[1.4] mb-8 max-w-5xl animate-slide-up"
                style={{ color: '#ffffff', fontSize: '3.3rem', animationDelay: '200ms' }}
            >
                Strategic Resource Inventory <br className="hidden md:block" />
                <span className="inline-block mt-4">
                    for{' '}
                    <span
                        className="relative inline-block px-6 py-2 ml-3 rounded-sm shadow-lg transform hover:scale-[1.02] transition-transform font-bold"
                        style={{
                            background: 'linear-gradient(to right, #eab308, #facc15)',
                            color: '#001b3a'
                        }}
                    >
                        Deployment Efficiency
                    </span>
                </span>
            </h1>

            {/* Sub-headline */}
            <p
                className="relative z-10 max-w-3xl mx-auto text-base md:text-lg lg:text-xl mt-6 mb-6 leading-loose font-medium animate-slide-up"
                style={{ color: 'rgba(203, 213, 225, 0.9)', fontSize: '1.375rem', animationDelay: '400ms' }}
            >
                Empowering DepEd with data-driven insights to strengthen education systems,{' '}
                optimize resource allocation, and promote informed decision-making.
            </p>

            {/* Action Button */}
            <div className="relative z-10 flex justify-center w-full" style={{ marginTop: '32px', marginBottom: '40px' }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .arcade-base {
                        background-color: #a16207;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                        transition: box-shadow 150ms ease-in-out;
                    }
                    .arcade-btn:hover .arcade-base {
                        box-shadow: 0 14px 25px rgba(0,0,0,0.6);
                    }
                    .arcade-btn:active .arcade-base {
                        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    }
                    .arcade-top {
                        background: linear-gradient(to bottom, #fde047, #eab308);
                        border-top: 2px solid rgba(255,255,255,0.5);
                        color: #001b3a !important;
                        box-shadow: inset 0 -4px 6px rgba(0,0,0,0.2);
                        transform: translateY(-6px);
                        transition: transform 150ms ease-in-out;
                    }
                    .arcade-btn:hover .arcade-top {
                        transform: translateY(-8px);
                    }
                    .arcade-btn:active .arcade-top {
                        transform: translateY(0px);
                    }
                    .arcade-icon {
                        background-color: rgba(0,27,58,0.15);
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
                        transition: background-color 300ms;
                    }
                    .arcade-btn:hover .arcade-icon {
                        background-color: rgba(0,27,58,0.25);
                    }
                    .arcade-svg {
                        transition: transform 300ms;
                    }
                    .arcade-btn:hover .arcade-svg {
                        transform: translateX(4px);
                    }
                `}} />
                <button
                    onClick={() => router.push('/dashboard?tab=interactive')}
                    className="arcade-btn relative inline-block focus:outline-none rounded-full ring-4 ring-yellow-600/50 ring-offset-6 ring-offset-[#001b3a] transition-all hover:ring-yellow-500/70 animate-scale-in"
                    style={{ outline: 'none', animationDelay: '600ms' }}
                >
                    {/* 3D Base/Side */}
                    <span className="arcade-base absolute inset-0 rounded-full"></span>

                    {/* 3D Top Face */}
                    <span className="arcade-top relative flex items-center gap-4 px-10 py-5 rounded-full font-bold text-lg tracking-wide text-[#001b3a]">
                        <span className="uppercase text-[16px] drop-shadow-sm font-bold pl-3">Enter Stride</span>

                        {/* Inner Indented Icon */}
                        <div className="arcade-icon flex items-center justify-center w-8 h-8 rounded-full bg-[#001b3a]/15">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="arcade-svg w-5 h-5 drop-shadow-md" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                        </div>
                    </span>
                </button>
            </div>
        </section>
    );
}
