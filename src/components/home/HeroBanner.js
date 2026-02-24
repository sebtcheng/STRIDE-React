"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroBanner() {
    return (
        <div className="relative overflow-hidden rounded-2xl shadow-xl mt-6 mx-auto w-full max-w-7xl">
            <div
                className="absolute inset-0 z-0 bg-gradient-to-r from-[#003366] via-[#004b99] to-[#FFB81C] opacity-90"
            ></div>

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl text-white">
                    <div className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1 text-sm font-medium mb-4">
                        Department of Education Phase 2
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        Strategic Resource Inventory for Deployment Efficiency
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-xl">
                        A comprehensive, enterprise-grade mapping and human resource analytics engine empowering DepEd deployment and infrastructure allocation.
                    </p>

                    <Link href="/dashboard" className="inline-block">
                        <button className="group flex items-center gap-2 bg-white text-[#003366] hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-all shadow-md mt-4">
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>

                {/* Abstract graphic representing analytics/structure */}
                <div className="hidden lg:flex relative w-64 h-64 shrink-0">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB81C]/40 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#003366]/60 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                    <div className="relative flex items-center justify-center w-full h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3">
                            <div className="bg-white/40 rounded"></div>
                            <div className="bg-white/80 rounded"></div>
                            <div className="bg-[#FFB81C] rounded"></div>
                            <div className="bg-white/40 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
