"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Search, Database, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DataExplorerTab({ filters, isMobile }) {
    const [data, setData] = useState({ rows: [], totalMatched: 0, loading: true });
    const [columnFilters, setColumnFilters] = useState({});
    const { role } = useAuth();

    // Client-side filtering logic
    const filteredResults = useMemo(() => {
        if (!data.rows) return [];
        return data.rows.filter(row => {
            return Object.entries(columnFilters).every(([colId, filterValue]) => {
                if (!filterValue) return true;
                const cellValue = String(row[colId] || "").toLowerCase();
                return cellValue.includes(filterValue.toLowerCase());
            });
        });
    }, [data.rows, columnFilters]);

    const domainColumnMap = {
        'School Info': [
            { id: 'school_size_typology', label: 'School Size Typology' },
            { id: 'curricular_offering', label: 'Offerings' }
        ],
        'Teaching Data': [
            { id: 'totalteachers', label: 'Total Teachers' },
            { id: 'total_excess', label: 'Teacher Excess' },
            { id: 'total_shortage', label: 'Teacher Shortage' }
        ],
        'Non-Teaching': [
            { id: 'outlier_status', label: 'COS' },
            { id: 'clustering_status', label: 'AOII Clustering Status' }
        ],
        'Enrolment': [
            { id: 'totalenrolment', label: 'Total Enrolment' },
            { id: 'kinder', label: 'Kinder' },
            { id: 'g1', label: 'Grade 1' },
            { id: 'g2', label: 'Grade 2' },
            { id: 'g3', label: 'Grade 3' },
            { id: 'g4', label: 'Grade 4' },
            { id: 'g5', label: 'Grade 5' },
            { id: 'g6', label: 'Grade 6' },
            { id: 'g7', label: 'Grade 7' },
            { id: 'g8', label: 'Grade 8' },
            { id: 'g9', label: 'Grade 9' },
            { id: 'g10', label: 'Grade 10' },
            { id: 'g11', label: 'Grade 11' },
            { id: 'g12', label: 'Grade 12' }
        ],
        'Specialization': [
            { id: 'english', label: 'English' },
            { id: 'mathematics', label: 'Mathematics' },
            { id: 'science', label: 'Science' },
            { id: 'biological_sciences', label: 'Biological Sciences' },
            { id: 'physical_sciences', label: 'Physical Sciences' },
            { id: 'general_ed', label: 'General Ed' },
            { id: 'araling_panlipunan', label: 'Araling Panlipunan' },
            { id: 'tle', label: 'TLE' },
            { id: 'mapeh', label: 'MAPEH' },
            { id: 'filipino', label: 'Filipino' },
            { id: 'esp', label: 'ESP' },
            { id: 'agriculture', label: 'Agriculture' },
            { id: 'ece', label: 'ECE' },
            { id: 'sped', label: 'SPED' }
        ],
        'Infrastructure': [
            { id: 'instructional_rooms_2023_2024', label: 'Classrooms' },
            { id: 'classroom_requirement', label: 'Classroom Req' },
            { id: 'classroom_shortage', label: 'Classroom Shortage' },
            { id: 'buildings', label: 'Buildings' },
            { id: 'buidable_space', label: 'Buildable Space' },
            { id: 'major_repair_2023_2024', label: 'Major Repairs' },
            { id: 'total_seats_2023_2024', label: 'Seats' },
            { id: 'total_seats_shortage_2023_2024', label: 'Seats Shortage' },
            { id: 'ownershiptype', label: 'Ownership' },
            { id: 'electricitysource', label: 'Electricity' },
            { id: 'watersource', label: 'Water' },
            { id: 'infra_projects', label: 'Projects' },
            { id: 'total_infra_value', label: 'Budget', format: (val) => `₱${Number(val).toLocaleString()}` }
        ]
    };

    const downloadCSV = () => {
        if (!filteredResults.length) return;
        const headers = ['region', 'division', 'district', 'schoolid', 'schoolname', ...Object.keys(filters.data_explorer_selections || {}).flatMap(domain => (filters.data_explorer_selections[domain] || []).filter(id => id !== 'schoolid' && id !== 'schoolname'))];
        const csvContent = [
            headers.join(','),
            ...filteredResults.map(row => headers.map(h => `"${row[h] || 0}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `STRIDE_Export_${filters.region || 'National'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        setData(prev => ({ ...prev, loading: true }));
        const fetchUrl = new URL(window.location.origin + "/stride-api/data-explorer");
        fetchUrl.searchParams.append("region", filters.region || 'All Regions');
        fetchUrl.searchParams.append("q", filters.q || '');
        // Limit removed as per user request

        const delayDebounce = setTimeout(() => {
            fetch(fetchUrl)
                .then(res => res.json())
                .then(res => {
                    if (res.status === "success") {
                        setData({ ...res.data, loading: false });
                    } else {
                        console.error("Data Explorer API Error:", res.message);
                        setData(prev => ({ ...prev, loading: false }));
                    }
                })
                .catch(err => {
                    console.error("Data Explorer Sync Failed:", err);
                    setData(prev => ({ ...prev, loading: false }));
                });
        }, 600);

        return () => clearTimeout(delayDebounce);
    }, [filters.global_trigger, filters.region, filters.q, JSON.stringify(filters.explorer_divisions)]);

    // Helper to render filter header
    const renderHeader = (label, id) => (
        <div className="flex flex-col gap-1.5 py-2 w-full">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">{label}</span>
            <input
                type="text"
                placeholder="Search..."
                className="w-full px-2 py-1 text-[10px] font-medium border border-white/20 rounded focus:outline-none focus:border-blue-300 text-gray-800 bg-white/90"
                onClick={(e) => e.stopPropagation()}
                value={columnFilters[id] || ''}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, [id]: e.target.value }))}
            />
        </div>
    );

    // Construct Dynamic Columns
    const anchorColumns = [
        {
            name: renderHeader('Region', 'region'),
            selector: row => row.region,
            sortable: true,
            width: isMobile ? '100px' : '130px'
        },
        (!isMobile && {
            name: renderHeader('Division', 'division'),
            selector: row => row.division,
            sortable: true,
            width: '160px'
        }),
        (!isMobile && {
            name: renderHeader('District', 'district'),
            selector: row => row.district,
            sortable: true,
            width: '160px'
        }),
        {
            name: renderHeader('School ID', 'schoolid'),
            selector: row => row.schoolid,
            sortable: true,
            width: isMobile ? '100px' : '130px'
        },
        {
            name: renderHeader('School Name', 'schoolname'),
            selector: row => row.schoolname,
            sortable: true,
            minWidth: isMobile ? '200px' : '280px',
            grow: 1
        }
    ].filter(Boolean);

    const dynamicColumns = [];
    Object.keys(filters.data_explorer_selections || {}).forEach(domain => {
        const selectedCols = filters.data_explorer_selections[domain] || [];
        if (selectedCols.length > 0 && domainColumnMap[domain]) {
            domainColumnMap[domain].forEach(col => {
                if (selectedCols.includes(col.id)) {
                    dynamicColumns.push({
                        name: renderHeader(col.label, col.id),
                        selector: row => row[col.id],
                        sortable: true,
                        minWidth: '150px',
                        cell: row => (
                            <span className={domain === 'Infrastructure' ? 'font-bold text-[#CE1126]' : ''}>
                                {col.format ? col.format(row[col.id]) : (row[col.id] || 0).toLocaleString()}
                            </span>
                        )
                    });
                }
            });
        }
    });

    const finalColumns = [...anchorColumns, ...dynamicColumns];

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header Area */}
            <div className="p-4 md:p-6 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-[#003366] mb-1 flex items-center gap-2">
                                <Database size={20} className="text-[#FFB81C]" />
                                Information Database
                            </h2>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest leading-none">STRIDE Unified Master Record • authenticated</p>
                        </div>
                        <div className="w-fit px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-100 flex items-center gap-1.5 uppercase tracking-tighter shadow-sm">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Ready • Jan 2026 Batch
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="text-xs md:text-sm font-bold text-[#003366] whitespace-nowrap">
                            {filteredResults.length.toLocaleString()} Schools Visible
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={downloadCSV}
                                disabled={role === 'guest'}
                                title={role === 'guest' ? "Downloads are disabled for Guest accounts" : "Download CSV Document"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all font-bold shadow-md ${role === 'guest' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#003366] text-white hover:bg-[#002244]'}`}
                            >
                                <Download size={12} /> CSV
                            </button>
                            <button
                                onClick={() => window.print()}
                                disabled={role === 'guest'}
                                title={role === 'guest' ? "Printing is disabled for Guest accounts" : "Print Data Explorer view"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-all font-bold ${role === 'guest' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white hover:shadow-md'}`}
                            >
                                <Download size={12} /> PRINT
                            </button>
                            {['Excel', 'PDF'].map(type => (
                                <button key={type} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs hover:bg-white hover:shadow-md transition-all font-bold opacity-50 cursor-not-allowed" title="Coming Soon">
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area with Fixed Column Logic */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full flex flex-col min-w-full">
                    <DataTable
                        columns={finalColumns}
                        data={filteredResults}
                        pagination
                        paginationPerPage={20}
                        progressPending={data.loading}
                        progressComponent={<div className="p-20 font-black text-[#003366] animate-pulse uppercase tracking-[0.3em]">Querying Master Database...</div>}
                        fixedHeader
                        fixedHeaderScrollHeight="100%"
                        highlightOnHover
                        responsive
                        persistTableHead
                        customStyles={{
                            header: { style: { minHeight: '0px' } },
                            headRow: {
                                style: {
                                    backgroundColor: '#003366',
                                    color: 'white',
                                    fontWeight: 'black',
                                    textTransform: 'uppercase',
                                    fontSize: '11px',
                                    letterSpacing: '0.05em',
                                    borderTopLeftRadius: '16px',
                                    borderTopRightRadius: '16px',
                                    minHeight: '80px'
                                },
                            },
                            headCells: {
                                style: {
                                    paddingLeft: '12px',
                                    paddingRight: '12px',
                                    '&:nth-child(1)': !isMobile ? { position: 'sticky', left: 0, backgroundColor: '#003366', zIndex: 10 } : {},
                                    '&:nth-child(2)': !isMobile ? { position: 'sticky', left: '130px', backgroundColor: '#003366', zIndex: 10 } : {},
                                    '&:nth-child(3)': !isMobile ? { position: 'sticky', left: '290px', backgroundColor: '#003366', zIndex: 10 } : {},
                                    '&:nth-child(4)': !isMobile ? { position: 'sticky', left: '450px', backgroundColor: '#003366', zIndex: 10 } : {},
                                    '&:nth-child(5)': !isMobile ? { position: 'sticky', left: '580px', backgroundColor: '#003366', zIndex: 10, borderRight: '2px solid rgba(255,255,255,0.1)' } : {},
                                }
                            },
                            cells: {
                                style: {
                                    '&:nth-child(1)': !isMobile ? { position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 9, borderRight: '1px solid #e2e8f0' } : {},
                                    '&:nth-child(2)': !isMobile ? { position: 'sticky', left: '130px', backgroundColor: '#fff', zIndex: 9, borderRight: '1px solid #e2e8f0' } : {},
                                    '&:nth-child(3)': !isMobile ? { position: 'sticky', left: '290px', backgroundColor: '#fff', zIndex: 9, borderRight: '1px solid #e2e8f0' } : {},
                                    '&:nth-child(4)': !isMobile ? { position: 'sticky', left: '450px', backgroundColor: '#fff', zIndex: 9, borderRight: '1px solid #e2e8f0' } : {},
                                    '&:nth-child(5)': !isMobile ? { position: 'sticky', left: '580px', backgroundColor: '#fff', zIndex: 9, borderRight: '2px solid #e2e8f0', fontWeight: 'bold' } : {},
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
