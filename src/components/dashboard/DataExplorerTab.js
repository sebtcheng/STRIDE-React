"use client";

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Search, Database, Download } from "lucide-react";

export default function DataExplorerTab({ filters }) {
    const [data, setData] = useState({ rows: [], totalMatched: 0, loading: true });

    const domainColumnMap = {
        'School Info': [
            { id: 'region', label: 'Region' },
            { id: 'division', label: 'Division' },
            { id: 'sector', label: 'Sector' },
            { id: 'curricular_offering', label: 'Offerings' },
            { id: 'classification', label: 'Class' }
        ],
        'Teaching Data': [
            { id: 'total_teaching', label: 'Inventory' },
            { id: 'total_shortage', label: 'Shortage' },
            { id: 'total_excess', label: 'Excess' },
            { id: 'filling_up_rate', label: 'Filling %', format: (val) => `${(Number(val) * 100).toFixed(1)}%` }
        ],
        'Non-Teaching': [
            { id: 'admin_staff', label: 'Admin' },
            { id: 'support_staff', label: 'Support' }
        ],
        'Enrolment': [
            { id: 'totalenrolment', label: 'Total' },
            { id: 'kinder_enrolment', label: 'Kinder' },
            { id: 'elem_enrolment', label: 'Elem' },
            { id: 'jhs_enrolment', label: 'JHS' },
            { id: 'shs_enrolment', label: 'SHS' }
        ],
        'Specialization': [
            { id: 'math_teachers', label: 'Math' },
            { id: 'science_teachers', label: 'Science' },
            { id: 'english_teachers', label: 'English' }
        ],
        'Infrastructure': [
            { id: 'classroom_requirement', label: 'Room Req' },
            { id: 'infra_projects', label: 'Projects' },
            { id: 'total_infra_value', label: 'Budget', format: (val) => `₱${Number(val).toLocaleString()}` }
        ]
    };

    const downloadCSV = () => {
        if (!data.rows.length) return;
        const headers = ['schoolid', 'school_name', ...Object.keys(filters.data_explorer_domains).filter(d => filters.data_explorer_domains[d]).flatMap(d => domainColumnMap[d].map(c => c.id))];
        const csvContent = [
            headers.join(','),
            ...data.rows.map(row => headers.map(h => `"${row[h] || 0}"`).join(','))
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
        const fetchUrl = new URL(window.location.origin + "/api/data-explorer");
        fetchUrl.searchParams.append("region", filters.region || 'All Regions');
        fetchUrl.searchParams.append("q", filters.q || '');
        fetchUrl.searchParams.append("limit", "1500");

        const delayDebounce = setTimeout(() => {
            fetch(fetchUrl)
                .then(res => res.json())
                .then(res => {
                    if (res.status === "success") {
                        setData({ ...res.data, loading: false });
                    }
                })
                .catch(err => {
                    console.error("Data Explorer Sync Failed:", err);
                    setData(prev => ({ ...prev, loading: false }));
                });
        }, 600);

        return () => clearTimeout(delayDebounce);
    }, [filters.global_trigger, filters.region, filters.q]);

    // Construct Dynamic Columns
    const anchorColumns = [
        {
            name: 'School ID',
            selector: row => row.schoolid,
            sortable: true,
            width: '120px',
            style: { position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, borderRight: '2px solid #e2e8f0' }
        },
        {
            name: 'School Name',
            selector: row => row.school_name,
            sortable: true,
            width: '250px',
            style: { position: 'sticky', left: '120px', backgroundColor: '#fff', zIndex: 1, borderRight: '2px solid #e2e8f0', fontWeight: 'bold' }
        }
    ];

    const dynamicColumns = [];
    Object.keys(filters.data_explorer_domains).forEach(domain => {
        if (filters.data_explorer_domains[domain]) {
            domainColumnMap[domain].forEach(col => {
                dynamicColumns.push({
                    name: col.label,
                    selector: row => row[col.id],
                    sortable: true,
                    minWidth: '140px',
                    cell: row => (
                        <span className={domain === 'Infrastructure' ? 'font-bold text-[#CE1126]' : ''}>
                            {col.format ? col.format(row[col.id]) : (row[col.id] || 0).toLocaleString()}
                        </span>
                    )
                });
            });
        }
    });

    const finalColumns = [...anchorColumns, ...dynamicColumns];

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header Area */}
            <div className="p-6 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-xl font-black text-[#003366] mb-1 flex items-center gap-2">
                                <Database size={20} className="text-[#FFB81C]" />
                                Information Database
                            </h2>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest leading-none">STRIDE Unified Master Record • authenticated</p>
                        </div>
                        <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-100 flex items-center gap-1.5 uppercase tracking-tighter shadow-sm">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Ready • Jan 2026 Batch
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white rounded-lg text-xs hover:bg-[#002244] transition-all font-bold shadow-md">
                            <Download size={12} /> CSV
                        </button>
                        {['Excel', 'PDF', 'Print'].map(type => (
                            <button key={type} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs hover:bg-white hover:shadow-md transition-all font-bold">
                                <Download size={12} /> {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Area with Fixed Column Logic */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full overflow-hidden flex flex-col">
                    <DataTable
                        columns={finalColumns}
                        data={data.rows}
                        pagination
                        paginationPerPage={20}
                        progressPending={data.loading}
                        progressComponent={<div className="p-20 font-black text-[#003366] animate-pulse uppercase tracking-[0.3em]">Querying Master Database...</div>}
                        fixedHeader
                        fixedHeaderScrollHeight="100%"
                        highlightOnHover
                        responsive
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
                                    borderTopRightRadius: '16px'
                                },
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
