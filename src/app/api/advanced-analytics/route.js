import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { variables, region, division, municipality } = body;

        let filterSql = 'WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (region && region !== 'All Regions') {
            filterSql += ` AND region = $${paramIndex++}`;
            params.push(region);
        }
        if (division) {
            filterSql += ` AND division = $${paramIndex++}`;
            params.push(division);
        }
        if (municipality) {
            filterSql += ` AND municipality = $${paramIndex++}`;
            params.push(municipality);
        }

        if (variables && variables.length > 0) {
            variables.forEach(v => {
                if (v.column) {
                    if (v.values && v.values.length > 0) {
                        // Categorical IN clause
                        const placeholders = v.values.map(() => `$${paramIndex++}`).join(',');
                        filterSql += ` AND ${v.column} IN (${placeholders})`;
                        params.push(...v.values);
                    } else if (v.min !== undefined && v.max !== undefined) {
                        // Numeric BETWEEN clause
                        filterSql += ` AND CAST(NULLIF(${v.column}::text, '') AS numeric) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
                        params.push(v.min, v.max);
                    }
                }
            });
        }

        const dataSql = `
            SELECT DISTINCT ON (schoolid) schoolid, schoolname as name, region, division, municipality, latitude as lat, longitude as lng, school_type
            FROM dim_schools
            ${filterSql}
        `;

        const countSql = `SELECT COUNT(*) as exact_count FROM (SELECT DISTINCT ON (schoolid) schoolid FROM dim_schools ${filterSql}) AS dist_count`;
        const countTotalSql = `SELECT COUNT(*) as total_count FROM (SELECT DISTINCT ON (schoolid) schoolid FROM dim_schools) AS total_count`;

        // Execute all three in parallel
        const [dataRes, countRes, totalRes] = await Promise.all([
            pool.query(dataSql, params),
            pool.query(countSql, params),
            pool.query(countTotalSql)
        ]);

        // Dynamically determine grouping column based on the active geography filters
        let groupCol = 'region';
        if (municipality) {
            groupCol = 'school_type';
        } else if (division) {
            groupCol = 'municipality';
        } else if (region && region !== 'All Regions') {
            groupCol = 'division';
        }

        const graphSql = `
            SELECT ${groupCol} as label, COUNT(*) as value
            FROM (SELECT DISTINCT ON (schoolid) * FROM dim_schools ${filterSql}) dist_schools
            GROUP BY ${groupCol}
            ORDER BY value DESC
        `;
        const graphRes = await pool.query(graphSql, params);

        const graphData = {
            title: `Matching Schools by ${groupCol.charAt(0).toUpperCase() + groupCol.slice(1)}`,
            labels: graphRes.rows.map(r => r.label),
            values: graphRes.rows.map(r => Number(r.value))
        };

        return NextResponse.json({
            status: "success",
            data: {
                rows: dataRes.rows,
                totalMatched: parseInt(countRes.rows[0].exact_count, 10),
                totalEntries: parseInt(totalRes.rows[0].total_count, 10),
                graphData: graphData
            }
        });

    } catch (error) {
        console.error("Advanced Analytics Matrix API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
