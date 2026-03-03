"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToStaticMarkup } from "react-dom/server";
import { School } from "lucide-react";

function ChangeView({ center, zoom, active }) {
    const map = useMap();
    useEffect(() => {
        if (active && center && center[0] && center[1]) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map, active]);
    return null;
}

function FitBounds({ results, active }) {
    const map = useMap();
    useEffect(() => {
        if (!active && results && results.length > 0) {
            const valid = results.filter(s => s.lat != null && s.lng != null && !isNaN(s.lat) && !isNaN(s.lng));
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(s => [Number(s.lat), Number(s.lng)]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            }
        }
    }, [results, active, map]);
    return null;
}

function NativeMarkerCluster({ schools, iconCreateFunction, targetSchoolId, onMarkerClick }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !schools) return;

        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            iconCreateFunction: iconCreateFunction
        });

        const validSchools = schools.filter(s => s.lat != null && s.lng != null && !isNaN(s.lat) && !isNaN(s.lng));

        const markers = validSchools.map(school => {
            const isActive = school.id === targetSchoolId;
            const marker = L.marker([Number(school.lat), Number(school.lng)], {
                icon: isActive ? customSchoolIconActive : customSchoolIconInactive
            });

            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(school));
            } else {
                marker.bindPopup(`
                    <div class="font-sans text-sm">
                        <strong class="text-[#003366] text-base">${school.name}</strong><br />
                        ID: ${school.id}<br />
                    </div>
                `);
            }
            return marker;
        });

        clusterGroup.addLayers(markers);
        map.addLayer(clusterGroup);

        return () => {
            map.removeLayer(clusterGroup);
        };
    }, [map, schools, iconCreateFunction, targetSchoolId, onMarkerClick]);

    return null;
}

const schoolIconSvgActive = renderToStaticMarkup(<School color="white" size={16} />);
const customSchoolIconActive = L.divIcon({
    html: `<div class="bg-[#003366] text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#FFB81C] shadow-lg focus:outline-none">${schoolIconSvgActive}</div>`,
    className: 'bg-transparent',
    iconSize: L.point(32, 32, true),
    iconAnchor: [16, 16],
});

const schoolIconSvgInactive = renderToStaticMarkup(<School color="white" size={12} />);
const customSchoolIconInactive = L.divIcon({
    html: `<div class="bg-[#003366] opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center border border-white shadow-sm focus:outline-none">${schoolIconSvgInactive}</div>`,
    className: 'bg-transparent',
    iconSize: L.point(24, 24, true),
    iconAnchor: [12, 12],
});

export default function SchoolPreviewMap({ lat, lng, name, results = [], onMarkerClick, zoom = 15 }) {
    const defaultCenter = [12.8797, 121.7740];

    // Ensure numeric parsing to prevent "Cannot set properties of undefined (setting '_leaflet_pos')" from string inputs
    const center = lat != null && lng != null && !isNaN(lat) && !isNaN(lng) ? [Number(lat), Number(lng)] : defaultCenter;
    const targetSchoolId = results.find(r => r.lat === lat && r.lng === lng)?.id;

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
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <ChangeView center={center} zoom={zoom} active={!!targetSchoolId} />
            <FitBounds results={results} active={!!targetSchoolId} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <NativeMarkerCluster
                schools={results}
                iconCreateFunction={clusterIconFunction}
                targetSchoolId={targetSchoolId}
                onMarkerClick={onMarkerClick}
            />
        </MapContainer>
    );
}
