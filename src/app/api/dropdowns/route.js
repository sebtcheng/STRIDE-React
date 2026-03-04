import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');
        const division = searchParams.get('division');

        // Fetch unique values from dim_schools
        let divQuery = 'SELECT DISTINCT division FROM dim_schools WHERE division IS NOT NULL';
        const divParams = [];
        if (region) { divQuery += ' AND region = $1'; divParams.push(region); }
        divQuery += ' ORDER BY division';

        let distQuery = 'SELECT DISTINCT district FROM dim_schools WHERE district IS NOT NULL';
        const distParams = [];
        if (region) { distQuery += ' AND region = $1'; distParams.push(region); }
        if (division) { distQuery += ` AND division = $${distParams.length + 1}`; distParams.push(division); }
        distQuery += ' ORDER BY district';

        let munQuery = 'SELECT DISTINCT municipality FROM dim_schools WHERE municipality IS NOT NULL';
        const munParams = [];
        if (region) { munQuery += ' AND region = $1'; munParams.push(region); }
        if (division) { munQuery += ` AND division = $${munParams.length + 1}`; munParams.push(division); }
        munQuery += ' ORDER BY municipality';

        // Fetch legislative districts from raw_school_unique_v2
        let legDistQuery = 'SELECT DISTINCT legislative_district FROM raw_school_unique_v2 WHERE legislative_district IS NOT NULL';
        const legDistParams = [];
        if (region) {
            // we use ILIKE or standard matching, wait. 'raw_school_unique_v2' has old_region / region confusion.
            legDistQuery += " AND (region = $1 OR old_region = $1 OR region ILIKE '%' || $1 || '%')";
            legDistParams.push(region);
        }
        if (division) {
            legDistQuery += ` AND division = $${legDistParams.length + 1}`;
            legDistParams.push(division);
        }
        legDistQuery += ' ORDER BY legislative_district';

        const regionsRes = await pool.query('SELECT DISTINCT region FROM dim_schools WHERE region IS NOT NULL ORDER BY region');
        const divisionsRes = await pool.query(divQuery, divParams);
        const districtsRes = await pool.query(distQuery, distParams);
        const municipalitiesRes = await pool.query(munQuery, munParams);
        const legDistrictsRes = await pool.query(legDistQuery, legDistParams);

        // Fetch unique positions from gmis_filling
        const positionsRes = await pool.query('SELECT DISTINCT "position" FROM gmis_filling WHERE "position" IS NOT NULL ORDER BY "position"');

        // Fetch unique EFD categories
        const efdRes = await pool.query('SELECT DISTINCT category FROM fact_efd_masterlist WHERE category IS NOT NULL ORDER BY category');

        const regions = regionsRes.rows.map(r => r.region);
        const divisions = divisionsRes.rows.map(r => r.division);
        const districts = districtsRes.rows.map(r => r.district);
        const municipalities = municipalitiesRes.rows.map(r => r.municipality);
        const legDistricts = legDistrictsRes.rows.map(r => r.legislative_district);
        const positionsList = positionsRes.rows.map(r => r.position);
        const efdCategories = efdRes.rows.map(r => r.category);

        return NextResponse.json({
            status: "success",
            data: {
                uniRegions: regions,
                uniDivisions: divisions,
                uniDistricts: districts,
                uniMunicipalities: municipalities,
                uniLegislativeDistricts: legDistricts,
                efdCategories: efdCategories.length ? efdCategories : ["Classrooms", "Wash WINS", "Electrification"],
                gmisPositions: positionsList,
                analyticsMap: [] // Placeholder for column map if needed
            }
        });
    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
