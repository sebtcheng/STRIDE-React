"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

export default function SchoolPreviewMap({ lat, lng, name, results = [], onMarkerClick, zoom = 15 }) {
    const defaultCenter = [12.8797, 121.7740];
    const center = lat && lng ? [lat, lng] : defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <ChangeView center={center} zoom={zoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {results.map((school) => {
                const isActive = school.id === results.find(r => r.lat === lat && r.lng === lng)?.id;
                return (
                    <CircleMarker
                        key={school.id}
                        center={[school.lat, school.lng]}
                        radius={isActive ? 12 : 6}
                        eventHandlers={{
                            click: () => onMarkerClick && onMarkerClick(school),
                        }}
                        pathOptions={{
                            color: isActive ? '#003366' : '#CE1126',
                            fillColor: isActive ? '#FFB81C' : '#CE1126',
                            fillOpacity: 0.7,
                            weight: isActive ? 3 : 1
                        }}
                    >
                        <Popup>
                            <div className="text-xs font-bold text-[#003366]">{school.name}</div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
