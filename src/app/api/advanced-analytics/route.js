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
            SELECT schoolid, schoolname as name, region, division, municipality, latitude as lat, longitude as lng, school_type
            FROM dim_schools
            ${filterSql}
            LIMIT 5000
        `;

        const countSql = `SELECT COUNT(*) as exact_count FROM dim_schools ${filterSql}`;

        // Execute both in parallel
        const [dataRes, countRes] = await Promise.all([
            pool.query(dataSql, params),
            pool.query(countSql, params)
        ]);

        return NextResponse.json({
            status: "success",
            data: {
                rows: dataRes.rows,
                totalMatched: parseInt(countRes.rows[0].exact_count, 10)
            }
        });

    } catch (error) {
        console.error("Advanced Analytics Matrix API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
