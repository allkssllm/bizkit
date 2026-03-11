import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDateLabel(date) {
    const d = new Date(date);
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const d = new Date(timeStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const AbsensiReportPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/api/attendances', {
                headers: { Authorization: `Bearer ${token}` },
                params: { date: currentDate }
            });
            setData(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch attendance data", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    const navigateDate = (direction) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + direction);
        setCurrentDate(d.toISOString().split('T')[0]);
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 flex flex-col min-h-[500px]">

                {/* Date Navigator */}
                <div className="flex items-center justify-center mb-6 select-none">
                    <button
                        onClick={() => navigateDate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="mx-6 text-sm font-bold text-gray-800 min-w-[180px] text-center">
                        {formatDateLabel(currentDate)}
                    </span>
                    <button
                        onClick={() => navigateDate(1)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Attendance List */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bizkit-green"></div>
                        </div>
                    ) : data.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada data absensi.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.map((item, idx) => (
                                <div key={idx} className="flex items-center border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    {/* Photo */}
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mr-4">
                                        {item.photo ? (
                                            <img src={item.photo} alt="foto" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{item.user?.name || 'Unknown'}</p>
                                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center">
                                                <svg className="w-3.5 h-3.5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                Masuk: <span className="font-semibold ml-0.5">{formatTime(item.check_in_time)}</span>
                                            </span>
                                            <span className="flex items-center">
                                                <svg className="w-3.5 h-3.5 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                Keluar: <span className="font-semibold ml-0.5">{formatTime(item.check_out_time)}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AbsensiReportPage;
