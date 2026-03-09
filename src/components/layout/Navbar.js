"use client";

import { useAuth } from "@/context/AuthContext";
import {
    BookOpen,
    Home,
    LayoutDashboard,
    Search,
    Map,
    CloudIcon,
    Database,
    Mail,
    LogOut
} from "lucide-react";
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

    // Helper map to associate item IDs to specific icons as required by the design
    const getIconForTab = (id) => {
        switch (id) {
            case 'home': return <Home size={16} className="text-gray-700" />;
            case 'menu-dashboard': return <LayoutDashboard size={16} className="text-gray-700" />;
            case 'search': return <Search size={16} className="text-gray-700" />;
            case 'resource_mapping': return <Map size={16} className="text-gray-700" />;
            case 'menu-cloud': return <CloudIcon size={16} className="text-gray-700" />;
            case 'menu-data-explorer': return <Database size={16} className="text-gray-700" />;
            default: return null; // Default case
        }
    };

    return (
        <nav className="bg-white text-gray-800 shadow-sm border-b-4 border-[#003366] sticky top-0 z-50 flex items-center justify-between px-4 py-2" ref={navRef}>
            {/* Left Branding Area */}
            <div className="flex items-center gap-4 shrink-0 h-full">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center font-black italic tracking-tighter text-4xl cursor-default select-none group leading-none">
                        <span className="text-[#003366]">STR</span>
                        <span className="text-[#FFB81C]">I</span>
                        <span className="text-[#CE1126]">DE</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 tracking-tight uppercase mt-0.5 whitespace-nowrap">
                        Strategic Resource Inventory for Deployment Efficiency
                    </span>
                </div>
            </div>

            {/* Right Side Navigation */}
            <div className="flex items-center justify-end flex-1 max-w-full">

                {/* Vertical Divider & Quick Guide */}
                <div className="flex items-center pr-4 border-r border-gray-300 mr-4 h-8 shrink-0">
                    <button
                        onClick={toggleDrawer}
                        className="flex items-center gap-1.5 text-[#003366] hover:text-[#004f9e] font-bold text-[13px] transition-colors whitespace-nowrap"
                    >
                        <BookOpen size={16} />
                        Quick Guide
                    </button>
                </div>

                {/* Main Navigation Links */}
                {navigation && (
                    <div className="flex items-center gap-4 shrink-0 px-2 py-1">
                        {navigation.map((navItem) => {
                            if (navItem.type === "dropdown") {
                                const isChildActive = navItem.children.some(child => child.id === activeTab);
                                const isOpen = openDropdown === navItem.id;

                                return (
                                    <div
                                        key={navItem.id}
                                        className="relative group shrink-0 mt-1"
                                        onMouseEnter={() => setOpenDropdown(navItem.id)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                    >
                                        <button
                                            className={`flex items-center gap-1.5 px-1 py-1 text-[13px] font-bold transition-all duration-300 border-b-2 ${isChildActive
                                                ? "border-gray-800 text-gray-900"
                                                : "border-transparent text-gray-600 hover:text-gray-800"
                                                }`}
                                        >
                                            {getIconForTab(navItem.id)}
                                            {navItem.label}
                                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </button>

                                        {isOpen && (
                                            <div className="absolute top-full left-0 mt-2 flex flex-col bg-white text-gray-800 shadow-lg rounded-md min-w-[220px] border border-gray-100 z-50 overflow-hidden shrink-0 animate-slide-down">
                                                {navItem.children.map(child => (
                                                    <button
                                                        key={child.id}
                                                        onClick={() => {
                                                            onTabChange(child.id);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`text-left px-4 py-3 text-sm font-medium transition-all duration-300 ${activeTab === child.id
                                                            ? "bg-gray-50 text-[#003366] border-l-4 border-[#003366]"
                                                            : "hover:bg-gray-50 border-l-4 border-transparent text-gray-700"
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

                            // Standalone Tab
                            return (
                                <button
                                    key={navItem.id}
                                    onClick={() => {
                                        onTabChange(navItem.id);
                                        setOpenDropdown(null);
                                    }}
                                    className={`flex items-center gap-1.5 px-1 py-1 mt-1 shrink-0 whitespace-nowrap text-[13px] font-bold transition-all duration-300 border-b-2 ${activeTab === navItem.id
                                        ? "border-gray-800 text-gray-900"
                                        : "border-transparent text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    {getIconForTab(navItem.id)}
                                    {navItem.label}
                                </button>
                            );
                        })}

                        {/* Static Contact Us Tab */}
                        <button
                            onClick={() => onTabChange('contact')}
                            className={`flex items-center gap-1.5 px-1 py-1 mt-1 shrink-0 whitespace-nowrap text-[13px] font-bold transition-all border-b-2 ${activeTab === 'contact' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                        >
                            <Mail size={16} className="text-gray-700" />
                            Contact Us
                        </button>

                        {/* Vertical Divider & Logout */}
                        <div className="flex items-center pl-4 border-l border-gray-300 ml-2 h-8 shrink-0 mt-1">
                            <button
                                onClick={logout}
                                className="flex items-center gap-1.5 text-[#CE1126] hover:text-red-800 font-bold text-[13px] transition-colors whitespace-nowrap"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
