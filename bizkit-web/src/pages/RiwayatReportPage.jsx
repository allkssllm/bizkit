import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

const RiwayatReportPage = () => {
    // Default dates (e.g., today to today)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [hasDiscount, setHasDiscount] = useState(false);

    // Data state
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ total_penjualan: 0 });
    const [loading, setLoading] = useState(false);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/history', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    has_discount: hasDiscount
                }
            });
            setData(response.data.data || []);
            setSummary(response.data.summary || { total_penjualan: 0 });
        } catch (err) {
            console.error("Failed to fetch sales history", err);
            setData([]);
            setSummary({ total_penjualan: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount, user must click 'Ganti' for subsequent updates

    const handleApply = () => {
        fetchData();
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special handling for string vs numbers
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.text(`Laporan Riwayat Penjualan`, 14, 15);
        doc.text(`Tanggal: ${startDate} s/d ${endDate}`, 14, 22);

        const tableColumn = ["No", "Tgl", "Total", "ID Penjualan", "Nama Pelanggan"];
        const tableRows = [];

        if (sortedData && sortedData.length > 0) {
            sortedData.forEach((row, idx) => {
                const tableData = [
                    idx + 1,
                    row.tgl,
                    formatRupiah(row.total),
                    row.id_penjualan,
                    row.nama_pelanggan || '-'
                ];
                tableRows.push(tableData);
            });
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [209, 213, 219], textColor: 0, fontStyle: 'bold' }
        });

        doc.save(`Riwayat_Penjualan_${startDate}_${endDate}.pdf`);
    };

    const handleExportExcel = async () => {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        let rows = [];
        if (sortedData && sortedData.length > 0) {
            rows = sortedData.map((row, idx) => ({
                'No': idx + 1,
                'Tgl': row.tgl,
                'Total': row.total,
                'ID Penjualan': row.id_penjualan,
                'Nama Pelanggan': row.nama_pelanggan || '-'
            }));
        } else {
            rows = [{
                'No': '', 'Tgl': '', 'Total': '', 'ID Penjualan': '', 'Nama Pelanggan': ''
            }];
        }

        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Riwayat');
        XLSX.writeFile(wb, `Riwayat_Penjualan_${startDate}_${endDate}.xlsx`);
    };

    const SortIcon = () => (
        <span className="ml-1 text-[10px] text-gray-400 inline-flex flex-col leading-none">
            <span>▲</span>
            <span className="-mt-1">▼</span>
        </span>
    );

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 flex flex-col min-h-[500px]">

                {/* Top Controls */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0 mb-6">
                    <div className="flex flex-col space-y-4 w-full lg:w-2/3">
                        {/* Date Filter Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 bg-gray-50">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="font-bold">Periode</span>
                            </div>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-32"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-32"
                            />
                            <button
                                onClick={handleApply}
                                className="bg-[#4b5563] hover:bg-[#374151] text-white px-6 py-2 rounded text-sm font-semibold whitespace-nowrap w-full sm:w-auto"
                            >
                                Ganti
                            </button>
                        </div>

                        {/* Checkbox */}
                        <label className="flex items-center space-x-2 cursor-pointer w-max">
                            <input
                                type="checkbox"
                                checked={hasDiscount}
                                onChange={(e) => setHasDiscount(e.target.checked)}
                                className="form-checkbox text-[#17a2b8] h-3 w-3 rounded border-gray-300"
                            />
                            <span className="text-xs font-bold text-gray-700">Tampilkan data yang ada diskon</span>
                        </label>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex space-x-2 items-center justify-end w-full lg:w-auto">
                        <button onClick={handleExportPDF} title="Download PDF" className="hover:opacity-80 transition-opacity flex flex-col items-center">
                            <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="24" height="28" rx="2" fill="#dc2626" />
                                <text x="50%" y="15" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">PDF</text>
                                <path d="M12 18V24M12 24L9 21M12 24L15 21" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
                                <path d="M7 26H17" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
                            </svg>
                        </button>
                        <button onClick={handleExportExcel} title="Download Excel" className="hover:opacity-80 transition-opacity flex flex-col items-center">
                            <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="24" height="28" rx="2" fill="#16a34a" />
                                <text x="50%" y="15" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">X</text>
                                <path d="M12 18V24M12 24L9 21M12 24L15 21" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
                                <path d="M7 26H17" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left border-t border-b border-gray-200 min-w-[700px]">
                        <thead className="text-gray-800 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-16">
                                    No
                                </th>
                                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('tgl')}>
                                    <div className="flex items-center">
                                        Tgl <SortIcon />
                                    </div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('total')}>
                                    <div className="flex items-center">
                                        Total <SortIcon />
                                    </div>
                                </th>
                                <th className="px-4 py-3">
                                    ID Penjualan
                                </th>
                                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('nama_pelanggan')}>
                                    <div className="flex items-center">
                                        Nama Pelanggan <SortIcon />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-bizkit-green"></div>
                                    </td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-gray-800 border-b border-gray-100 font-semibold">
                                        Tidak ada data
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3">{idx + 1}</td>
                                        <td className="px-4 py-3">{row.tgl}</td>
                                        <td className="px-4 py-3">{formatRupiah(row.total)}</td>
                                        <td className="px-4 py-3">{row.id_penjualan}</td>
                                        <td className="px-4 py-3">{row.nama_pelanggan || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section */}
                <div className="mt-8 text-sm text-gray-600 flex flex-col space-y-1">
                    <div>
                        Tanggal: <span className="font-semibold">{startDate.split('-').reverse().join('/')}-{endDate.split('-').reverse().join('/')}</span>
                    </div>
                    <div>
                        Total Penjualan: <span className="font-semibold">{formatRupiah(summary.total_penjualan || 0)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RiwayatReportPage;
