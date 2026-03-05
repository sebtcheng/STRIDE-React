"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToStaticMarkup } from "react-dom/server";
import { School } from "lucide-react";

// Standard School Icon Function
const getSchoolIcon = (color = "#003366") => {
    const schoolIconSvg = renderToStaticMarkup(
        <div style={{ backgroundColor: color }} className="text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#FFB81C] shadow-lg">
            <School size={16} color="white" />
        </div>
    );

    return L.divIcon({
        html: schoolIconSvg,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

// Industry Icon Function
const getIndustryIcon = () => {
    const industryIconSvg = renderToStaticMarkup(
        <div style={{ backgroundColor: '#f97316' }} className="text-white rounded-full w-6 h-6 flex items-center justify-center border border-white shadow-md">
            <div className="w-2.5 h-2.5 bg-white shrink-0" style={{ clipPath: 'polygon(0 100%, 0 0, 50% 50%, 100% 0, 100% 100%)' }}></div>
        </div>
    );

    return L.divIcon({
        html: industryIconSvg,
        className: 'bg-transparent',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        // Only fly to center if we have a specific coordinate (single school selection)
        if (center && center[0] && center[1]) {
            map.flyTo(center, zoom || 15, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

function FitBounds({ points, selectedSchool }) {
    const map = useMap();
    useEffect(() => {
        // If we are NOT focusing on a specific school, fit bounds to show all points
        if (!selectedSchool && points && points.length > 0) {
            const valid = points.filter(pt => pt && pt.lat != null && pt.lng != null && !isNaN(pt.lat) && !isNaN(pt.lng));
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(pt => [Number(pt.lat), Number(pt.lng)]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            }
        }
    }, [points, selectedSchool, map]);
    return null;
}

// --- Haversine Distance Utility ---
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- Calculate Industry Sector Counts Helper ---
const calculateIndustryCounts = (school, industryPoints) => {
    if (!school || !industryPoints || industryPoints.length === 0) return null;
    const sLat = Number(school.lat);
    const sLng = Number(school.lng);
    if (isNaN(sLat) || isNaN(sLng)) return null;

    const counts = {};
    industryPoints.forEach(ind => {
        const iLat = Number(ind.lat);
        const iLng = Number(ind.lng);
        if (isNaN(iLat) || isNaN(iLng)) return;

        const dist = getDistance(sLat, sLng, iLat, iLng);
        if (dist <= 5.0) { // 5km radius
            const sector = ind.sector || 'Uncategorized';
            counts[sector] = (counts[sector] || 0) + 1;
        }
    });

    return Object.keys(counts).length > 0 ? counts : null;
};

// Helper to build popup HTML
const getPopupHtml = (pt, activeCategory, industries, isTooltip = false) => {
    const rowStyle = "display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; background-color: #f9fafb; border-radius: 4px; border: 1px solid #f3f4f6; margin-bottom: 3px;";
    const labelStyle = "font-size: 8px; font-weight: bold; color: #6b7280; text-transform: uppercase;";
    const valueStyle = "font-size: 11px; font-weight: 800; color: #003366;";

    let tabContent = '';

    if (activeCategory === 'Teaching Deployment') {
        tabContent = `
            <div style="${rowStyle} background-color: #eff6ff;">
                <span style="${labelStyle} color: #1e40af;">Total Enrolment</span>
                <span style="${valueStyle}">${pt.enrollment || 0}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 4px;">
                <div style="padding: 4px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 4px; text-align: center;">
                    <div style="font-size: 8px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Shortage</div>
                    <div style="font-size: 14px; font-weight: 900; color: #7f1d1d;">${pt.shortage || 0}</div>
                </div>
                <div style="padding: 4px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 4px; text-align: center;">
                    <div style="font-size: 8px; font-weight: bold; color: #166534; text-transform: uppercase;">Excess</div>
                    <div style="font-size: 14px; font-weight: 900; color: #166534;">${pt.excess || 0}</div>
                </div>
            </div>
        `;
    } else if (activeCategory === 'Non-teaching Deployment') {
        tabContent = `
            <div style="${rowStyle}">
                <span style="${labelStyle}">AO II Status</span>
                <span style="${valueStyle}">${pt.metric_label || 'None'}</span>
            </div>
            <div style="${rowStyle}">
                <span style="${labelStyle}">PDO I Status</span>
                <span style="${valueStyle}">${pt.pdoi_deployment === 'With PDO I' ? 'With PDO I' : 'Without'}</span>
            </div>
        `;
    } else if (activeCategory === 'Classrooms' || activeCategory === 'Last Mile Schools') {
        const isBuildable = pt.buildable_space === '1' || pt.buildable_space === 1 || pt.buildable_space === 'Yes';
        tabContent = `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Total Enrolment</span>
                <span style="${valueStyle}">${pt.enrollment || 0}</span>
            </div>
            <div style="${rowStyle}">
                <span style="${labelStyle}">Classroom Inventory</span>
                <span style="${valueStyle}">${pt.inventory || 0}</span>
            </div>
            <div style="${rowStyle} background-color: #fef2f2;">
                <span style="${labelStyle} color: #991b1b;">Classroom Shortage</span>
                <span style="${valueStyle} color: #7f1d1d;">${pt.shortage || 0}</span>
            </div>
            <div style="${rowStyle}">
                <span style="${labelStyle}">Buildable Space</span>
                <span style="${valueStyle}">${isBuildable ? 'Yes' : 'No'}</span>
            </div>
        `;
    } else if (activeCategory === 'Facilities') {
        const amount = pt.metric_val ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(pt.metric_val) : 'N/A';
        tabContent = `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Facility Type</span>
                <span style="${valueStyle}">${pt.metric_label || 'Unknown'}</span>
            </div>
            <div style="${rowStyle}">
                <span style="${labelStyle}">Funding Year</span>
                <span style="${valueStyle}">${pt.fundingyear || 'N/A'}</span>
            </div>
            <div style="${rowStyle} background-color: #f0fdf4;">
                <span style="${labelStyle} color: #166534;">Allocation</span>
                <span style="${valueStyle} color: #166534;">${amount}</span>
            </div>
        `;
    } else if (activeCategory === 'Congestion') {
        tabContent = `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Total Enrolment</span>
                <span style="${valueStyle}">${pt.enrollment || 0}</span>
            </div>
            <div style="${rowStyle}">
                <span style="${labelStyle}">Total Classrooms</span>
                <span style="${valueStyle}">${pt.total_classrooms || 0}</span>
            </div>
            <div style="${rowStyle} background-color: #fff7ed;">
                <span style="${labelStyle} color: #9a3412;">Congestion Index (Normalized)</span>
                <span style="${valueStyle} color: #9a3412;">${pt.congestion_index || '0.00'}</span>
            </div>
        `;
    } else if (activeCategory === 'Industries (SHS)') {
        const industryList = industries ? `
             <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                 <h4 style="font-size: 8px; font-weight: bold; color: #003366; text-transform: uppercase; margin-bottom: 4px;">Nearby Industries</h4>
                 <div style="font-size: 10px; max-height: 80px; overflow-y: auto;">
                    ${Object.entries(industries).map(([sector, count]) => `
                      <div style="display: flex; justify-content: space-between; background: #f9fafb; margin: 2px 0; padding: 2px 4px; border-radius: 2px;">
                         <span style="color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;">${sector}</span>
                         <span style="font-weight: bold; color: #003366;">${count}</span>
                      </div>
                    `).join('')}
                 </div>
             </div>` : '';

        tabContent = `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Total Enrolment</span>
                <span style="${valueStyle}">${pt.metric_val || 0}</span>
            </div>
            ${industryList}
        `;
    }

    return `
        <div style="padding: 4px; min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <b style="color: #003366; font-size: 13px; display: block; margin-bottom: 2px; line-height: 1.2;">${pt.name}</b>
            <div style="font-size: 9px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px;">
                ${pt.region || 'N/A'} | ${pt.division || 'N/A'} | ${pt.district || pt.municipality || 'N/A'} | ID: ${pt.id}
            </div>
            
            <div style="margin-top: 4px;">
                ${tabContent}
            </div>
            ${isTooltip ? `
            <div style="margin-top: 8px; font-size: 10px; color: #3b82f6; font-weight: bold; border-top: 1px solid #eff6ff; padding-top: 6px; text-align: center; cursor: pointer;">
                 <span style="background: #ebf5ff; padding: 4px 8px; border-radius: 4px; display: inline-block; width: 100%;">Click to view school data modal</span>
            </div>` : ''}
        </div>
    `;
};

function NativeMarkerCluster({ mapData, iconCreateFunction, industryIconCreateFunction, setSelectedSchool, setMapFocus, selectedSchool, activeCategory, selectedSchoolIndustries, onMarkerClick }) {
    const map = useMap();
    const markersRef = useRef(new Map());
    const clusterGroupRef = useRef(null);
    const industryClusterGroupRef = useRef(null);

    const getMarkerColor = (pt) => {
        if (activeCategory === 'Teaching Deployment') {
            if ((pt.shortage || 0) > 0) return "#ef4444"; // Red
            if ((pt.excess || 0) > 0) return "#3b82f6"; // Blue
            return "#22c55e"; // Green
        }

        if (activeCategory === 'Non-teaching Deployment') {
            const hasAOII = pt.metric_label && pt.metric_label !== 'None Deployed';
            const hasPDOI = pt.pdoi_deployment === 'With PDO I';

            if (hasAOII && hasPDOI) return "#22c55e"; // Green: With both
            if (!hasAOII && !hasPDOI) return "#ef4444"; // Red: No both
            return "#f59e0b"; // Orange: At least 1
        }

        if (activeCategory === 'Classrooms') {
            const shortageValue = Number(String(pt.shortage || '0').replace(/[^0-9.-]+/g, ''));
            if (shortageValue > 0) return "#ef4444"; // Red: With Shortage
            return "#22c55e"; // Green: Without Shortage
        }

        if (activeCategory === 'Facilities') {
            const year = parseInt(pt.fundingyear, 10);
            if (!isNaN(year) && year < 2025) return "#ef4444"; // Red: Before 2025
            return "#22c55e"; // Green: 2025 and beyond
        }

        if (activeCategory === 'Last Mile Schools') {
            const shortageValue = Number(String(pt.shortage || '0').replace(/[^0-9.-]+/g, ''));
            const isBuildable = pt.buildable_space === '1' || pt.buildable_space === 1 || pt.buildable_space === 'Yes';

            if (shortageValue > 0) {
                return isBuildable ? "#22c55e" : "#ef4444"; // Green if buildable, Red if not
            }
            return "#9ca3af"; // Grey: Without Shortage
        }

        if (activeCategory === 'Congestion') {
            const index = Number(pt.congestion_index || 0);
            if (index > 0.9) return "#ef4444"; // Red
            if (index >= 0.75) return "#f59e0b"; // Orange
            return "#22c55e"; // Green
        }

        return "#003366";
    };

    useEffect(() => {
        if (!map || (!mapData?.points && !mapData?.industryPoints)) return;

        if (clusterGroupRef.current) {
            map.removeLayer(clusterGroupRef.current);
        }
        if (industryClusterGroupRef.current) {
            map.removeLayer(industryClusterGroupRef.current);
        }
        markersRef.current.clear();

        // 1. Plot Schools via Cluster Group
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            iconCreateFunction: iconCreateFunction,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });

        if (mapData?.points) {
            const markers = mapData.points
                .filter(pt => pt && pt.lat != null && pt.lng != null && !isNaN(pt.lat) && !isNaN(pt.lng))
                .map(pt => {
                    const color = getMarkerColor(pt);
                    const marker = L.marker([Number(pt.lat), Number(pt.lng)], { icon: getSchoolIcon(color) });

                    // Pre-calculate industries if in Industries tab for tooltip/popup consistency
                    let indData = null;
                    if (activeCategory === 'Industries (SHS)' && mapData.industryPoints) {
                        indData = calculateIndustryCounts(pt, mapData.industryPoints);
                    }

                    marker.bindPopup(getPopupHtml(pt, activeCategory, indData), { minWidth: 220 });
                    marker.bindTooltip(getPopupHtml(pt, activeCategory, indData, true), {
                        direction: 'top',
                        offset: [0, -10],
                        opacity: 1,
                        className: 'rounded-lg border-2 border-blue-100 shadow-xl bg-white'
                    });
                    marker.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        setSelectedSchool(pt);
                        setMapFocus([Number(pt.lat), Number(pt.lng)]);
                        if (onMarkerClick) onMarkerClick(pt);
                    });
                    markersRef.current.set(pt.id, marker);
                    return marker;
                });

            clusterGroup.addLayers(markers);
            map.addLayer(clusterGroup);
            clusterGroupRef.current = clusterGroup;
        }

        // 2. Plot Industries via Cluster Group
        if (activeCategory === 'Industries (SHS)' && mapData?.industryPoints) {
            const industryClusterGroup = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                iconCreateFunction: industryIconCreateFunction,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });

            const industryMarkers = mapData.industryPoints
                .filter(pt => pt && pt.lat != null && pt.lng != null && !isNaN(pt.lat) && !isNaN(pt.lng))
                .map(pt => {
                    const marker = L.marker([Number(pt.lat), Number(pt.lng)], { icon: getIndustryIcon() });
                    const popupHtml = `
                        <div style="padding: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            <b style="color: #ea580c; font-size: 13px; display: block; margin-bottom: 2px;">${pt.name}</b>
                            <div style="font-size: 10px; color: #4b5563; font-weight: bold;">Sector: ${pt.sector}</div>
                            <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">${pt.mun || ''}</div>
                        </div>
                    `;
                    marker.bindPopup(popupHtml, { minWidth: 150 });
                    return marker;
                });

            industryClusterGroup.addLayers(industryMarkers);
            map.addLayer(industryClusterGroup);
            industryClusterGroupRef.current = industryClusterGroup;
        }

        return () => {
            if (clusterGroupRef.current) {
                map.removeLayer(clusterGroupRef.current);
                clusterGroupRef.current = null;
            }
            if (industryClusterGroupRef.current) {
                map.removeLayer(industryClusterGroupRef.current);
                industryClusterGroupRef.current = null;
            }
        };
    }, [map, mapData, iconCreateFunction, activeCategory]);

    useEffect(() => {
        if (!selectedSchool || !clusterGroupRef.current) return;
        const marker = markersRef.current.get(selectedSchool.id);
        if (marker) {
            clusterGroupRef.current.zoomToShowLayer(marker, () => {
                marker.openPopup();
            });
        }
    }, [selectedSchool]);

    useEffect(() => {
        if (activeCategory === 'Industries (SHS)' && selectedSchool && selectedSchoolIndustries) {
            const marker = markersRef.current.get(selectedSchool.id);
            if (marker) {
                marker.setPopupContent(getPopupHtml(selectedSchool, activeCategory, selectedSchoolIndustries));
                if (map.getBounds().contains(marker.getLatLng())) {
                    marker.openPopup();
                }
            }
        }
    }, [selectedSchoolIndustries, activeCategory, selectedSchool, map]);

    return null;
}

function MapLegend({ activeCategory }) {
    if (!['Teaching Deployment', 'Non-teaching Deployment', 'Classrooms', 'Facilities', 'Last Mile Schools', 'Congestion'].includes(activeCategory)) return null;

    if (activeCategory === 'Congestion') {
        return (
            <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
                <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '160px' }}>
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Congestion Index</h4>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">High (&gt; 0.9)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">Medium (0.75 - 0.9)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">Low (&lt; 0.75)</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCategory === 'Last Mile Schools') {
        return (
            <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
                <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '180px' }}>
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Last Mile Schools Status</h4>
                    <div className="space-y-1 text-[10px] font-medium text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-[#ef4444] rounded-sm opacity-70 shrink-0"></div>
                            <span>With Shortage + Without Buildable Space</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-[#22c55e] rounded-sm opacity-70 shrink-0"></div>
                            <span>With Shortage + With Buildable Space</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-[#9ca3af] rounded-sm opacity-70 shrink-0"></div>
                            <span>Without Shortage + No Buildable Space</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCategory === 'Facilities') {
        return (
            <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
                <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '160px' }}>
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Funding Year</h4>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-[#ef4444] rounded-sm opacity-70"></div>
                            <span className="text-[10px] font-medium text-gray-600">Before 2025</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#22c55e] rounded-sm opacity-70"></div>
                            <span className="text-[10px] font-medium text-gray-600">2025-2030</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCategory === 'Classrooms') {
        return (
            <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
                <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '160px' }}>
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Legend</h4>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-[#ef4444] rounded-sm opacity-70"></div>
                            <span className="text-[10px] font-medium text-gray-600">With Classroom Shortage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#22c55e] rounded-sm opacity-70"></div>
                            <span className="text-[10px] font-medium text-gray-600">Without Classroom Shortage</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCategory === 'Teaching Deployment') {
        return (
            <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
                <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '120px' }}>
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Teacher Deployment</h4>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">Shortage</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">Excess</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white/50 shadow-sm"></div>
                            <span className="text-[10px] font-medium text-gray-600">Balanced</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '24px', marginRight: '10px' }}>
            <div className="leaflet-control bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200/50 pointer-events-auto" style={{ minWidth: '160px' }}>
                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mb-1.5 border-bottom pb-1 text-center">Legend</h4>
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-[#ef4444] rounded-sm opacity-70"></div>
                        <span className="text-[10px] font-medium text-gray-600">No AO II and PDO I</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#22c55e] rounded-sm opacity-70"></div>
                        <span className="text-[10px] font-medium text-gray-600">With AO II and PDO I</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#f59e0b] rounded-sm opacity-70"></div>
                        <span className="text-[10px] font-medium text-gray-600">With at least 1 AO II or PDO I</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResourceMapArea({ mapData, mapFocus, setSelectedSchool, setMapFocus, activeCategory, selectedSchoolIndustries, selectedSchool, onMarkerClick }) {
    const clusterIconFunction = (cluster) => {
        return L.divIcon({
            html: `<div class="bg-white text-[#003366] font-bold rounded-full w-9 h-9 flex items-center justify-center border-2 border-[#003366] shadow-lg text-xs opacity-95">${cluster.getChildCount()}</div>`,
            className: 'bg-transparent',
            iconSize: L.point(36, 36, true),
        });
    };

    const industryClusterIconFunction = (cluster) => {
        return L.divIcon({
            html: `<div class="bg-white text-[#ea580c] font-bold rounded-full w-9 h-9 flex items-center justify-center border-2 border-[#ea580c] shadow-lg text-xs opacity-95">${cluster.getChildCount()}</div>`,
            className: 'bg-transparent',
            iconSize: L.point(36, 36, true),
        });
    };

    return (
        <MapContainer center={[12.87, 121.77]} zoom={6} scrollWheelZoom={true} className="h-full w-full absolute inset-0 z-0">
            <MapController center={mapFocus} zoom={16} />
            <FitBounds points={mapData.points} selectedSchool={selectedSchool} />
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            <MapLegend activeCategory={activeCategory} />

            <NativeMarkerCluster
                mapData={mapData}
                iconCreateFunction={clusterIconFunction}
                industryIconCreateFunction={industryClusterIconFunction}
                setSelectedSchool={setSelectedSchool}
                setMapFocus={setMapFocus}
                selectedSchool={selectedSchool}
                activeCategory={activeCategory}
                selectedSchoolIndustries={selectedSchoolIndustries}
                onMarkerClick={onMarkerClick}
            />
        </MapContainer>
    );
}
