import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const schoolId = searchParams.get('schoolId');

        if (!schoolId) {
            return new NextResponse("School ID is required", { status: 400 });
        }

        const schoolRes = await pool.query('SELECT * FROM dim_schools WHERE schoolid = $1', [schoolId]);

        if (schoolRes.rowCount === 0) {
            return new NextResponse("School not found", { status: 404 });
        }

        const p = schoolRes.rows[0];

        const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Profile: ${p.schoolname}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; background: #f8fafc; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05 बेटी); }
        .header { background: #003366; color: white; padding: 24px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; }
        .header p { margin: 0; color: #FFB81C; font-weight: bold; font-size: 14px; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fff; }
        .card-header { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; letter-spacing: 0.5px; }
        .data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
        .data-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 13px; }
        .value { font-weight: bold; color: #0f172a; text-align: right; }
        .sub-value { font-size: 11px; color: #94a3b8; display: block; font-weight: normal; }
        .section-title { font-size: 16px; font-weight: bold; color: #003366; margin: 32px 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${p.schoolname}</h1>
            <p>ID: ${p.schoolid} • ${p.municipality}, ${p.region}</p>
        </div>

        <div class="section-title">I. Identity & Geography</div>
        <div class="grid">
            <div class="card">
                <div class="card-header">Identity</div>
                <div class="data-row"><span class="label">School Head</span><span class="value">${p.school_head_name || 'Unspecified'}<span class="sub-value">${p.sh_position || ''}</span></span></div>
                <div class="data-row"><span class="label">Curricular Offering</span><span class="value">${p.curricular_offering || '-'}</span></div>
                <div class="data-row"><span class="label">Sector/Type</span><span class="value">${p.sector || 'Public'} - ${p.school_type || 'General'}</span></div>
                <div class="data-row"><span class="label">LMS School</span><span class="value">${p.lms_school == 1 ? 'YES' : 'NO'}</span></div>
            </div>
            <div class="card">
                <div class="card-header">Geography</div>
                <div class="data-row"><span class="label">Region</span><span class="value">${p.region}</span></div>
                <div class="data-row"><span class="label">Division</span><span class="value">${p.division}</span></div>
                <div class="data-row"><span class="label">District/Municipality</span><span class="value">${p.legislative_district || '-'} / ${p.municipality}</span></div>
                <div class="data-row"><span class="label">Barangay</span><span class="value">${p.barangay || '-'}</span></div>
            </div>
        </div>

        <div class="section-title">II. Student Population</div>
        <div class="grid">
            <div class="card">
                <div class="card-header">Elementary Enrollment</div>
                <div class="data-row"><span class="label">Kinder</span><span class="value">${Number(p.kinder || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Grades 1-3</span><span class="value">${(Number(p.g1 || 0) + Number(p.g2 || 0) + Number(p.g3 || 0)).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Grades 4-6</span><span class="value">${(Number(p.g4 || 0) + Number(p.g5 || 0) + Number(p.g6 || 0)).toLocaleString()}</span></div>
            </div>
            <div class="card">
                <div class="card-header">Secondary Enrollment</div>
                <div class="data-row"><span class="label">JHS (7-10)</span><span class="value">${(Number(p.g7 || 0) + Number(p.g8 || 0) + Number(p.g9 || 0) + Number(p.g10 || 0)).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">SHS (11-12)</span><span class="value">${(Number(p.g11 || 0) + Number(p.g12 || 0)).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Total Enrollment</span><span class="value">${Number(p.totalenrolment || 0).toLocaleString()}</span></div>
            </div>
        </div>

        <div class="section-title">III. Human Resources</div>
        <div class="grid">
            <div class="card">
                <div class="card-header">Teacher Inventory</div>
                <div class="data-row"><span class="label">Elem Teachers</span><span class="value">${Number(p.es_teachers || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">JHS Teachers</span><span class="value">${Number(p.jhs_teachers || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">SHS Teachers</span><span class="value">${Number(p.shs_teachers || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Total Shortage</span><span class="value" style="color: #dc2626;">${Number(p.total_shortage || 0).toLocaleString()}</span></div>
            </div>
            <div class="card">
                <div class="card-header">Admin & Non-Teaching</div>
                <div class="data-row"><span class="label">Clustering Status</span><span class="value">${p.clustering_status || 'Independent'}</span></div>
                <div class="data-row"><span class="label">PDO-I Deployment</span><span class="value">${p.pdoi_deployment || 'Pending'}</span></div>
                <div class="data-row"><span class="label">Outlier Status</span><span class="value">${p.outlier_status || 'Normal'}</span></div>
            </div>
        </div>

        <div class="section-title">IV. Physical Facilities</div>
        <div class="grid">
            <div class="card">
                <div class="card-header">Rooms & Buildings</div>
                <div class="data-row"><span class="label">Good Buildings</span><span class="value">${Number(p.building_count_good_condition || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Good Rooms</span><span class="value">${Number(p.number_of_rooms_good_condition || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Needs Major Repair</span><span class="value">${Number(p.building_count_needs_major_repair || 0).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Room Shortage</span><span class="value" style="color: #dc2626;">${Number(p.classroom_shortage || 0).toLocaleString()}</span></div>
            </div>
            <div class="card">
                <div class="card-header">Utilities</div>
                <div class="data-row"><span class="label">Electricity Source</span><span class="value">${p.electricitysource || 'Grid'}</span></div>
                <div class="data-row"><span class="label">Water Source</span><span class="value">${p.watersource || 'Local'}</span></div>
                <div class="data-row"><span class="label">Shifting Schedule</span><span class="value">${p.shifting || 'No'}</span></div>
                <div class="data-row"><span class="label">Buildable Space</span><span class="value">${p.with_buildable_space || 'No'}</span></div>
            </div>
        </div>

        <div class="footer">
            Generated by STRIDE Information Database • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>
</body>
</html>
        `;

        const cleanName = (p.schoolname || 'School').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `STRIDE_Profile_${cleanName}_${new Date().toISOString().split('T')[0]}.html`;

        return new NextResponse(htmlTemplate.trim(), {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Export profile failed:", error);
        return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
    }
}
