import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { Map, Layers, MapPin, Database, AlertCircle, Maximize2, Minimize2, Search, Table, Info } from "lucide-react";

// Dynamically load leaflet map components
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap), { ssr: false });

function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 14, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

export default function ResourceMappingTab({ filters }) {
    const [mapData, setMapData] = useState({ points: [], loading: false, totalMatched: 0 });
    const [mapFocus, setMapFocus] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        fetchGISData();
    }, [filters.mapping_trigger, filters.active_layer, filters.resource_view_mode, filters.resource_mapping_type]);

    const fetchGISData = async () => {
        setMapData(prev => ({ ...prev, loading: true }));
        try {
            const params = new URLSearchParams({
                mode: filters.resource_view_mode,
                type: filters.resource_mapping_type,
                layer: filters.active_layer,
                region: filters.region !== 'All Regions' ? filters.region : '',
                division: filters.division || ''
            });

            const res = await fetch(`/api/resource-mapping?${params.toString()}`);
            const data = await res.json();
            if (data.status === "success") {
                setMapData({ points: data.data.points, totalMatched: data.data.totalMatched, loading: false });
            }
        } catch (e) {
            console.error("GIS Sync Failed:", e);
        } finally {
            setMapData(prev => ({ ...prev, loading: false }));
        }
    };

    const getPointStyle = (pt) => {
        const type = filters.resource_mapping_type;
        if (type === "Teaching Deployment") {
            if (pt.shortage > 0) return { color: "#CE1126", fill: "#CE1126", radius: 8 };
            if (pt.shortage < 0) return { color: "#003366", fill: "#003366", radius: 8 };
            return { color: "#059669", fill: "#059669", radius: 6 };
        }
        if (type === "Infrastructure") {
            return { color: "#FFB81C", fill: "#FFB81C", radius: 10 };
        }
        return { color: "#003366", fill: "#003366", radius: 6 };
    };

    const columns = [
        { name: 'School Name', selector: row => row.name, sortable: true, grow: 2 },
        { name: 'Metric', selector: row => row.metric_label || row.shortage || row.type, sortable: true },
        {
            name: 'Action',
            cell: row => (
                <button
                    onClick={() => {
                        setMapFocus([row.lat, row.lng]);
                        setSelectedSchool(row);
                    }}
                    className="p-1 px-2 bg-blue-50 text-[#003366] rounded hover:bg-blue-100 transition-colors"
                >
                    <MapPin size={12} />
                </button>
            ),
            width: '60px'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* Nav Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#003366] rounded-lg text-white">
                        <Layers size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[#003366] leading-none mb-1">
                            {filters.resource_view_mode === 'Immersive' ? 'Spatial Exploration Engine' : `Asset Mapping: ${filters.resource_mapping_type}`}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Database size={10} /> Active GIS Cluster Sync • {mapData.points.length.toLocaleString()} Nodes Plotted
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 1. Standard View Layout (Table + Map) */}
                {filters.resource_view_mode === 'Standard' && (
                    <div className="w-full h-full flex animate-in fade-in duration-500">
                        {/* Table Panel */}
                        <div className="w-[450px] border-r border-gray-200 bg-white flex flex-col shadow-xl z-20">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <h3 className="text-xs font-black text-[#003366] uppercase tracking-tighter flex items-center gap-2">
                                    <Table size={14} /> Regional Sub-Aggregation
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <DataTable
                                    columns={columns}
                                    data={mapData.points}
                                    pagination
                                    dense
                                    highlightOnHover
                                    pointerOnHover
                                    onRowClicked={(row) => {
                                        setMapFocus([row.lat, row.lng]);
                                        setSelectedSchool(row);
                                    }}
                                    customStyles={{
                                        headRow: { style: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' } },
                                        rows: { style: { minHeight: '52px' } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Map Panel */}
                        <div className="flex-1 relative z-0">
                            <MapContainer center={[12.87, 121.77]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
                                <MapController center={mapFocus} zoom={15} />
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {mapData.points.map((pt, i) => (
                                    <CircleMarker
                                        key={i}
                                        center={[pt.lat, pt.lng]}
                                        {...getPointStyle(pt)}
                                        pathOptions={{ fillOpacity: 0.7, weight: 1 }}
                                        eventHandlers={{
                                            click: () => {
                                                setSelectedSchool(pt);
                                                setMapFocus([pt.lat, pt.lng]);
                                            }
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-2 min-w-[180px]">
                                                <b className="text-[#003366] text-sm block mb-1">{pt.name}</b>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter mb-2">{pt.mun} | ID: {pt.id}</div>
                                                <div className="grid grid-cols-2 gap-2 text-center bg-gray-50 p-2 rounded">
                                                    <div>
                                                        <div className="text-[9px] font-bold text-gray-400">Metric</div>
                                                        <div className="text-xs font-black text-[#003366]">{pt.metric_val || pt.shortage || 0}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-bold text-gray-400">Trend</div>
                                                        <div className="text-xs font-black text-[#CE1126]">Stable</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* 2. Immersive View Layout (Full Screen Map) */}
                {filters.resource_view_mode === 'Immersive' && (
                    <div className="flex-1 relative h-full w-full animate-in zoom-in duration-300">
                        <MapContainer center={[12.87, 121.77]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png" />
                            {mapData.points.map((pt, i) => (
                                <CircleMarker
                                    key={i}
                                    center={[pt.lat, pt.lng]}
                                    radius={filters.active_layer ? 8 : 4}
                                    pathOptions={{ color: '#003366', fillColor: '#FFB81C', fillOpacity: 0.8, weight: 1 }}
                                >
                                    <Popup>
                                        <div className="font-bold">{pt.name}</div>
                                        <div className="text-xs text-gray-400">{pt.type || filters.active_layer}</div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>

                        {/* Overlay Detail HUD */}
                        {selectedSchool && (
                            <div className="absolute bottom-10 left-10 w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-6 z-[1000] animate-in slide-in-from-left-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-black text-[#003366] leading-tight">{selectedSchool.name}</h3>
                                    <button onClick={() => setSelectedSchool(null)} className="text-gray-400 hover:text-red-500 transition-colors"><Minimize2 size={16} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Info size={16} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Resource Status</p>
                                            <p className="text-sm font-bold text-gray-700">Operational Needs Detected</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Strategic Priority</span>
                                        <span className="text-xs font-black text-[#CE1126] bg-red-100 px-2 py-0.5 rounded-full">HIGH</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Loader */}
            {mapData.loading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-[#FFB81C] border-t-[#003366] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em]">Executing Mapping Run...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
