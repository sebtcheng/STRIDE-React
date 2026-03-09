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
            SELECT DISTINCT ON (schoolid) *
            FROM dim_schools
            ${filterSql}
            ORDER BY schoolid ASC
        `;

        const result = await pool.query(dataSql, params);

        if (result.rowCount === 0) {
            return NextResponse.json({ status: "error", message: "No records found to export" }, { status: 404 });
        }

        // Generate CSV
        const columns = result.fields.map(field => field.name);

        // Ensure unique column headers (in case of duplicate column names from JOIN)
        const uniqueColumns = [...new Set(columns)];

        const csvRows = [uniqueColumns.join(",")];

        result.rows.forEach(row => {
            const values = uniqueColumns.map(col => {
                let val = row[col];
                if (val === null || val === undefined) {
                    return '""';
                }
                // Determine raw value type
                const strVal = String(val);
                // Safe CSV enclosure: handle quotes and carriage returns
                if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\\n')) {
                    // Double up quotes
                    return `"${strVal.replace(/"/g, '""')}"`;
                }
                return strVal;
            });
            csvRows.push(values.join(","));
        });

        const csvString = csvRows.join("\n");
        const filename = `STRIDE_AdvancedAnalytics_RawDB_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Advanced Analytics Export CSV Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
