import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Fetch unique values from schools_master
        const regionsRes = await pool.query('SELECT DISTINCT region FROM schools_master WHERE region IS NOT NULL ORDER BY region');
        const divisionsRes = await pool.query('SELECT DISTINCT division FROM schools_master WHERE division IS NOT NULL ORDER BY division');
        const districtsRes = await pool.query('SELECT DISTINCT "legislative_district" FROM schools_master WHERE "legislative_district" IS NOT NULL ORDER BY "legislative_district"');
        const municipalitiesRes = await pool.query('SELECT DISTINCT municipality FROM schools_master WHERE municipality IS NOT NULL ORDER BY municipality');

        // Fetch unique positions from gmis_filling
        const positionsRes = await pool.query('SELECT DISTINCT "position" FROM gmis_filling WHERE "position" IS NOT NULL ORDER BY "position"');

        const regions = regionsRes.rows.map(r => r.region);
        const divisions = divisionsRes.rows.map(r => r.division);
        const districts = districtsRes.rows.map(r => r.legislative_district);
        const municipalities = municipalitiesRes.rows.map(r => r.municipality);
        const positionsList = positionsRes.rows.map(r => r.position);

        const templateCategories = ["Classrooms", "Wash WINS", "Electrification"];

        return NextResponse.json({
            status: "success",
            data: {
                uniRegions: regions,
                uniDivisions: divisions,
                uniDistricts: districts,
                uniMunicipalities: municipalities,
                efdCategories: templateCategories,
                gmisPositions: positionsList,
                analyticsMap: [] // Placeholder for column map if needed
            }
        });
    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
