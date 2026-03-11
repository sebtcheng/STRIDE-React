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
    LogOut,
    Menu,
    X,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useIsMobile from "@/hooks/useIsMobile";

export default function Navbar({ toggleDrawer, navigation, activeTab, onTabChange }) {
    const { user, logout } = useAuth();
    const isMobile = useIsMobile();
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileExpandedItem, setMobileExpandedItem] = useState(null);
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
    const getIconForTab = (id, color = "text-gray-700") => {
        switch (id) {
            case 'home': return <Home size={16} className={color} />;
            case 'menu-dashboard': return <LayoutDashboard size={16} className={color} />;
            case 'search': return <Search size={16} className={color} />;
            case 'resource_mapping': return <Map size={16} className={color} />;
            case 'menu-cloud': return <CloudIcon size={16} className={color} />;
            case 'menu-data-explorer': return <Database size={16} className={color} />;
            default: return null;
        }
    };

    return (
        <nav className="bg-white text-gray-800 shadow-sm border-b-4 border-[#003366] sticky top-0 z-[100] flex items-center min-h-[64px] py-2 px-4" ref={navRef}>
            {/* Left Branding Area */}
            <div className="flex items-center gap-4 shrink-0 h-full">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center font-black italic tracking-tighter text-4xl cursor-default select-none group leading-none">
                        <span className="text-[#003366]">STR</span>
                        <span className="text-[#FFB81C]">I</span>
                        <span className="text-[#CE1126]">DE</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 tracking-tight uppercase mt-0.5 whitespace-normal md:whitespace-nowrap max-w-[180px] md:max-w-none">
                        Strategic Resource Inventory for Deployment Efficiency
                    </span>
                </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 flex items-center justify-end h-full">
                {/* Desktop View: Horizontal Links */}
                <div className="hidden md:flex items-center justify-end w-full gap-1 px-2">
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

                            <button
                                onClick={() => onTabChange('contact')}
                                className={`flex items-center gap-1.5 px-1 py-1 mt-1 shrink-0 whitespace-nowrap text-[13px] font-bold transition-all border-b-2 ${activeTab === 'contact' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                            >
                                <Mail size={16} className="text-gray-700" />
                                Contact Us
                            </button>

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

                {/* Mobile View: Hamburger Menu Button */}
                <div className="flex md:hidden items-center h-full">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-[#003366] hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm border border-gray-100 shadow-sm px-3"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        <span>{isMobileMenuOpen ? "CLOSE" : "MENU"}</span>
                    </button>

                    {/* Mobile Dropdown Menu Overlay */}
                    {isMobileMenuOpen && (
                        <div className="absolute top-[64px] right-4 left-4 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col py-2 max-h-[80vh] overflow-y-auto">
                                {/* Navigation Items */}
                                {navigation?.map((navItem) => {
                                    if (navItem.type === "dropdown") {
                                        const isExpanded = mobileExpandedItem === navItem.id;
                                        const isChildActive = navItem.children.some(child => child.id === activeTab);

                                        return (
                                            <div key={navItem.id} className="border-b border-gray-50 last:border-0">
                                                <button
                                                    onClick={() => setMobileExpandedItem(isExpanded ? null : navItem.id)}
                                                    className={`w-full flex items-center justify-between px-5 py-4 text-left font-black tracking-tight ${isChildActive ? "text-[#003366] bg-blue-50/50" : "text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {getIconForTab(navItem.id, isChildActive ? "text-[#003366]" : "text-gray-500")}
                                                        {navItem.label}
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="bg-gray-50 py-1 border-t border-gray-100 flex flex-col">
                                                        {navItem.children.map(child => (
                                                            <button
                                                                key={child.id}
                                                                onClick={() => {
                                                                    onTabChange(child.id);
                                                                    setIsMobileMenuOpen(false);
                                                                }}
                                                                className={`px-12 py-3.5 text-left text-sm font-bold border-l-4 transition-all ${activeTab === child.id ? "border-[#003366] text-[#003366] bg-white translate-x-1" : "border-transparent text-gray-600"}`}
                                                            >
                                                                {child.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={navItem.id}
                                            onClick={() => {
                                                onTabChange(navItem.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-5 py-4 text-left font-black tracking-tight border-b border-gray-50 last:border-0 ${activeTab === navItem.id ? "text-[#003366] bg-blue-50/50" : "text-gray-700 hover:bg-gray-50"}`}
                                        >
                                            {getIconForTab(navItem.id, activeTab === navItem.id ? "text-[#003366]" : "text-gray-500")}
                                            {navItem.label}
                                        </button>
                                    );
                                })}

                                {/* Actions Section */}
                                <div className="p-4 bg-gray-50 mt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            toggleDrawer();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#003366] text-white rounded-xl font-bold text-xs shadow-md shadow-blue-900/10 active:scale-95 transition-transform"
                                    >
                                        <BookOpen size={16} />
                                        GUIDE
                                    </button>
                                    <button
                                        onClick={() => {
                                            onTabChange('contact');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform ${activeTab === 'contact' ? 'bg-[#003366] text-white' : 'bg-white border border-gray-100 text-gray-700'}`}
                                    >
                                        <Mail size={16} />
                                        CONTACT
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-100 text-[#CE1126] rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform col-span-2"
                                    >
                                        <LogOut size={16} />
                                        LOGOUT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
