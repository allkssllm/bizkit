import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://bizkit-api.onrender.com/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://bizkit-api.onrender.com/api/users/${deleteTarget}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 min-h-[500px]">

                {/* Search */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center border border-gray-300 rounded-full px-4 py-1.5 bg-white">
                        <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari..."
                            className="outline-none text-sm w-40 bg-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-[#d1d5db] text-gray-800 font-bold text-xs">
                            <th className="px-4 py-2.5 w-16">No</th>
                            <th className="px-4 py-2.5">
                                <div className="flex items-center">
                                    Nama
                                    <span className="ml-1 text-[10px] text-gray-500 inline-flex flex-col leading-none">
                                        <span>▲</span><span className="-mt-1">▼</span>
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-2.5">Outlet</th>
                            <th className="px-4 py-2.5">
                                <div className="flex items-center">
                                    Peran
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
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-bizkit-green"></div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-4 text-gray-500">Tidak ada data user.</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, idx) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold">{user.name || user.username}</td>
                                    <td className="px-4 py-3">{user.outlet?.name || '-'}</td>
                                    <td className="px-4 py-3">{user.role?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            {/* View */}
                                            <button title="Lihat" className="text-gray-400 hover:text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </button>
                                            {/* Edit */}
                                            <button onClick={() => navigate(`/pengaturan/user/form/${user.id}`)} title="Edit" className="text-gray-400 hover:text-blue-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            {/* Delete */}
                                            <button onClick={() => setDeleteTarget(user.id)} title="Hapus" className="text-gray-400 hover:text-red-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* FAB Add Button */}
            <button
                onClick={() => navigate('/pengaturan/user/form')}
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

export default UserPage;
