import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';
        const division = searchParams.get('division') || '';
        const municipality = searchParams.get('municipality') || '';
        const legislative_district = searchParams.get('legislative_district') || '';

        // Build SQL Query against dim_schools joined with raw_school_unique_v2
        let sql = `
            SELECT DISTINCT ON (s.schoolid)
                s.schoolid as id, 
                s.schoolname as name, 
                s.region, 
                s.division, 
                s.municipality, 
                r.legislative_district,
                s.latitude as lat, 
                s.longitude as lng
            FROM dim_schools s
            LEFT JOIN raw_school_unique_v2 r ON s.schoolid = r.schoolid
            WHERE 1=1
        `;
        const params = [];

        // Apply Drilldown Filters hierarchically
        if (region && region !== 'All Regions') {
            params.push(region);
            sql += ` AND s.region = $${params.length}`;
        }
        if (division) {
            params.push(division);
            sql += ` AND s.division = $${params.length}`;
        }
        if (municipality) {
            params.push(municipality);
            sql += ` AND s.municipality = $${params.length}`;
        }
        if (legislative_district) {
            params.push(legislative_district);
            sql += ` AND r.legislative_district = $${params.length}`;
        }

        // Apply Search Text Filter
        if (q) {
            params.push(`%${q}%`);
            sql += ` AND (
                s.schoolname ILIKE $${params.length} OR 
                CAST(s.schoolid AS TEXT) ILIKE $${params.length}
            )`;
        }

        // Map Rendering is safely managed by react-leaflet-cluster on the frontend now,
        // so we no longer need to impose artificial SQL limit caps to prevent crashing.

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: result.rows.map(row => ({
                ...row,
                needsRes: Math.floor(Math.random() * 15) // Mock resource needs for UI aesthetics, to be populated from a fact table later
            }))
        });

    } catch (error) {
        console.error("School Locator API Error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
