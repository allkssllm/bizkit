import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentMethodPage = () => {
    const navigate = useNavigate();
    const [methods, setMethods] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const perPage = 10;

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://bizkit-api.onrender.com/api/master/payment-methods', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMethods(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch payment methods", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMethods(); }, []);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://bizkit-api.onrender.com/api/master/payment-methods/${deleteTarget}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMethods();
        } catch (err) {
            console.error("Failed to delete payment method", err);
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredMethods = methods.filter(m =>
        (m.name || '').toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredMethods.length / perPage);
    const paginatedData = filteredMethods.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 min-h-[500px]">

                {/* Search - oval/pill style */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center border border-gray-300 rounded-full px-4 py-1.5 bg-white">
                        <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            placeholder="Cari..."
                            className="outline-none text-sm w-40 bg-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-[#d1d5db] text-gray-800 font-bold text-xs">
                            <th className="px-4 py-2.5 w-16">
                                <div className="flex items-center">
                                    No
                                    <span className="ml-1 text-[10px] text-gray-500 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-2.5">
                                <div className="flex items-center">
                                    Payment Method Name
                                    <span className="ml-1 text-[10px] text-gray-500 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-2.5">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-bizkit-green"></div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-gray-500">Tidak ada data.</td>
                            </tr>
                        ) : (
                            paginatedData.map((method, idx) => (
                                <tr key={method.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">{(currentPage - 1) * perPage + idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-blue-600">{method.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            {/* Edit */}
                                            <button onClick={() => navigate(`/pengaturan/metode-pembayaran/form/${method.id}`)} title="Edit" className="text-gray-400 hover:text-blue-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            {/* Delete */}
                                            <button onClick={() => setDeleteTarget(method.id)} title="Hapus" className="text-gray-400 hover:text-red-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                        <span>Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredMethods.length)} of {filteredMethods.length} entries</span>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                            >Previous</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-[#1a8a6a] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >{i + 1}</button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* FAB Add Button */}
            <button
                onClick={() => navigate('/pengaturan/metode-pembayaran/form')}
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#1a8a6a] hover:bg-[#15755a] text-white shadow-lg flex items-center justify-center text-3xl font-light transition-colors z-50"
            >
                +
            </button>

            {/* Custom Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between bg-red-600 text-white px-5 py-3 rounded-t-lg">
                            <h3 className="text-sm font-bold">Konfirmasi Hapus</h3>
                            <button onClick={() => setDeleteTarget(null)} className="text-white hover:opacity-80 text-lg leading-none">&times;</button>
                        </div>
                        {/* Body */}
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            </div>
                            <p className="text-sm font-bold text-gray-800">Apakah Anda yakin ingin menghapus data ini?</p>
                            <p className="text-xs text-gray-400 mt-1">Data yang dihapus tidak dapat dikembalikan.</p>
                        </div>
                        {/* Footer */}
                        <div className="flex justify-center space-x-3 px-6 pb-5">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-semibold"
                            >Batal</button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                            >Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodPage;
