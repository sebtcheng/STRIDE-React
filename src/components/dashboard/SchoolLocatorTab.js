"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Search, MapPin } from "lucide-react";

// Dynamically load the Leaflet map to prevent SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse">Loading Map Engine...</div> }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

// Leaflet CSS needs to be imported or handled in layout, but let's mock the UI for now.

const mockData = [
    { id: 101123, name: "Aplaya National High School", region: "Region I", division: "Ilocos Norte", lat: 18.2, lng: 120.5, needsRes: 5 },
    { id: 102456, name: "Baguio City Special Education Center", region: "CAR", division: "Baguio City", lat: 16.4, lng: 120.6, needsRes: 12 },
    { id: 104789, name: "Cebu City Don Carlos A. Gothong MNHS", region: "Region VII", division: "Cebu City", lat: 10.3, lng: 123.9, needsRes: 25 },
    { id: 105112, name: "Davao City National High School", region: "Region XI", division: "Davao City", lat: 7.1, lng: 125.6, needsRes: 0 },
];

export default function SchoolLocatorTab({ filters }) {
    const [selectedSchool, setSelectedSchool] = useState(null);

    const filteredItems = mockData.filter(
        (item) => item.name && item.name.toLowerCase().includes((filters.q || '').toLowerCase())
    );

    const columns = [
        { name: "School ID", selector: (row) => row.id, sortable: true, width: "120px" },
        { name: "School Name", selector: (row) => row.name, sortable: true, grow: 2 },
        { name: "Region", selector: (row) => row.region, sortable: true },
        {
            name: "Resource Needs",
            selector: (row) => row.needsRes,
            sortable: true,
            cell: row => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.needsRes > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {row.needsRes} Flags
                </span>
            )
        },
    ];

    const handleRowClick = (row) => {
        setSelectedSchool(row);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Split View */}
            <div className="flex-1 flex flex-col lg:flex-row h-[70vh]">

                {/* Left Data Table Pane */}
                <div className="w-full lg:w-1/2 p-4 border-r border-gray-200 flex flex-col h-full">
                    <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                        <DataTable
                            columns={columns}
                            data={filteredItems}
                            pagination
                            paginationPerPage={10}
                            highlightOnHover
                            pointerOnHover
                            onRowClicked={handleRowClick}
                            customStyles={{
                                headRow: { style: { backgroundColor: '#003366', color: 'white', fontWeight: 'bold' } },
                                rows: { style: { '&:hover': { backgroundColor: '#f0f9ff' } } }
                            }}
                        />
                    </div>
                </div>

                {/* Right Map Pane */}
                <div className="w-full lg:w-1/2 bg-gray-100 relative h-full">
                    <MapContainer
                        center={selectedSchool ? [selectedSchool.lat, selectedSchool.lng] : [12.8797, 121.7740]}
                        zoom={selectedSchool ? 13 : 6}
                        scrollWheelZoom={true}
                        className="h-full w-full z-0 relative"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {mockData.map((school) => (
                            <Marker key={school.id} position={[school.lat, school.lng]}>
                                <Popup>
                                    <div className="font-sans">
                                        <strong>{school.name}</strong><br />
                                        ID: {school.id}<br />
                                        Region: {school.region}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Bottom Detail Panel */}
            <div className="h-48 border-t-4 border-[#003366] bg-zinc-50 p-6 flex items-center justify-center shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-10">
                {selectedSchool ? (
                    <div className="w-full max-w-4xl flex items-start gap-6">
                        <div className="p-4 bg-blue-100 rounded-full text-[#003366]">
                            <MapPin size={32} />
                        </div>
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">
                                {selectedSchool.name} <span className="text-sm font-normal text-gray-500 ml-2">({selectedSchool.id})</span>
                            </h3>
                            <div className="grid grid-cols-3 gap-8 mt-4 text-sm">
                                <div><strong className="text-gray-500 block">Region</strong> <span className="font-semibold text-gray-900">{selectedSchool.region}</span></div>
                                <div><strong className="text-gray-500 block">Division</strong> <span className="font-semibold text-gray-900">{selectedSchool.division}</span></div>
                                <div><strong className="text-gray-500 block">Resource Flags Status</strong> <span className="font-bold text-red-600">Critical Alerts Active</span></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 font-medium">Select a school from the table to view granular details.</p>
                )}
            </div>
        </div>
    );
}
