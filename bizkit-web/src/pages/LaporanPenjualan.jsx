import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    DocumentTextIcon,
    TableCellsIcon,
    ChevronDownIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Period options
const PERIODS = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'yearly', label: 'Tahunan' },
];

const PERIOD_TITLES = {
    daily: 'Laporan Penjualan Harian',
    weekly: 'Laporan Penjualan Mingguan',
    monthly: 'Laporan Penjualan Bulanan',
    yearly: 'Laporan Penjualan Tahunan',
};

const formatRupiah = (num) => {
    if (num == null) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
};

const LaporanPenjualan = ({ onTitleChange }) => {
    const [period, setPeriod] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statBy, setStatBy] = useState('qty'); // 'qty', 'nota', 'omzet'
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
    const [showStatDropdown, setShowStatDropdown] = useState(false);
    const [yearlyDetail, setYearlyDetail] = useState('monthly'); // 'monthly' or 'weekly'
    const dropdownRef = useRef(null);
    const statDropdownRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowPeriodDropdown(false);
            }
            if (statDropdownRef.current && !statDropdownRef.current.contains(e.target)) {
                setShowStatDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/sales', {
                params: { period, date, stat_by: statBy }
            });
            setData(res.data);
            if (onTitleChange) {
                onTitleChange(PERIOD_TITLES[period]);
            }
        } catch (err) {
            console.error('Failed to load report:', err);
        } finally {
            setLoading(false);
        }
    }, [period, date, statBy, onTitleChange]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Update the layout title when period changes
    useEffect(() => {
        if (onTitleChange) {
            onTitleChange(PERIOD_TITLES[period]);
        }
    }, [period, onTitleChange]);

    // Date navigation
    const navigateDate = (direction) => {
        const d = new Date(date);
        switch (period) {
            case 'daily':
                d.setDate(d.getDate() + direction);
                break;
            case 'weekly':
                d.setDate(d.getDate() + (direction * 7));
                break;
            case 'monthly':
                d.setMonth(d.getMonth() + direction);
                break;
            case 'yearly':
                d.setFullYear(d.getFullYear() + direction);
                break;
        }
        setDate(d.toISOString().split('T')[0]);
    };

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        setShowPeriodDropdown(false);
    };

    // Export PDF
    const handleExportPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        await import('jspdf-autotable');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(PERIOD_TITLES[period], 14, 20);
        doc.setFontSize(10);
        doc.text(data?.period_label || '', 14, 28);

        // Main table
        if (data?.orders?.length > 0) {
            const headers = period === 'daily'
                ? [['No', 'Waktu', 'Cust', 'Bayar', 'Q', 'Total']]
                : [['No', 'Hari', 'Tgl', 'N', 'Q', 'Omzet']];
            const rows = data.orders.map(o => period === 'daily'
                ? [o.no, o.waktu, o.customer_name || '-', o.payment || '-', o.qty, formatRupiah(o.total)]
                : [o.no, o.hari || '-', o.tgl || '-', o.n || 0, o.qty, formatRupiah(o.total || o.omzet)]
            );
            doc.autoTable({ head: headers, body: rows, startY: 35 });
        }

        doc.save(`${PERIOD_TITLES[period]}.pdf`);
    };

    // Export Excel
    const handleExportExcel = async () => {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        // Orders sheet
        const orderRows = (data?.orders || []).map(o => ({
            'No': o.no,
            'Waktu': o.waktu,
            'Customer': o.customer_name || '-',
            'Bayar': o.payment || '-',
            'Qty': o.qty,
            'Total': o.total
        }));
        const ws = XLSX.utils.json_to_sheet(orderRows);
        XLSX.utils.book_append_sheet(wb, ws, 'Penjualan');

        // Products sheet
        const prodRows = (data?.products || []).map((p, i) => ({
            'No': i + 1,
            'Produk': p.name,
            'Qty': p.qty,
            'Omzet': p.omzet
        }));
        const ws2 = XLSX.utils.json_to_sheet(prodRows);
        XLSX.utils.book_append_sheet(wb, ws2, 'Produk');

        XLSX.writeFile(wb, `${PERIOD_TITLES[period]}.xlsx`);
    };

    const currentPeriodLabel = PERIODS.find(p => p.value === period)?.label || 'Harian';

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            {/* Top Controls */}
            <div className="flex justify-between items-center mb-6">
                {/* Period Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                        className="flex items-center space-x-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-transparent py-2"
                    >
                        <CalendarIcon className="w-5 h-5 text-gray-600" />
                        <span>{currentPeriodLabel}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-600 ml-1" />
                    </button>
                    {showPeriodDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48">
                            {PERIODS.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => handlePeriodChange(p.value)}
                                    className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${period === p.value ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-700'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Export Buttons */}
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
            </div>

            {/* Date Navigator */}
            <div className="bg-white rounded mb-6 flex items-center justify-between px-6 py-2">
                <button onClick={() => navigateDate(-1)} className="text-[#3b4c8f] hover:text-[#2c3970] font-bold text-lg p-2">
                    «
                </button>
                <span className="font-bold text-sm text-[#000000] text-center flex-1 tracking-wide">
                    {data?.period_label || '...'}
                </span>
                <button onClick={() => navigateDate(1)} className="text-[#3b4c8f] hover:text-[#2c3970] font-bold text-lg p-2">
                    »
                </button>
            </div>

            {/* Yearly Detail Toggle */}
            {period === 'yearly' && (
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setYearlyDetail('monthly')}
                        className={`px-4 py-2 text-sm rounded-full border transition-colors ${yearlyDetail === 'monthly'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        ● Dirinci Bulanan
                    </button>
                    <button
                        onClick={() => setYearlyDetail('weekly')}
                        className={`px-4 py-2 text-sm rounded-full border transition-colors ${yearlyDetail === 'weekly'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        ○ Dirinci Mingguan
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bizkit-green"></div>
                </div>
            ) : (
                <>
                    {/* Main Table */}
                    <MainTable period={period} orders={data?.orders || []} summary={data?.summary} />

                    {/* Summary Statistics (not for daily) */}
                    {period !== 'daily' && data?.summary && (
                        <SummaryStats summary={data.summary} dateRange={data.date_range} />
                    )}

                    {/* Metode Pembayaran */}
                    <PaymentMethodsTable methods={data?.payment_methods || []} />

                    {/* Statistik Toggle (Dropdown) */}
                    <div className="flex justify-center mb-6">
                        <div className="relative" ref={statDropdownRef}>
                            <button
                                onClick={() => setShowStatDropdown(!showStatDropdown)}
                                className="bg-[#465caa] hover:bg-[#3b4c8f] text-white text-sm px-5 py-2.5 rounded shadow flex items-center space-x-2 transition-colors"
                            >
                                <span>Statistik berdasarkan {statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
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

                    {/* Produk Table */}
                    <StatTable title="Produk" columnLabel="Produk" items={data?.products || []} statBy={statBy} />

                    {/* Paket Table */}
                    <StatTable title="Paket" columnLabel="Paket" items={[]} statBy={statBy} />

                    {/* Kategori Table */}
                    <StatTable title="Kategori" columnLabel="Kategori" items={data?.categories || []} statBy={statBy} />

                    {/* Charts */}
                    {data?.chart_data && (
                        <>
                            <ChartSection
                                title={`Total ${statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'} Per ${period === 'yearly' ? 'Bulan' : 'Tanggal'}`}
                                data={data.chart_data.per_period}
                                type={period === 'yearly' || period === 'monthly' ? 'line' : 'bar'}
                                statBy={statBy}
                            />
                            <ChartSection
                                title={`Analisis Perhari - Rata-rata ${statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'}`}
                                data={data.chart_data.per_day}
                                type="bar"
                                statBy={statBy}
                            />
                            <ChartSection
                                title={`Analisis Perjam - Rata-rata ${statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'}`}
                                data={data.chart_data.per_hour}
                                type="bar"
                                statBy={statBy}
                            />
                        </>
                    )}

                    {/* Bottom padding */}
                    <div className="h-16"></div>
                </>
            )}
        </div>
    );
};

// ===== Sub-Components =====

const MainTable = ({ period, orders, summary }) => {
    const dailyColumns = ['No.', 'Waktu', 'Cust', 'Bayar', 'Q', 'Total'];
    const otherColumns = ['No.', period === 'yearly' ? 'Bulan' : 'Hari', period === 'yearly' ? null : 'Tgl', 'N', 'Q', 'Omzet'].filter(Boolean);
    const columns = period === 'daily' ? dailyColumns : otherColumns;

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded mb-6 overflow-hidden shrink-0">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#d1d5db] text-gray-800 text-xs font-bold border-b border-gray-400">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={col} className={`px-4 py-3 ${i < columns.length - 1 ? 'border-r border-gray-400' : ''}`}>
                                <div className={`flex items-center ${['Q', 'Total', 'N', 'Omzet'].includes(col) ? 'justify-end' : 'justify-between'}`}>
                                    <span>{col}</span>
                                    {col === 'No.' && <span className="text-[9px] text-gray-600">▲</span>}
                                    {!['No.', 'Q', 'Total', 'N', 'Omzet'].includes(col) && <span className="text-gray-400 text-[9px]">♦</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {orders.length === 0 ? (
                        <tr className="bg-white">
                            <td colSpan={columns.length} style={{ color: '#6b7280' }} className="px-4 py-4 text-center italic">
                                Tidak ada data
                            </td>
                        </tr>
                    ) : (
                        orders.map((order, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f5f7]'}>
                                {period === 'daily' ? (
                                    <>
                                        <td className="px-4 py-3">{order.no}</td>
                                        <td className="px-4 py-3">{order.waktu}</td>
                                        <td className="px-4 py-3">{order.customer_name || '-'}</td>
                                        <td className="px-4 py-3">{order.payment || '-'}</td>
                                        <td className="px-4 py-3 text-right">{order.qty}</td>
                                        <td className="px-4 py-3 text-right">{formatRupiah(order.total)}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3">{order.no}</td>
                                        <td className="px-4 py-3">{order.hari || '-'}</td>
                                        {period !== 'yearly' && (
                                            <td className="px-4 py-3">{order.tgl || '-'}</td>
                                        )}
                                        <td className="px-4 py-3 text-right">{order.n || 0}</td>
                                        <td className="px-4 py-3 text-right">{order.qty || 0}</td>
                                        <td className="px-4 py-3 text-right">{formatRupiah(order.total || 0)}</td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                    {/* Total Row */}
                    <tr className="bg-[#f3f4f6] font-bold border-t border-gray-300">
                        {period === 'daily' ? (
                            <>
                                <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                                <td className="px-4 py-3 text-right">{summary?.total_qty || 0}</td>
                                <td className="px-4 py-3 text-right">{formatRupiah(summary?.total_omzet || 0)}</td>
                            </>
                        ) : (
                            <>
                                <td colSpan={period === 'yearly' ? 2 : 3} className="px-4 py-3 text-right">Total</td>
                                <td className="px-4 py-3 text-right">{summary?.total_nota || 0}</td>
                                <td className="px-4 py-3 text-right">{summary?.total_qty || 0}</td>
                                <td className="px-4 py-3 text-right">{formatRupiah(summary?.total_omzet || 0)}</td>
                            </>
                        )}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const SummaryStats = ({ summary, dateRange }) => {
    const startLabel = dateRange?.start ? formatLongDate(dateRange.start) : '';
    const endLabel = dateRange?.end ? formatLongDate(dateRange.end) : '';

    return (
        <div className="bg-white mb-6 overflow-hidden rounded">
            <div className="bg-white px-4 py-3 text-center text-sm font-bold text-[#000000] border-b border-gray-200">
                {startLabel} - {endLabel}
            </div>
            <div className="divide-y divide-gray-100">
                <StatRow label="Rata-rata Nota" value={summary.avg_nota?.toFixed(2)} />
                <StatRow label="Rata-rata Qty" value={summary.avg_qty?.toFixed(2)} />
                <StatRow label="Rata-rata Omzet" value={`Rp ${formatRupiah(summary.avg_omzet)}`} />
                <StatRow label="Rata-rata Qty/Nota" value={summary.avg_qty_per_nota?.toFixed(2)} />
                <StatRow label="Rata-rata Omzet/Nota" value={`Rp ${formatRupiah(summary.avg_omzet_per_nota)}`} />
                <StatRow label="Rata-rata Omzet/Qty" value={`Rp ${formatRupiah(summary.avg_omzet_per_qty)}`} />
            </div>
        </div>
    );
};

const StatRow = ({ label, value }) => (
    <div className="flex justify-between px-4 py-2.5 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-800 font-medium">{value}</span>
    </div>
);

const PaymentMethodsTable = ({ methods }) => (
    <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden rounded shrink-0">
        <div className="bg-[#d1d5db] text-gray-800 px-4 py-2 text-center text-xs font-bold border-b border-gray-400">
            Metode Pembayaran
        </div>
        <table className="w-full text-sm text-left">
            <tbody>
                {methods.length === 0 ? (
                    <tr className="bg-white border-b border-gray-200">
                        <td className="px-4 py-3 flex text-gray-700 justify-between">
                            <span>Total Penjualan</span>
                            <span>0</span>
                        </td>
                    </tr>
                ) : (
                    methods.map((m, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${m.name === 'Total Penjualan' ? 'bg-gray-100 font-bold border-t border-gray-300' : 'bg-white'}`}>
                            <td className="px-4 py-3 flex text-gray-700 justify-between">
                                <span>{m.name}</span>
                                <span>{m.name === 'Total Penjualan' ? formatRupiah(m.total) : formatRupiah(m.total)}</span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const StatTable = ({ title, columnLabel, items, statBy }) => {
    const totalQty = items?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || 0;
    const totalOmzet = items?.reduce((sum, item) => sum + (Number(item.omzet) || 0), 0) || 0;
    const maxValue = Math.max(...(items?.map(i => Number(statBy === 'qty' ? i.qty : statBy === 'nota' ? i.nota : i.omzet)) || [0]));

    return (
        <div className="mb-6">
            <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#d1d5db] text-gray-800 text-xs font-bold border-b border-gray-400">
                        <tr>
                            <th className="px-4 py-2 w-16 border-r border-gray-400">No</th>
                            <th className="px-4 py-2 border-r border-gray-400">{columnLabel}</th>
                            <th className="px-4 py-2 text-center w-32">
                                {statBy === 'qty' ? 'Qty' : statBy === 'nota' ? 'Nota' : 'Omzet'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr className="bg-white">
                                <td colSpan={3} style={{ color: '#6b7280' }} className="px-4 py-4 text-center italic">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f5f7]'}>
                                    <td className="px-4 py-2">{idx + 1}</td>
                                    <td className="px-4 py-2">{item.name}</td>
                                    <td className="px-4 py-2 text-center font-medium">
                                        {statBy === 'qty' ? item.qty : statBy === 'nota' ? item.nota : formatRupiah(item.omzet)}
                                    </td>
                                </tr>
                            ))
                        )}
                        <tr className="bg-[#f4f5f7] font-bold border-t border-gray-200">
                            <td colSpan={2} className="px-4 py-3 text-center">Total</td>
                            <td className="px-4 py-3 text-center">
                                {statBy === 'qty' ? totalQty : statBy === 'nota' ? '-' : formatRupiah(totalOmzet)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ChartSection = ({ title, data, type, statBy }) => {
    if (!data || data.length === 0) return null;

    const tooltipFormatter = (value) => statBy === 'omzet' ? `Rp ${formatRupiah(value)}` : value;

    return (
        <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden rounded">
            <div className="bg-[#d1d5db] text-gray-800 px-4 py-2 text-center text-xs font-bold border-b border-gray-400">
                {title}
            </div>
            <div className="p-4" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    {type === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} dy={10} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={val => statBy === 'omzet' && val > 1000 ? `${val / 1000}k` : val} />
                            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="value" stroke="#9ca3af" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#4f46e5' }} />
                        </LineChart>
                    ) : (
                        <BarChart data={data} barSize={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} angle={0} axisLine={{ stroke: '#9ca3af' }} tickLine={{ stroke: '#9ca3af' }} dy={10} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={val => statBy === 'omzet' && val > 1000 ? `${val / 1000}k` : val} />
                            <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="value" fill="#9ca3af" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Helper functions
const getDayName = (dateStr) => {
    if (!dateStr) return '-';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()];
};

const formatShortDate = (dateStr) => {
    if (!dateStr) return '-';
    // dateStr format strictly "DD/MM/YYYY" from backend
    if (dateStr.includes('/')) return dateStr;
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatLongDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default LaporanPenjualan;
