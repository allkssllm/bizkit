import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PromoPage = () => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await api.get('/promotions');
            setPromotions(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter by status helper
    const getByStatus = (status) => promotions.filter(p => p.status === status);

    const TableModule = ({ title, data }) => (
        <div className="mb-10 last:mb-0">
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center space-x-3">
                    <div className="w-2 h-8 bg-bizkit-green rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-0.5 rounded-full text-xs font-bold border border-gray-200">
                        {data.length}
                    </span>
                </div>
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Cari promo..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bizkit-green/20 focus:border-bizkit-green w-64 transition-all"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 group-focus-within:text-bizkit-green transition-colors" />
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Tanggal Mulai</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Tanggal Berakhir</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Nama Promo</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Jenis Promo</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Promo Berlaku Pada</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Batas Penukaran</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Sisa Promo</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Hari Promo</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Detail Ketentuan</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Detail Promo</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.length > 0 ? (
                                data.map(item => {
                                    const daysArray = item.days ? JSON.parse(item.days) : [];
                                    const daysStr = daysArray.join(', ');
                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {new Date(item.start_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {new Date(item.end_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-[11px] font-bold">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.promo_target}</td>
                                            <td className="px-6 py-4 text-center font-medium">
                                                {item.max_usage > 0 ? item.max_usage : '∞'}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-bizkit-green">
                                                {item.max_usage > 0 ? item.max_usage - item.used : '∞'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="truncate max-w-[120px] inline-block text-gray-500 italic" title={daysStr}>
                                                    {daysStr || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 line-clamp-2 max-w-[150px]" title={item.detail_condition}>
                                                    {item.detail_condition || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-600 bg-orange-50/50 px-2 py-1 rounded border border-orange-100 line-clamp-2 max-w-[150px]" title={item.detail_promo}>
                                                    {item.detail_promo || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                    ${item.status === 'Aktif' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                                                            item.status === 'Inactive' ? 'bg-gray-100 text-gray-600' :
                                                                'bg-red-100 text-red-600'}
                                                `}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/promo-voucher/form/${item.id}`)}
                                                    className="inline-flex items-center space-x-1 text-bizkit-green hover:text-green-800 font-bold transition-colors"
                                                >
                                                    <span className="text-xs border-b border-bizkit-green">Atur</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="12" className="px-6 py-10 text-center text-gray-400 italic bg-gray-50/30">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg mb-1">📭</span>
                                            <span>Belum ada data promo untuk kategori ini</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-10 h-10 border-4 border-bizkit-green border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Memuat data promo...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-[#f8fafc] min-h-full pb-24">
            <div className="max-w-[1600px] mx-auto">
                <TableModule title="Promo & Voucher - Aktif" data={getByStatus('Aktif')} />
                <TableModule title="Promo & Voucher - Akan Datang" data={getByStatus('Upcoming')} />
                <TableModule title="Promo & Voucher - Sudah Selesai" data={getByStatus('Finished')} />
                <TableModule title="Promo & Voucher - Tidak Aktif" data={getByStatus('Inactive')} />
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => navigate('/promo-voucher/form')}
                className="fixed bottom-10 right-10 w-16 h-16 bg-bizkit-green hover:bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group z-40"
            >
                <PlusIcon className="w-9 h-9 transition-transform group-hover:rotate-90" />
                <div className="absolute right-20 bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    TAMBAH PROMO BARU
                </div>
            </button>
        </div>
    );
};

export default PromoPage;
