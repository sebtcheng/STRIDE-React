"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, BookOpen, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar({ toggleDrawer, navigation, activeTab, onTabChange }) {
    const { user, logout } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(null);
    const navRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="bg-[#003366] text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50" ref={navRef}>
            <div className="flex items-center gap-3">
                <div className="bg-[#FFB81C] text-[#003366] font-extrabold px-2 py-1 rounded w-8 h-8 flex items-center justify-center">S</div>
                <span className="font-bold text-xl tracking-wider hidden sm:block">STRIDE</span>
                <span className="text-sm font-light text-blue-200 hidden xl:block border-l border-blue-400 pl-3 ml-2">
                    Department of Education Phase 2
                </span>
            </div>

            {/* Right Side Controls & Navigation */}
            <div className="flex-1 flex justify-end items-center px-4">
                <div className="flex items-center gap-6">
                    {user && (
                        <span className="text-sm hidden sm:block text-gray-200 border-r border-[#002244] pr-6">
                            {user.displayName || user.email}
                        </span>
                    )}

                    <button
                        onClick={toggleDrawer}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-md font-medium transition-colors text-sm whitespace-nowrap"
                    >
                        <BookOpen size={16} />
                        <span className="hidden sm:inline">Quick Guide</span>
                    </button>

                    {navigation && (
                        <div className="flex bg-[#002244] p-1 rounded-lg gap-2 flex-wrap sm:flex-nowrap justify-center ml-2 shadow-inner border border-[#001D36]">
                            {navigation.map((navItem) => {
                                if (navItem.type === "dropdown") {
                                    // Check if any child is currently active
                                    const isChildActive = navItem.children.some(child => child.id === activeTab);
                                    const isOpen = openDropdown === navItem.id;

                                    return (
                                        <div key={navItem.id} className="relative">
                                            <button
                                                onClick={() => setOpenDropdown(isOpen ? null : navItem.id)}
                                                className={`flex items-center gap-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${isChildActive ? "bg-white text-[#003366] shadow-sm" : "text-blue-100 hover:text-white hover:bg-white/10"
                                                    }`}>
                                                {navItem.label}
                                                <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>

                                            {isOpen && (
                                                <div className="absolute top-full right-0 mt-2 flex flex-col bg-white text-gray-800 shadow-xl rounded-md min-w-[220px] border border-gray-100 z-50 overflow-hidden">
                                                    {navItem.children.map(child => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => {
                                                                onTabChange(child.id);
                                                                setOpenDropdown(null);
                                                            }}
                                                            className={`text-left px-4 py-3 text-sm font-medium transition-colors ${activeTab === child.id ? "bg-blue-50 text-[#003366] border-l-4 border-[#003366]" : "hover:bg-gray-50 border-l-4 border-transparent"
                                                                }`}
                                                        >
                                                            {child.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Standalone tab
                                return (
                                    <button
                                        key={navItem.id}
                                        onClick={() => {
                                            onTabChange(navItem.id);
                                            setOpenDropdown(null);
                                        }}
                                        className={`whitespace-nowrap py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === navItem.id ? "bg-white text-[#003366] shadow-sm" : "text-blue-100 hover:text-white hover:bg-white/10"
                                            }`}
                                    >
                                        {navItem.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
