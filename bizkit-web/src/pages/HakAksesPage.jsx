import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HakAksesPage = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/api/roles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoles(); }, []);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8081/api/roles/${deleteTarget}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRoles();
        } catch (err) {
            console.error("Failed to delete role", err);
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredRoles = roles.filter(r =>
        (r.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 min-h-[500px]">

                {/* Search */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center text-sm font-medium text-gray-700 mr-2">Search:</div>
                    <div className="flex items-center border border-gray-300 rounded px-3 py-1 bg-white">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="outline-none text-sm w-48 bg-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-[#f9fafb] text-gray-600 font-bold border-y border-gray-200">
                            <th className="px-4 py-3 w-16 text-center border-r border-gray-200">
                                <div className="flex items-center justify-between">
                                    No
                                    <span className="ml-1 text-[10px] text-gray-400 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 border-r border-gray-200">
                                <div className="flex items-center justify-between">
                                    Role
                                    <span className="ml-1 text-[10px] text-gray-400 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 w-40 text-center">
                                <div className="flex items-center justify-between">
                                    Aksi
                                    <span className="ml-1 text-[10px] text-gray-400 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-bizkit-green"></div>
                                </td>
                            </tr>
                        ) : filteredRoles.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-gray-500 border-b border-gray-200">Tidak ada data role.</td>
                            </tr>
                        ) : (
                            filteredRoles.map((role, idx) => (
                                <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-center border-r border-gray-100">{idx + 1}</td>
                                    <td className="px-4 py-3 border-r border-gray-100">{role.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => navigate(`/pengaturan/hak-akses/form/${role.id}`)}
                                                className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded "
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(role.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded "
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                    <div>Showing 1 to {filteredRoles.length} of {filteredRoles.length} entries</div>
                    <div className="flex space-x-1">
                        <button className="px-3 py-1 border border-gray-300 rounded text-gray-400 cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1 bg-blue-500 text-white rounded">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-gray-400 cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>

            {/* FAB Add Button */}
            <button
                onClick={() => navigate('/pengaturan/hak-akses/form')}
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#1a8a6a] hover:bg-[#15755a] text-white shadow-lg flex items-center justify-center text-3xl font-light transition-colors z-50"
            >
                +
            </button>

            {/* Custom Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between bg-red-600 text-white px-5 py-3 rounded-t-lg">
                            <h3 className="text-sm font-bold">Konfirmasi Hapus</h3>
                            <button onClick={() => setDeleteTarget(null)} className="text-white hover:opacity-80 text-lg leading-none">&times;</button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            </div>
                            <p className="text-sm font-bold text-gray-800">Apakah Anda yakin ingin menghapus role ini?</p>
                            <p className="text-xs text-gray-400 mt-1">Data tidak dapat dikembalikan.</p>
                        </div>
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

export default HakAksesPage;
