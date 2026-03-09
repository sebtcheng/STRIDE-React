import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const schoolId = searchParams.get('schoolId');

        if (!schoolId) {
            return new NextResponse("School ID is required", { status: 400 });
        }

        const schoolRes = await pool.query('SELECT * FROM raw_school_unique_v2 WHERE schoolid::text = $1', [schoolId]);

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
    <title>${p.school_name} - School Profile</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
        }
        .header-panel {
            background-color: #003366;
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            position: relative;
        }
        .header-panel .icon-box {
            position: absolute;
            left: 25px;
            top: 25px;
            background-color: #FFB81C;
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 15px rgba(255, 184, 28, 0.4);
            color: #003366;
            font-weight: bold;
        }
        .header-content {
            margin-left: 70px;
        }
        .header-panel h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .header-panel p {
            margin: 5px 0 0 0;
            color: #bfdbfe;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .section-break {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 30px 0 20px 0;
        }
        .section-break-line {
            flex: 1;
            height: 2px;
            background-color: #e2e8f0;
            border-radius: 2px;
        }
        .section-title {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .info-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border-width: 1px;
            border-style: solid;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            break-inside: avoid;
        }
        
        /* Thematic Card Colors */
        .card-blue { border-color: #dbeafe; background-color: #eff6ff; color: #1e40af; }
        .card-green { border-color: #dcfce7; background-color: #f0fdf4; color: #166534; }
        .card-orange { border-color: #ffedd5; background-color: #fff7ed; color: #9a3412; }
        .card-purple { border-color: #f3e8ff; background-color: #faf5ff; color: #6b21a8; }
        .card-red { border-color: #fee2e2; background-color: #fef2f2; color: #991b1b; }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0;
        }
        
        .data-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 4px 0;
        }
        .data-label {
            font-size: 11px;
            font-weight: 500;
            opacity: 0.7;
        }
        .data-value-container {
            text-align: right;
        }
        .data-value {
            font-size: 13px;
            font-weight: 700;
        }
        .data-sub {
            display: block;
            font-size: 9px;
            opacity: 0.6;
            font-weight: 700;
        }
        .subtotal-row {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(0,0,0,0.1);
        }
        
        .spec-box {
            background: white;
            border: 1px solid #f1f5f9;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 1px 2px rgb(0 0 0 / 0.02);
        }
        .spec-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .spec-value {
            font-size: 18px;
            font-weight: 900;
            color: #003366;
        }

        .footer {
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
            font-weight: 600;
        }
        @media print {
            body { background: white; padding: 0; }
            .info-card { box-shadow: none; }
            .header-panel { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="header-panel">
        <div class="icon-box">🏛️</div>
        <div class="header-content">
            <h1>${p.school_name}</h1>
            <p>ID: ${p.schoolid} &nbsp;&bull;&nbsp; ${p.municipality}, ${p.region}</p>
        </div>
    </div>

    <!-- SECTION A: IDENTITY & GEOGRAPHY -->
    <div class="grid" style="margin-bottom: 30px;">
        <div class="info-card card-blue">
            <div class="card-header"><span class="card-title">Identity & Leadership</span></div>
            <div class="data-item">
                <span class="data-label">School Head</span>
                <div class="data-value-container">
                    <span class="data-value">${p.school_head_name || 'Unspecified'}</span>
                    ${p.sh_position ? '<span class="data-sub">' + p.sh_position + '</span>' : ''}
                </div>
            </div>
            <div class="data-item"><span class="data-label">Curricular Offering</span><span class="data-value">${p.modified_coc || 'N/A'}</span></div>
            <div class="data-item"><span class="data-label">Sector / Type</span><span class="data-value">${p.sector || 'Public'} - ${p.school_type || 'General'}</span></div>
        </div>
        <div class="info-card card-purple">
            <div class="card-header"><span class="card-title">Geographic Coordinates</span></div>
            <div class="data-item"><span class="data-label">Region / Division</span><span class="data-value">${p.region} | ${p.division}</span></div>
            <div class="data-item"><span class="data-label">District / Mun</span><span class="data-value">${p.district || 'N/A'} | ${p.municipality}</span></div>
            <div class="data-item">
                <span class="data-label">Barangay</span>
                <div class="data-value-container">
                    <span class="data-value">${p.barangay || 'N/A'}</span>
                    <span class="data-sub">Coord: ${p.latitude || '0'}, ${p.longitude || '0'}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION B: ENROLMENT PROFILE -->
    <div class="section-break">
        <div class="section-break-line"></div>
        <span class="section-title">Student Population Dynamics</span>
        <div class="section-break-line"></div>
    </div>
    
    <div class="grid-3">
        <div class="info-card card-green">
            <div class="card-header"><span class="card-title">Elementary Breakdown</span></div>
            <div class="data-item"><span class="data-label">Kinder</span><span class="data-value">${Number(p.kinder || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 1</span><span class="data-value">${Number(p.g1 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 2</span><span class="data-value">${Number(p.g2 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 3</span><span class="data-value">${Number(p.g3 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 4</span><span class="data-value">${Number(p.g4 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 5</span><span class="data-value">${Number(p.g5 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 6</span><span class="data-value">${Number(p.g6 || 0).toLocaleString()}</span></div>
            <div class="data-item subtotal-row"><span class="data-label">Elem Subtotal</span><span class="data-value">${((Number(p.kinder) || 0) + (Number(p.g1) || 0) + (Number(p.g2) || 0) + (Number(p.g3) || 0) + (Number(p.g4) || 0) + (Number(p.g5) || 0) + (Number(p.g6) || 0)).toLocaleString()}</span></div>
        </div>
        <div class="info-card card-green">
            <div class="card-header"><span class="card-title">Secondary Population</span></div>
            <div class="data-item"><span class="data-label">Grade 7</span><span class="data-value">${Number(p.g7 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 8</span><span class="data-value">${Number(p.g8 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 9</span><span class="data-value">${Number(p.g9 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 10</span><span class="data-value">${Number(p.g10 || 0).toLocaleString()}</span></div>
            <div class="data-item subtotal-row" style="margin-bottom:8px;"><span class="data-label">JHS Subtotal</span><span class="data-value">${((Number(p.g7) || 0) + (Number(p.g8) || 0) + (Number(p.g9) || 0) + (Number(p.g10) || 0)).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 11</span><span class="data-value">${Number(p.g11 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Grade 12</span><span class="data-value">${Number(p.g12 || 0).toLocaleString()}</span></div>
            <div class="data-item subtotal-row" style="margin-bottom:8px;"><span class="data-label">SHS Subtotal</span><span class="data-value">${((Number(p.g11) || 0) + (Number(p.g12) || 0)).toLocaleString()}</span></div>
            <div class="data-item subtotal-row"><span class="data-label">Total Enrolment</span><span class="data-value">${Number(p.totalenrolment || 0).toLocaleString()}</span></div>
        </div>
        <div class="info-card card-purple">
            <div class="card-header"><span class="card-title">Ancillary Metrics</span></div>
            <div class="data-item"><span class="data-label">LMS Status</span><span class="data-value">${p.sha_2024_index ? 'YES' : 'NO'}</span></div>
            <div class="data-item"><span class="data-label">School Size</span><span class="data-value">${p.school_size_typology || 'Standard'}</span></div>
            <div class="data-item"><span class="data-label">Implementing Unit</span><span class="data-value">${p.implementing_unit == '1' ? 'Yes' : 'No'}</span></div>
        </div>
    </div>

    <!-- SECTION C: HUMAN RESOURCES -->
    <div class="section-break">
        <div class="section-break-line"></div>
        <span class="section-title">Personnel Management & Teacher Gaps</span>
        <div class="section-break-line"></div>
    </div>
    
    <div class="grid-3">
        <div class="info-card card-blue">
            <div class="card-header"><span class="card-title">Teacher Inventory (Active)</span></div>
            <div class="data-item"><span class="data-label">Elem Teachers</span><span class="data-value">${Number(p.es_teachers || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">JHS Teachers</span><span class="data-value">${Number(p.jhs_teachers || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">SHS Teachers</span><span class="data-value">${Number(p.shs_teachers || 0).toLocaleString()}</span></div>
            <div class="data-item subtotal-row"><span class="data-label">Total Teachers</span><span class="data-value">${((Number(p.es_teachers) || 0) + (Number(p.jhs_teachers) || 0) + (Number(p.shs_teachers) || 0)).toLocaleString()}</span></div>
        </div>
        <div class="info-card card-red">
            <div class="card-header"><span class="card-title">Resource Gap Analysis</span></div>
            <div class="data-item"><span class="data-label">Total Shortage</span><span class="data-value">${Number(p.total_shortage || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Total Excess</span><span class="data-value">${Number(p.total_excess || 0).toLocaleString()}</span></div>
            <div class="data-item subtotal-row"><span class="data-label">Net Requirement</span><span class="data-value">${(Number(p.total_shortage || 0) - Number(p.total_excess || 0)).toLocaleString()}</span></div>
        </div>
        <div class="info-card card-blue">
            <div class="card-header"><span class="card-title">Non-Teaching & Admin</span></div>
            <div class="data-item"><span class="data-label">Clustering Status</span><span class="data-value">${p.clustering_status || 'N/A'}</span></div>
            <div class="data-item"><span class="data-label">PDO-I Deployment</span><span class="data-value">${p.pdoi_deployment || 'None'}</span></div>
            <div class="data-item"><span class="data-label">Outlier Status</span><span class="data-value">${p.outlier_status || 'Normal'}</span></div>
        </div>
    </div>

    <!-- SECTION D: PHYSICAL FACILITIES -->
    <div class="section-break">
        <div class="section-break-line"></div>
        <span class="section-title">Physical Assets & Infrastructure</span>
        <div class="section-break-line"></div>
    </div>
    
    <div class="grid-3">
        <div class="info-card card-orange">
            <div class="card-header"><span class="card-title">Rooms & Buildings</span></div>
            <div class="data-item"><span class="data-label">Total Buildings</span><span class="data-value">${Number(p.buildings || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Total Classrooms</span><span class="data-value">${Number(p.instructional_rooms_2023_2024 || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Major Repairs</span><span class="data-value">${Number(p.major_repair_2023_2024 || 0).toLocaleString()}</span></div>
        </div>
        <div class="info-card card-orange">
            <div class="card-header"><span class="card-title">Facility Gaps</span></div>
            <div class="data-item"><span class="data-label">Classroom Requirement</span><span class="data-value">${Number(p.classroom_requirement || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Classroom Shortage</span><span class="data-value">${Number(p.est_cs || 0).toLocaleString()}</span></div>
            <div class="data-item"><span class="data-label">Buildable Space</span><span class="data-value">${p.buidable_space == '1' || p.buidable_space === 1 ? 'Yes' : 'No'}</span></div>
        </div>
        <div class="info-card card-blue">
            <div class="card-header"><span class="card-title">Utilities & Logistics</span></div>
            <div class="data-item"><span class="data-label">Electricity Source</span><span class="data-value">${p.electricitysource || 'N/A'}</span></div>
            <div class="data-item"><span class="data-label">Water Source</span><span class="data-value">${p.watersource || 'N/A'}</span></div>
            <div class="data-item"><span class="data-label">Shifting Schedule</span><span class="data-value">${p.shifting || 'N/A'}</span></div>
        </div>
    </div>

    <!-- SECTION E: SPECIALIZATION -->
    <div class="section-break">
        <div class="section-break-line"></div>
        <span class="section-title">Personnel Specialization (Secondary)</span>
        <div class="section-break-line"></div>
    </div>

    ${(p.modified_coc || '').includes('Purely ES') ?
                '<div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; font-style: italic; text-align: center;">' +
                '    ℹ️ Specialization data is not applicable for Purely Elementary schools. Personnel are deployed as General Education generalists.' +
                '</div>' :
                '<div class="grid-4">' +
                '    <div class="spec-box"><span class="spec-label">Math</span><span class="spec-value">' + Number(p.mathematics || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">Science</span><span class="spec-value">' + Number(p.science || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">English</span><span class="spec-value">' + Number(p.english || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">Filipino</span><span class="spec-value">' + Number(p.filipino || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">Araling Pan</span><span class="spec-value">' + Number(p.araling_panlipunan || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">MAPEH</span><span class="spec-value">' + Number(p.mapeh || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">TLE</span><span class="spec-value">' + Number(p.tle || 0).toLocaleString() + '</span></div>' +
                '    <div class="spec-box"><span class="spec-label">SPED</span><span class="spec-value">' + Number(p.sped || 0).toLocaleString() + '</span></div>' +
                '</div>'
            }

    <div class="footer">
        Strategic Resource Inventory for Deployment Efficiency (STRIDE) • Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
</body>
</html>
    `;


        const cleanName = (p.school_name || 'School').replace(/[^a-zA-Z0-9]/g, '_');
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
