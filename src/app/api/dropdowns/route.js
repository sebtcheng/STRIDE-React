import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const regionStr = searchParams.get('region');
        const regionsStr = searchParams.get('regions'); // Comma-separated
        const divisionStr = searchParams.get('division');
        const divisionsStr = searchParams.get('divisions'); // Comma-separated

        // Handle single or multiple combinations
        let activeRegions = [];
        if (regionsStr) activeRegions = regionsStr.split(',').filter(Boolean);
        else if (regionStr) activeRegions = [regionStr];

        let activeDivisions = [];
        if (divisionsStr) activeDivisions = divisionsStr.split(',').filter(Boolean);
        else if (divisionStr) activeDivisions = [divisionStr];

        // Fetch unique values from dim_schools
        let divQuery = 'SELECT DISTINCT division FROM dim_schools WHERE division IS NOT NULL';
        const divParams = [];
        if (activeRegions.length > 0) {
            divQuery += ' AND region = ANY($1)';
            divParams.push(activeRegions);
        }
        divQuery += ' ORDER BY division';

        let distQuery = 'SELECT DISTINCT district FROM dim_schools WHERE district IS NOT NULL';
        const distParams = [];
        if (activeRegions.length > 0) {
            distQuery += ' AND region = ANY($1)';
            distParams.push(activeRegions);
        }
        if (activeDivisions.length > 0) {
            distQuery += ` AND division = ANY($${distParams.length + 1})`;
            distParams.push(activeDivisions);
        }
        distQuery += ' ORDER BY district';

        let munQuery = 'SELECT DISTINCT municipality FROM dim_schools WHERE municipality IS NOT NULL';
        const munParams = [];
        if (activeRegions.length > 0) {
            munQuery += ' AND region = ANY($1)';
            munParams.push(activeRegions);
        }
        if (activeDivisions.length > 0) {
            munQuery += ` AND division = ANY($${munParams.length + 1})`;
            munParams.push(activeDivisions);
        }
        munQuery += ' ORDER BY municipality';

        // Fetch legislative districts from raw_school_unique_v2
        let legDistQuery = 'SELECT DISTINCT legislative_district FROM raw_school_unique_v2 WHERE legislative_district IS NOT NULL';
        const legDistParams = [];
        if (activeRegions.length > 0) {
            // Because of old_region / region mismatch matching strings... Using regex/ANY for simplicity
            // For array match we just use identical match for now to simplify
            legDistQuery += " AND (region = ANY($1) OR old_region = ANY($1))";
            legDistParams.push(activeRegions);
        }
        if (activeDivisions.length > 0) {
            legDistQuery += ` AND division = ANY($${legDistParams.length + 1})`;
            legDistParams.push(activeDivisions);
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
