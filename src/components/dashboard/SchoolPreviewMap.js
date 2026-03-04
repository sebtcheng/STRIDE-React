"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap, LayersControl, Tooltip } from "react-leaflet";
const { BaseLayer } = LayersControl;
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToStaticMarkup } from "react-dom/server";
import { School } from "lucide-react";

function ChangeView({ center, zoom, active }) {
    const map = useMap();
    useEffect(() => {
        if (active && center && center[0] && center[1]) {
            // Using whenReady to ensure Leaflet internal DOM elements are primed
            map.whenReady(() => {
                const timer = setTimeout(() => {
                    if (map._container) { // Extra safety check for Turbopack HMR
                        map.flyTo(center, zoom, { duration: 1.5 });
                    }
                }, 100);
                return () => clearTimeout(timer);
            });
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
                map.whenReady(() => {
                    const timer = setTimeout(() => {
                        if (map._container) {
                            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
                        }
                    }, 150);
                    return () => clearTimeout(timer);
                });
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

            marker.bindTooltip(`
                <div class="p-2 min-w-[200px] font-sans">
                    <div class="text-[#003366] font-bold text-xs border-b border-gray-100 pb-1 mb-1">${school.name}</div>
                    <div class="text-[10px] text-gray-600 leading-tight">
                        <div class="flex items-center gap-1 uppercase tracking-wider font-medium opacity-80">
                            ${school.region || ''} | ${school.division || ''} | ${school.municipality || ''} | ${school.id}
                        </div>
                        <div class="mt-2 text-blue-500 font-bold border-t border-blue-50 pt-1 flex items-center gap-1">
                             Click to view school data
                        </div>
                    </div>
                </div>
            `, {
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'rounded-lg border-2 border-blue-100 shadow-xl'
            });

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

    // Memoize center to prevent unnecessary triggers in map effects
    const center = useMemo(() => {
        return lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
            ? [Number(lat), Number(lng)]
            : defaultCenter;
    }, [lat, lng]);

    // Robust ID comparison to find the selected school in the results set
    const targetSchoolId = useMemo(() => {
        const found = results.find(r =>
            Number(r.lat) === Number(lat) &&
            Number(r.lng) === Number(lng)
        );
        return found?.id;
    }, [results, lat, lng]);

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
            <LayersControl position="topright">
                <BaseLayer name="Road View">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                </BaseLayer>
                <BaseLayer checked name="Satellite View">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    />
                </BaseLayer>
            </LayersControl>
            <NativeMarkerCluster
                schools={results}
                iconCreateFunction={clusterIconFunction}
                targetSchoolId={targetSchoolId}
                onMarkerClick={onMarkerClick}
            />
        </MapContainer>
    );
}
