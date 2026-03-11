import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

const TrendReportPage = () => {
    const [tab, setTab] = useState('product'); // 'product' or 'category'
    const [itemsList, setItemsList] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());

    const [statBy, setStatBy] = useState('qty'); // 'qty', 'nota', 'omzet'
    const [showStatDropdown, setShowStatDropdown] = useState(false);
    const statDropdownRef = useRef(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch products or categories when tab changes
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token');
                const endpoint = tab === 'product' ? '/api/master/products' : '/api/master/categories';
                const response = await axios.get(`https://bizkit-api.onrender.com${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setItemsList(response.data.data || []);
                setSelectedItem(''); // reset selection
                setData(null); // clear old data
            } catch (err) {
                console.error("Failed to fetch items", err);
            }
        };
        fetchItems();
    }, [tab]);

    // Fetch report data when selectedItem, year, or tab changes
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedItem) {
                setData(null);
                return;
            }
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('https://bizkit-api.onrender.com/api/reports/trend', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        type: tab,
                        item_id: selectedItem,
                        year: year,
                        stat_by: statBy // NOTE: backend doesn't fully respect stat_by yet, returns qty in GetTrendReport.
                        // For a perfect KasirKuliner clone, we'll use the API response as is, which we programmed to return Qty basically.
                    }
                });
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch trend report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedItem, year, tab, statBy]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statDropdownRef.current && !statDropdownRef.current.contains(event.target)) {
                setShowStatDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrevYear = () => setYear(y => y - 1);
    const handleNextYear = () => setYear(y => y + 1);

    const StatRow = ({ label, value }) => (
        <div className="flex justify-between py-2.5 px-4 bg-white border-b border-gray-100 text-sm">
            <span className="font-semibold text-gray-700">{label}</span>
            <span className="text-gray-900">{value}</span>
        </div>
    );

    const handleExportPDF = () => {
        if (!data || !data.details) return;
        const doc = new jsPDF();
        const itemTypeLabel = tab === 'product' ? 'Produk' : 'Kategori';
        const itemName = itemsList.find(i => String(i.id) === String(selectedItem))?.name || 'Item';

        doc.text(`Trend Penjualan Per ${itemTypeLabel} - ${itemName}`, 14, 15);
        doc.text(`Tahun: ${year}`, 14, 22);

        const tableColumn = ["No", "Minggu", "N", "Q", "Omzet"];
        const tableRows = [];

        data.details.forEach(row => {
            const tableData = [
                row.no,
                row.minggu,
                row.n,
                row.qty,
                formatRupiah(row.omzet)
            ];
            tableRows.push(tableData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [209, 213, 219], textColor: 0, fontStyle: 'bold' } // #d1d5db
        });

        doc.save(`Trend_Penjualan_${itemName}_${year}.pdf`);
    };

    const handleExportExcel = async () => {
        if (!data || !data.details) return;
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        const orderRows = data.details.map(row => ({
            'No': row.no,
            'Minggu': row.minggu,
            'N': row.n,
            'Q': row.qty,
            'Omzet': row.omzet
        }));

        const ws = XLSX.utils.json_to_sheet(orderRows);
        XLSX.utils.book_append_sheet(wb, ws, 'Trend');

        const itemName = itemsList.find(i => String(i.id) === String(selectedItem))?.name || 'Item';
        XLSX.writeFile(wb, `Trend_Penjualan_${itemName}_${year}.xlsx`);
    };

    return (
        <div className="p-6">
            {/* Top Navigation Tabs */}
            <div className="flex justify-center border-b border-gray-300 mb-6">
                <button
                    onClick={() => setTab('product')}
                    className={`px-8 py-3 text-sm font-semibold border-b-2 bg-white ${tab === 'product' ? 'border-bizkit-green text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Per Produk
                </button>
                <button
                    onClick={() => setTab('category')}
                    className={`px-8 py-3 text-sm font-semibold border-b-2 bg-white ${tab === 'category' ? 'border-bizkit-green text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Per Kategori
                </button>
            </div>

            {/* Selector & Export */}
            <div className="flex justify-between items-end mb-6">
                <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                        Pilih {tab === 'product' ? 'Produk' : 'Kategori'}:
                    </label>
                    <div className="relative">
                        <select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-bizkit-green sm:text-sm appearance-none"
                        >
                            <option value="">[{tab === 'product' ? 'Produk' : 'Produk Kategori'}]</option>
                            {itemsList.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <span className="text-[10px]">▼</span>
                        </div>
                    </div>
                </div>

                {selectedItem && (
                    <div className="flex space-x-2 items-center mr-2">
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
                )}
            </div>

            {/* Empty State */}
            {!selectedItem && (
                <div className="py-20 text-center text-gray-400 italic">
                    {/* Content is empty until selection */}
                </div>
            )}

            {/* Data View */}
            {selectedItem && loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bizkit-green"></div>
                </div>
            )}

            {selectedItem && !loading && (
                <>
                    {/* Date Navigator */}
                    <div className="bg-white px-4 py-3 shadow-sm border border-gray-200 rounded flex justify-between items-center mb-6">
                        <button onClick={handlePrevYear} className="p-1 hover:bg-gray-100 rounded text-blue-700 text-lg font-bold">«</button>
                        <span className="font-bold text-[#111827] text-sm">{year}</span>
                        <button onClick={handleNextYear} className="p-1 hover:bg-gray-100 rounded text-blue-700 text-lg font-bold">»</button>
                    </div>

                    {/* Statistik Toggle (Dropdown) */}
                    <div className="flex justify-center mb-6">
                        <div className="relative" ref={statDropdownRef}>
                            <button
                                onClick={() => setShowStatDropdown(!showStatDropdown)}
                                className="bg-[#465caa] hover:bg-[#3b4c8f] text-white text-sm px-5 py-2.5 rounded shadow flex items-center space-x-2 transition-colors"
                            >
                                <span>Statistik berdasarkan {statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'}</span>
                                <span className="text-[10px] ml-2">▼</span>
                            </button>
                            {showStatDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-full overflow-hidden">
                                    <button
                                        onClick={() => { setStatBy('qty'); setShowStatDropdown(false); }}
                                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        Statistik berdasarkan Qty
                                    </button>
                                    <button
                                        onClick={() => { setStatBy('nota'); setShowStatDropdown(false); }}
                                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        Statistik berdasarkan Nota
                                    </button>
                                    <button
                                        onClick={() => { setStatBy('omzet'); setShowStatDropdown(false); }}
                                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Statistik berdasarkan Omzet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts */}
                    {data?.chart_data && (
                        <>
                            {/* Total Qty Per Minggu */}
                            <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden rounded shrink-0">
                                <div className="bg-[#d1d5db] text-gray-800 px-4 py-2 text-center text-xs font-bold border-b border-gray-400">
                                    Total Qty Per Minggu
                                </div>
                                <div className="p-4" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.chart_data.weekly} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="label" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                            <Tooltip formatter={(value) => value} />
                                            <Line type="linear" dataKey="value" stroke="#9ca3af" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Analisis Perhari */}
                            <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden rounded shrink-0">
                                <div className="bg-[#d1d5db] text-gray-800 px-4 py-2 text-center text-xs font-bold border-b border-gray-400">
                                    Analisis Perhari - Rata-rata Qty
                                </div>
                                <div className="p-4" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.chart_data.daily_avg} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="label" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                            <Tooltip formatter={(value) => value} />
                                            <Bar dataKey="value" fill="#9ca3af" barSize={30}>
                                                {/* Recharts automatically renders labels on top if configured, but inline label render requires custom func. We keep it simple. */}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Analisis Perjam */}
                            <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden rounded shrink-0">
                                <div className="bg-[#d1d5db] text-gray-800 px-4 py-2 text-center text-xs font-bold border-b border-gray-400">
                                    Analisis Perjam - Rata-rata Qty
                                </div>
                                <div className="p-4" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.chart_data.hourly_avg} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="label" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                            <Tooltip formatter={(value) => value} />
                                            <Bar dataKey="value" fill="#9ca3af" barSize={10} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Detail Table */}
                    <div className="mb-6">
                        <h3 className="text-gray-600 text-sm mb-1">Detail</h3>
                        <div className="bg-white shadow-sm border border-gray-200 rounded mb-6 overflow-hidden shrink-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#d1d5db] text-gray-800 text-xs font-bold border-b border-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 w-16 border-r border-gray-400">
                                            <div className="flex items-center justify-between">
                                                <span>No.</span>
                                                <span className="text-[9px] text-gray-600">▲</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 border-r border-gray-400">
                                            <div className="flex items-center justify-between">
                                                <span>Minggu</span>
                                                <span className="text-gray-400 text-[9px]">♦</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-right">N</th>
                                        <th className="px-4 py-3 text-right">Q</th>
                                        <th className="px-4 py-3 text-right">Omzet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.details || []).map((row, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f5f7]'}>
                                            <td className="px-4 py-3">{row.no}</td>
                                            <td className="px-4 py-3">{row.minggu}</td>
                                            <td className="px-4 py-3 text-right">{row.n}</td>
                                            <td className="px-4 py-3 text-right">{row.qty}</td>
                                            <td className="px-4 py-3 text-right">{formatRupiah(row.omzet)}</td>
                                        </tr>
                                    ))}
                                    {/* Total */}
                                    <tr className="bg-[#f3f4f6] font-bold border-t border-gray-300">
                                        <td colSpan={2} className="px-4 py-3 text-center">Total</td>
                                        <td className="px-4 py-3 text-right">{data?.summary?.total_n || 0}</td>
                                        <td className="px-4 py-3 text-right">{data?.summary?.total_q || 0}</td>
                                        <td className="px-4 py-3 text-right">{formatRupiah(data?.summary?.total_omzet || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Averages Table */}
                    {data?.summary && (
                        <div className="bg-white mb-6 overflow-hidden rounded">
                            <div className="bg-[#cbd5e1] text-[#111827] px-4 py-3 text-center text-sm font-bold border-b border-gray-200">
                                1 Januari {year} - 31 Desember {year}
                            </div>
                            <div className="divide-y divide-gray-100 border border-gray-200 rounded-b shadow-sm">
                                <StatRow label="Rata-rata Nota" value={data.summary.avg_nota?.toFixed(2)?.replace('.', ',')} />
                                <StatRow label="Rata-rata Qty" value={data.summary.avg_qty?.toFixed(2)?.replace('.', ',')} />
                                <StatRow label="Rata-rata Omzet" value={`Rp ${formatRupiah(data.summary.avg_omzet)}`} />
                                <StatRow label="Rata-rata Qty/Nota" value={data.summary.avg_qty_per_nota?.toFixed(2)?.replace('.', ',')} />
                                <StatRow label="Rata-rata Omzet/Nota" value={`Rp ${formatRupiah(data.summary.avg_omzet_per_nota)}`} />
                                <StatRow label="Rata-rata Omzet/Qty" value={`Rp ${formatRupiah(data.summary.avg_omzet_per_qty)}`} />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TrendReportPage;
