"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
const { BaseLayer } = LayersControl;
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToStaticMarkup } from "react-dom/server";
import { School } from "lucide-react";
// Fix for default marker icons not showing up in Next.js
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

function NativeMarkerCluster({ schools, iconCreateFunction }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !schools) return;

        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            iconCreateFunction: iconCreateFunction
        });

        const markers = schools.map(school => {
            const marker = L.marker([school.lat, school.lng], { icon: customSchoolIcon });
            marker.bindPopup(`
                <div class="font-sans text-sm">
                    <strong class="text-[#003366] text-base">${school.name}</strong><br />
                    ID: ${school.id}<br />
                    Region: ${school.region}<br />
                    Division: ${school.division}
                </div>
            `);
            return marker;
        });

        clusterGroup.addLayers(markers);
        map.addLayer(clusterGroup);

        return () => {
            map.removeLayer(clusterGroup);
        };
    }, [map, schools, iconCreateFunction]);

    return null;
}

const schoolIconSvg = renderToStaticMarkup(<School color="white" size={16} />);
const customSchoolIcon = L.divIcon({
    html: `<div class="bg-[#003366] text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-md focus:outline-none">${schoolIconSvg}</div>`,
    className: 'bg-transparent',
    iconSize: L.point(32, 32, true),
    iconAnchor: [16, 16],
});

export default function SchoolLocatorMapInner({ selectedSchool, activeSchools }) {
    const defaultCenter = [12.8797, 121.7740];
    const center = selectedSchool ? [selectedSchool.lat, selectedSchool.lng] : defaultCenter;
    const zoom = selectedSchool ? 13 : 6;
    const clusterIconFunction = useMemo(() => {
        return (cluster) => {
            return L.divIcon({
                html: `<div class="bg-white text-[#003366] font-bold rounded-full w-9 h-9 flex items-center justify-center border-2 border-[#003366]/50 shadow-sm text-xs opacity-90">${cluster.getChildCount()}</div>`,
                className: 'bg-transparent',
                iconSize: L.point(36, 36, true),
            });
        };
    }, []);

    return (
        <MapContainer
            center={defaultCenter} // Mount once with a static starting center, use ChangeView to handle dynamic updates robustly across React 18 strict mode
            zoom={6}
            scrollWheelZoom={true}
            className="h-full w-full z-0 relative"
        >
            <ChangeView center={center} zoom={zoom} />
            <LayersControl position="topright">
                <BaseLayer name="Road View">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </BaseLayer>
                <BaseLayer checked name="Satellite View">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    />
                </BaseLayer>
            </LayersControl>
            <NativeMarkerCluster schools={activeSchools} iconCreateFunction={clusterIconFunction} />
        </MapContainer>
    );
}
