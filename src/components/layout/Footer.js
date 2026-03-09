"use client";

import { Mail, Shield, Info } from "lucide-react";

export default function Footer({ onHelpClick }) {
    return (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="flex flex-col">
                            <div className="flex items-center font-black italic tracking-tighter text-3xl cursor-default select-none leading-none">
                                <span className="text-[#003366]">STR</span>
                                <span className="text-[#FFB81C]">I</span>
                                <span className="text-[#CE1126]">DE</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-tight uppercase mt-1">
                                Strategic Resource Inventory for Deployment Efficiency
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            An advanced geospatial analytics platform empowering the Department of Education through data-driven resource optimization.
                        </p>
                    </div>

                    {/* Quick Access */}
                    <div className="md:col-span-1 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b-2 border-[#FFB81C] inline-block pb-1">Quick Access</h4>
                        <ul className="space-y-2 text-sm font-medium text-gray-600">
                            <li><a href="/dashboard?tab=interactive" className="hover:text-[#003366] transition-colors">Resource Dashboard</a></li>
                            <li><a href="/dashboard?tab=advanced_analytics" className="hover:text-[#003366] transition-colors">Advanced Analytics</a></li>
                            <li><a href="/dashboard?tab=infra" className="hover:text-[#003366] transition-colors">Infrastructure & Facilities</a></li>
                            <li><a href="/dashboard?tab=search" className="hover:text-[#003366] transition-colors">Quick Search</a></li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div className="md:col-span-1 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b-2 border-[#CE1126] inline-block pb-1">Support</h4>
                        <ul className="space-y-2 text-sm font-medium text-gray-600">
                            <li>
                                <button
                                    onClick={onHelpClick}
                                    className="hover:text-[#003366] transition-colors flex items-center gap-2"
                                >
                                    <Info size={14} /> Help & Documentation
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.location.href = '/dashboard?tab=contact'}
                                    className="hover:text-[#003366] transition-colors flex items-center gap-2"
                                >
                                    <Mail size={14} /> Contact STRIDE Team
                                </button>
                            </li>
                            <li>
                                <span className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                                    <Shield size={14} /> Privacy Policy
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Agency Logos */}
                    <div className="md:col-span-1 flex flex-col justify-between">
                        <div className="flex items-start gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                            <img src="/img/deped-logo.png" alt="DepEd" className="h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
                            <img src="/img/stride-logo-main.png" alt="STRIDE" className="h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                        <div className="mt-8 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A Product of</p>
                            <p className="text-xs font-black text-[#003366]">Information and Communications Technology Service (ICTS)</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        &copy; 2026 Department of Education. All Rights Reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Phase 2.1.0</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#003366]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#FFB81C]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#CE1126]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
