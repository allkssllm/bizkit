import React, { useState, useEffect } from 'react';
import axios from 'axios';

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

const ShiftReportPage = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/api/shifts', {
                headers: { Authorization: `Bearer ${token}` },
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch shift data", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApply = () => {
        fetchData();
    };

    // Calculate running saldo from the data
    const computedData = React.useMemo(() => {
        let runningBalance = 0;
        // Data comes desc from API, reverse for running balance calculation, then reverse back
        const reversed = [...data].reverse();
        const withBalance = reversed.map((item) => {
            const selisih = (item.amount_in || 0) - (item.amount_out || 0);
            runningBalance += selisih;
            return { ...item, selisih, running_balance: runningBalance };
        });
        return withBalance.reverse();
    }, [data]);

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 flex flex-col min-h-[500px]">

                {/* Top Controls - Period Filter */}
                <div className="flex items-center space-x-3 mb-6">
                    <div className="flex items-center px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 bg-gray-50 flex-shrink-0">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="font-bold">Periode</span>
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-32"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-32"
                    />
                    <button
                        onClick={handleApply}
                        className="bg-[#4b5563] hover:bg-[#374151] text-white px-6 py-2 rounded text-sm font-semibold whitespace-nowrap"
                    >
                        Ganti
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-[#2d6b4a] text-white text-xs font-bold">
                                <th className="px-3 py-2.5">Waktu</th>
                                <th className="px-3 py-2.5">Uraian</th>
                                <th className="px-3 py-2.5">Jenis</th>
                                <th className="px-3 py-2.5">Nama</th>
                                <th className="px-3 py-2.5 text-right">Masuk</th>
                                <th className="px-3 py-2.5 text-right">Keluar</th>
                                <th className="px-3 py-2.5 text-right">Selisih</th>
                                <th className="px-3 py-2.5 text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-bizkit-green"></div>
                                    </td>
                                </tr>
                            ) : computedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-4 text-center text-gray-500 border-b border-gray-100">
                                        Belum ada data
                                    </td>
                                </tr>
                            ) : (
                                computedData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-3 py-2.5">{row.description || '-'}</td>
                                        <td className="px-3 py-2.5 capitalize">{row.type || '-'}</td>
                                        <td className="px-3 py-2.5">{row.user?.name || '-'}</td>
                                        <td className="px-3 py-2.5 text-right text-green-600">{row.amount_in > 0 ? formatRupiah(row.amount_in) : '-'}</td>
                                        <td className="px-3 py-2.5 text-right text-red-600">{row.amount_out > 0 ? formatRupiah(row.amount_out) : '-'}</td>
                                        <td className={`px-3 py-2.5 text-right ${row.selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatRupiah(row.selisih)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(row.running_balance)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ShiftReportPage;
