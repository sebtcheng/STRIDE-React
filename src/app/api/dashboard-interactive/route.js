import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level') || 'National';
        const region = searchParams.get('region');
        const division = searchParams.get('division');

        const metricsParam = searchParams.get('metrics');
        const metrics = metricsParam ? metricsParam.split(',') : [];
        const groupBy = searchParams.get('groupBy') || 'municipality'; // Default to municipality for backwards compatibility

        if (metrics.length === 0) {
            return NextResponse.json({ status: "success", data: { blocks: [] } });
        }

        let groupCol = 'region';
        let filterSql = 'WHERE 1=1';
        let params = [];
        let geogTitle = "National View";

        const municipalityParams = searchParams.get('municipality');
        const legislativeDistrictParams = searchParams.get('legislative_district');

        if (level === 'Region' && region && region !== 'All Regions') {
            groupCol = 'division';
            params.push(region);
            filterSql += ` AND region = $${params.length}`;
            geogTitle = region; // removed "Region " prefix since it's already in the string
        } else if (level === 'Division' && division) {
            groupCol = groupBy === 'legislative_district' ? 'legislative_district' : 'municipality';
            params.push(division);
            filterSql += ` AND division = $${params.length}`;
            geogTitle = `Division of ${division} (${groupBy === 'legislative_district' ? 'By District' : 'By Municipality'})`;
        } else if (level === 'DistrictGroup') {
            groupCol = 'district';
            if (municipalityParams) {
                params.push(municipalityParams);
                filterSql += ` AND municipality = $${params.length}`;
                if (division) {
                    params.push(division);
                    filterSql += ` AND division = $${params.length}`;
                }
                geogTitle = `Municipality of ${municipalityParams}`;
            } else if (legislativeDistrictParams) {
                params.push(legislativeDistrictParams);
                filterSql += ` AND legislative_district = $${params.length}`;
                if (division) {
                    params.push(division);
                    filterSql += ` AND division = $${params.length}`;
                }
                geogTitle = `Legislative District: ${legislativeDistrictParams}`;
            }
        }

        const baseTable = (groupBy === 'legislative_district' && level === 'Division') || (level === 'DistrictGroup' && legislativeDistrictParams)
            ? '(SELECT d.*, r.legislative_district FROM dim_schools d LEFT JOIN raw_school_unique_v2 r ON d.schoolid = r.schoolid) AS base_table'
            : 'dim_schools';

        // 1. Definition Map (Connecting UI IDs to SQL implementations)
        const schemaDef = {
            TotalSchools: { type: 'COUNT', label: 'Number of Schools', sql: 'COUNT(*)' },
            TotalTeachers: { type: 'SUM', label: 'Total Teachers', sql: "SUM(CAST(NULLIF(totalteachers::text, '') AS numeric))" },
            TotalShortage: { type: 'SUM', label: 'Teacher Shortage', sql: "SUM(CAST(NULLIF(total_shortage::text, '') AS numeric))" },
            TotalClassrooms: { type: 'SUM', label: 'Total Classrooms', sql: "SUM(CAST(NULLIF(totalenrolment::text, '') AS numeric))" }, // Placeholder until EFD is joined
            ClassroomShortage: { type: 'SUM', label: 'Classroom Shortage', sql: "SUM(CAST(NULLIF(classroom_shortage::text, '') AS numeric))" },
            ClassroomRequirement: { type: 'SUM', label: 'Classroom Requirement', sql: "SUM(CAST(NULLIF(classroom_shortage::text, '') AS numeric))" }, // Mapped pending EFD pipeline details
            BuildableSpace: { type: 'SUM', label: 'Buildable Space Count', sql: "SUM(CASE WHEN with_buildable_space = 'Yes' THEN 1 ELSE 0 END)" },
            TotalEnrolment: { type: 'SUM', label: 'Total Enrolment', sql: "SUM(CAST(NULLIF(totalenrolment::text, '') AS numeric))" },
            BuildingCountGood: { type: 'SUM', label: 'Good Buildings', sql: "SUM(CAST(NULLIF(building_count_good_condition::text, '') AS numeric))" },
            BuildingCountNeedsMajorRepair: { type: 'SUM', label: 'Bldgs Major Repair', sql: "SUM(CAST(NULLIF(building_count_needs_major_repair::text, '') AS numeric))" },
            BuildingCountCondemned: { type: 'SUM', label: 'Bldgs Condemned', sql: "SUM(CAST(NULLIF(building_count_condemned__for_demolition::text, '') AS numeric))" },
            RoomsGood: { type: 'SUM', label: 'Good Rooms', sql: "SUM(CAST(NULLIF(number_of_rooms_good_condition::text, '') AS numeric))" },
            RoomsNeedsMajorRepair: { type: 'SUM', label: 'Rooms Major Repair', sql: "SUM(CAST(NULLIF(number_of_rooms_needs_major_repair::text, '') AS numeric))" },
            Kinder: { type: 'SUM', label: 'Kindergarten Enrolment', sql: "SUM(CAST(NULLIF(kinder::text, '') AS numeric))" },
            G1: { type: 'SUM', label: 'Grade 1', sql: "SUM(CAST(NULLIF(g1::text, '') AS numeric))" },
            G2: { type: 'SUM', label: 'Grade 2', sql: "SUM(CAST(NULLIF(g2::text, '') AS numeric))" },
            G3: { type: 'SUM', label: 'Grade 3', sql: "SUM(CAST(NULLIF(g3::text, '') AS numeric))" },
            G4: { type: 'SUM', label: 'Grade 4', sql: "SUM(CAST(NULLIF(g4::text, '') AS numeric))" },
            G5: { type: 'SUM', label: 'Grade 5', sql: "SUM(CAST(NULLIF(g5::text, '') AS numeric))" },
            G6: { type: 'SUM', label: 'Grade 6', sql: "SUM(CAST(NULLIF(g6::text, '') AS numeric))" },
            G7: { type: 'SUM', label: 'Grade 7', sql: "SUM(CAST(NULLIF(g7::text, '') AS numeric))" },
            G8: { type: 'SUM', label: 'Grade 8', sql: "SUM(CAST(NULLIF(g8::text, '') AS numeric))" },
            G9: { type: 'SUM', label: 'Grade 9', sql: "SUM(CAST(NULLIF(g9::text, '') AS numeric))" },
            G10: { type: 'SUM', label: 'Grade 10', sql: "SUM(CAST(NULLIF(g10::text, '') AS numeric))" },
            G11: { type: 'SUM', label: 'Grade 11', sql: "SUM(CAST(NULLIF(g11::text, '') AS numeric))" },
            G12: { type: 'SUM', label: 'Grade 12', sql: "SUM(CAST(NULLIF(g12::text, '') AS numeric))" },
            SchoolSizeTypology: { type: 'CATEGORICAL', label: 'School Size Typology', col: 'school_type' },
            ModifiedCOC: { type: 'CATEGORICAL', label: 'Curricular Offering', col: 'curricular_offering' },
            OwnershipType: { type: 'CATEGORICAL', label: 'Ownership Type', col: 'sector' },
            Shifting: { type: 'CATEGORICAL', label: 'Shifting Type', col: 'school_type' } // Placeholder fallback
        };

        const results = {};

        // 2. Dynamic Pipeline Mapper (equivalent to purrr::map backend logic)
        for (const metric of metrics) {
            const def = schemaDef[metric] || { type: 'SUM', label: metric.replace(/([A-Z])/g, ' $1').trim(), sql: `SUM(CAST(NULLIF(totalenrolment::text, '') AS numeric))` }; // Safe fallback

            if (def.type === 'CATEGORICAL') {
                const sql = `
                    SELECT ${def.col} as label, COUNT(*) as value
                    FROM ${baseTable}
                    ${filterSql} AND NULLIF(${def.col}::text, '') IS NOT NULL
                    GROUP BY ${def.col}
                    ORDER BY value DESC
                `;
                const res = await pool.query(sql, params);

                results[metric] = {
                    id: metric,
                    title: `Distribution of ${def.label}`,
                    subtitle: geogTitle,
                    type: 'categorical',
                    total: res.rows.reduce((acc, r) => acc + Number(r.value), 0),
                    data: {
                        labels: res.rows.map(r => r.label),
                        values: res.rows.map(r => Number(r.value))
                    }
                };
            } else {
                const sql = `
                    SELECT ${groupCol} as label, ${def.sql} as value
                    FROM ${baseTable}
                    ${filterSql}
                    GROUP BY ${groupCol}
                    ORDER BY value DESC
                `;
                const res = await pool.query(sql, params);

                const sumSql = `SELECT ${def.sql} as total FROM ${baseTable} ${filterSql}`;
                const sumRes = await pool.query(sumSql, params);

                results[metric] = {
                    id: metric,
                    title: `${def.label} by ${groupCol.charAt(0).toUpperCase() + groupCol.slice(1)}`,
                    subtitle: geogTitle,
                    type: 'numeric',
                    total: sumRes.rows[0]?.total ? Number(sumRes.rows[0].total) : 0,
                    data: {
                        labels: res.rows.map(r => r.label),
                        values: res.rows.map(r => Number(r.value))
                    }
                };
            }
        }

        return NextResponse.json({
            status: "success",
            data: { blocks: Object.values(results) }
        });

    } catch (error) {
        console.error("Dashboard Dynamic API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
