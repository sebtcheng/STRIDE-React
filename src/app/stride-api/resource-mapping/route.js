import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const mode = searchParams.get('mode') || 'Standard';
        const type = searchParams.get('type') || 'Teaching Deployment';
        const layer = searchParams.get('layer') || 'All Schools';

        // Define mapping for Regions from Dropdown -> DB Format
        const regionMap = {
            "Ilocos Region": "Region I",
            "Cagayan Valley": "Region II",
            "Central Luzon": "Region III",
            "CALABARZON": "Region IV-A",
            "MIMAROPA": "MIMAROPA",
            "Bicol Region": "Region V",
            "Western Visayas": "Region VI",
            "Central Visayas": "Region VII",
            "Eastern Visayas": "Region VIII",
            "Zamboanga Peninsula": "Region IX",
            "Northern Mindanao": "Region X",
            "Davao Region": "Region XI",
            "SOCCSKSARGEN": "Region XII",
            "Caraga": "CARAGA",
            "NCR": "NCR",
            "CAR": "CAR",
            "BARMM": "BARMM"
        };

        let initialRegion = searchParams.get('region');
        const region = regionMap[initialRegion] || initialRegion;

        const division = searchParams.get('division');
        const district = searchParams.get('legislative_district');
        const level = searchParams.get('level'); // ES, JHS, SHS
        const efd_type_raw = searchParams.get('efd_type'); // For Facilities
        const efd_type = efd_type_raw ? efd_type_raw.split(',') : null;
        let pointsSql = "";
        let pointsParams = [];
        let summarySqls = []; // Array of { key, sql, params, process }
        let industryPointsSql = null;
        let industryPointsParams = [];

        let customSummary = {};

        const offset = () => pointsParams.length + 1;

        if (type === 'Teaching Deployment') {
            pointsSql = `
                SELECT DISTINCT ON (schoolid)
                    schoolid as id, schoolname as name, municipality as mun, latitude as lat, longitude as lng,
                    region, division, district,
                    teachershortage as shortage, teacherexcess as excess, totalenrolment as enrollment
                FROM raw_school_level_v2
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            `;
            if (level && level !== 'All Levels') {
                pointsParams.push(level);
                pointsSql += ` AND level = $${offset() - 1}`;
            }

            customSummary = { roFillRate: '--%', roUnfilled: '--', sdoFillRate: '--%', sdoUnfilled: '--' };
            if (region) {
                summarySqls.push({
                    key: 'ro',
                    sql: `SELECT filluprate, unfilled FROM dim_sdo_fill WHERE (region = '#N/A' OR region IS NULL OR region = 'None') AND division = $1`,
                    params: [region],
                    process: (rows) => {
                        if (rows.length > 0) {
                            customSummary.roFillRate = rows[0].filluprate;
                            customSummary.roUnfilled = rows[0].unfilled;
                        }
                    }
                });
                if (division) {
                    summarySqls.push({
                        key: 'sdo',
                        sql: `SELECT filluprate, unfilled FROM dim_sdo_fill WHERE region = $1 AND division = $2`,
                        params: [region, division],
                        process: (rows) => {
                            if (rows.length > 0) {
                                customSummary.sdoFillRate = rows[0].filluprate;
                                customSummary.sdoUnfilled = rows[0].unfilled;
                            }
                        }
                    });
                }
            }

        } else if (type === 'Non-teaching Deployment' || type === 'Non-teaching Deployment (AO II)') {
            pointsSql = `
                SELECT DISTINCT ON (schoolid)
                    schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng,
                    region, division, district,
                    clustering_status as metric_label, pdoi_deployment, 1 as metric_val
                FROM raw_school_unique_v2
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND clustering_status IS NOT NULL
            `;
            customSummary = {
                regClustered: 0, regDedicated: 0,
                divClustered: 0, divDedicated: 0,
                distClustered: 0, distDedicated: 0
            };
            if (region) {
                summarySqls.push({
                    sql: `SELECT clustering_status, COUNT(*) as cnt FROM raw_school_unique_v2 WHERE region = $1 GROUP BY clustering_status`,
                    params: [region],
                    process: (r) => { r.forEach(x => { if (x.clustering_status === 'Clustered') customSummary.regClustered = x.cnt; if (x.clustering_status === 'Dedicated') customSummary.regDedicated = x.cnt; }) }
                });
                if (division) {
                    summarySqls.push({
                        sql: `SELECT clustering_status, COUNT(*) as cnt FROM raw_school_unique_v2 WHERE region = $1 AND division = $2 GROUP BY clustering_status`,
                        params: [region, division],
                        process: (r) => { r.forEach(x => { if (x.clustering_status === 'Clustered') customSummary.divClustered = x.cnt; if (x.clustering_status === 'Dedicated') customSummary.divDedicated = x.cnt; }) }
                    });
                    if (district) {
                        summarySqls.push({
                            sql: `SELECT clustering_status, COUNT(*) as cnt FROM raw_school_unique_v2 WHERE region = $1 AND division = $2 AND legislative_district = $3 GROUP BY clustering_status`,
                            params: [region, division, district],
                            process: (r) => { r.forEach(x => { if (x.clustering_status === 'Clustered') customSummary.distClustered = x.cnt; if (x.clustering_status === 'Dedicated') customSummary.distDedicated = x.cnt; }) }
                        });
                    }
                }
            }
        } else if (type === 'Classrooms') {
            pointsSql = `
                SELECT DISTINCT ON (l.school_id)
                    l.school_id as id, l.school_name as name, l.municipality as mun, 
                    b.latitude as lat, b.longitude as lng,
                    b.region, b.division, b.district,
                    l.estimated_cl_shortage as shortage, l.total_enrollment as enrollment,
                    l.instructional_rooms as inventory, l.buildable_space
                FROM efd_lms l
                INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text
                WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            `;
            customSummary = { regShortage: 0, divShortage: 0 };
            if (region) {
                summarySqls.push({
                    sql: `SELECT SUM(NULLIF(regexp_replace(l.estimated_cl_shortage::text, '[^0-9.-]', '', 'g'), '')::numeric) as total FROM efd_lms l INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text WHERE (b.region = $1 OR b.old_region = $1)`,
                    params: [region],
                    process: (r) => { if (r.length > 0) customSummary.regShortage = r[0].total || 0; }
                });
                if (division) {
                    summarySqls.push({
                        sql: `SELECT SUM(NULLIF(regexp_replace(l.estimated_cl_shortage::text, '[^0-9.-]', '', 'g'), '')::numeric) as total FROM efd_lms l INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text WHERE (b.region = $1 OR b.old_region = $1) AND b.division = $2`,
                        params: [region, division],
                        process: (r) => { if (r.length > 0) customSummary.divShortage = r[0].total || 0; }
                    });
                }
            }
        } else if (type === 'Industries (SHS)') {
            pointsSql = `
                SELECT DISTINCT ON (r.schoolid)
                    r.schoolid as id, r.schoolname as name, r.municipality as mun, r.latitude as lat, r.longitude as lng,
                    r.region, r.division, r.district,
                    l.total_enrollment as metric_val
                FROM raw_school_level_v2 r
                LEFT JOIN efd_lms l ON r.schoolid::text = l.school_id::text
                WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL AND r.level = 'SHS'
            `;

            industryPointsSql = `
                SELECT 
                    company as name, sector, latitude as lat, longitude as lng, province as mun
                FROM shs_industry
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            `;

            customSummary = { totalSHS: 0, totalIndustry: 0 };
            if (region) {
                summarySqls.push({
                    sql: `SELECT COUNT(*) as total FROM raw_school_level_v2 WHERE region = $1 AND level = 'SHS'`,
                    params: [region],
                    process: (r) => { if (r.length > 0) customSummary.totalSHS = r[0].total || 0; }
                });
                summarySqls.push({
                    sql: `SELECT COUNT(*) as total FROM shs_industry WHERE region = $1`,
                    params: [region],
                    process: (r) => { if (r.length > 0) customSummary.totalIndustry = r[0].total || 0; }
                });
                industryPointsSql += ` AND region = $1`;
                industryPointsParams.push(region);

                if (division) {
                    industryPointsSql += ` AND division = $2`;
                    industryPointsParams.push(division);
                }
            }
        } else if (type === 'Facilities') {
            pointsSql = `
                SELECT 
                    CONCAT(schoolid, '_', category, '_', fundingyear) as id, school_name as name, district as mun, latitude as lat, longitude as lng,
                    region, division, district,
                    category as metric_label, CAST(allocation AS NUMERIC) as metric_val, fundingyear
                FROM fact_efd_masterlist
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            `;
            if (efd_type && efd_type.length > 0) {
                pointsParams.push(efd_type);
                pointsSql += ` AND category = ANY($${offset() - 1})`;
            }
        } else if (type === 'Congestion') {
            pointsSql = `
                SELECT DISTINCT ON (schoolid)
                    schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng,
                    region, division, district, totalenrolment as enrollment,
                    NULLIF(regexp_replace(congestion_2023_2024::text, '[^0-9.-]', '', 'g'), '')::numeric as metric_val,
                    NULLIF(regexp_replace(congestion_index::text, '[^0-9.-]', '', 'g'), '')::numeric as congestion_index,
                    NULLIF(regexp_replace(instructional_rooms_2023_2024::text, '[^0-9.-]', '', 'g'), '')::numeric as total_classrooms,
                    'Congestion Index' as metric_label
                FROM raw_school_unique_v2
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            `;
        } else if (type === 'Last Mile Schools') {
            pointsSql = `
                SELECT DISTINCT ON (l.school_id)
                    l.school_id as id, l.school_name as name, l.municipality as mun, 
                    b.latitude as lat, b.longitude as lng,
                    b.region, b.division, b.district,
                    NULLIF(regexp_replace(l.estimated_cl_shortage::text, '[^0-9.-]', '', 'g'), '')::numeric as metric_val,
                    NULLIF(regexp_replace(l.estimated_cl_shortage::text, '[^0-9.-]', '', 'g'), '')::numeric as shortage,
                    l.total_enrollment as enrollment,
                    l.instructional_rooms as inventory,
                    l.buildable_space,
                    'LMS' as metric_label
                FROM efd_lms l
                INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text
                WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL AND l.lms = '1'
            `;
            customSummary = { regLMS: 0, divLMS: 0 };
            if (region) {
                summarySqls.push({
                    sql: `SELECT COUNT(*) as total FROM efd_lms l INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text WHERE (b.region = $1 OR b.old_region = $1) AND l.lms = '1'`,
                    params: [region],
                    process: (r) => { if (r.length > 0) customSummary.regLMS = r[0].total || 0; }
                });
                if (division) {
                    summarySqls.push({
                        sql: `SELECT COUNT(*) as total FROM efd_lms l INNER JOIN raw_school_unique_v2 b ON l.school_id::text = b.schoolid::text WHERE (b.region = $1 OR b.old_region = $1) AND b.division = $2 AND l.lms = '1'`,
                        params: [region, division],
                        process: (r) => { if (r.length > 0) customSummary.divLMS = r[0].total || 0; }
                    });
                }
            }
        }

        // Apply Common Geographic Filters for points
        if (type !== 'Classrooms' && type !== 'Last Mile Schools' && type !== 'Industries (SHS)') {
            if (region) {
                pointsParams.push(region);
                pointsSql += ` AND (region = $${offset() - 1} OR old_region = $${offset() - 1})`;
            }
            if (division) {
                pointsParams.push(division);
                pointsSql += ` AND division = $${offset() - 1}`;
            }
            if (district && type !== 'Facilities') {
                pointsParams.push(district);
                pointsSql += ` AND legislative_district = $${offset() - 1}`;
            }
        } else if (type === 'Industries (SHS)') {
            // Fix ambiguity for Industries tab (use r. alias)
            if (region) {
                pointsParams.push(region);
                pointsSql += ` AND (r.region = $${offset() - 1} OR r.old_region = $${offset() - 1})`;
            }
            if (division) {
                pointsParams.push(division);
                pointsSql += ` AND r.division = $${offset() - 1}`;
            }
            if (district) {
                pointsParams.push(district);
                pointsSql += ` AND r.legislative_district = $${offset() - 1}`;
            }
        } else {
            // Classrooms and LMS use aliases
            if (region) {
                pointsParams.push(region);
                pointsSql += ` AND (b.region = $${offset() - 1} OR b.old_region = $${offset() - 1})`;
            }
            if (division) {
                pointsParams.push(division);
                pointsSql += ` AND b.division = $${offset() - 1}`;
            }
        }

        // Execute Points Query
        const [pointsResult, industryResult, ...summaryResults] = await Promise.all([
            pool.query(pointsSql, pointsParams),
            industryPointsSql ? pool.query(industryPointsSql, industryPointsParams) : Promise.resolve({ rows: [] }),
            ...summarySqls.map(s => pool.query(s.sql, s.params))
        ]);

        // Process Summaries
        summarySqls.forEach((s, idx) => {
            if (s.process) s.process(summaryResults[idx].rows);
        });

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: pointsResult.rowCount,
                points: pointsResult.rows,
                industryPoints: industryResult.rows,
                summary: customSummary
            }
        });

    } catch (error) {
        console.error("Resource Mapping API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
