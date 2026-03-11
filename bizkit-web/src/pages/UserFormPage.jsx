import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';

const UserFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [form, setForm] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role_id: '',
        outlet_id: '',
    });
    const [roles, setRoles] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Fetch roles
        axios.get('https://bizkit-api.onrender.com/api/roles', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setRoles(res.data.data || []))
            .catch(() => { });
        // Fetch outlets
        axios.get('https://bizkit-api.onrender.com/api/outlets', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setOutlets(res.data.data || []))
            .catch(() => { });
        // If edit, fetch user
        if (isEdit) {
            axios.get('https://bizkit-api.onrender.com/api/users', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const users = res.data.data || [];
                    const user = users.find(u => String(u.id) === String(id));
                    if (user) {
                        setForm({
                            name: user.name || '',
                            email: user.email || '',
                            username: user.username || '',
                            password: '',
                            role_id: user.role_id || '',
                            outlet_id: user.outlet_id || '',
                        });
                    }
                })
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: form.name,
                email: form.email,
                username: form.username,
                role_id: parseInt(form.role_id) || 0,
                outlet_id: parseInt(form.outlet_id) || 0,
            };
            if (form.password) {
                payload.password = form.password;
            }

            if (isEdit) {
                await axios.put(`https://bizkit-api.onrender.com/api/users/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModal({
                    isOpen: true,
                    title: 'Berhasil',
                    message: 'Data user berhasil diperbarui.',
                    type: 'success',
                    onConfirm: () => navigate('/pengaturan/user'),
                    showConfirmOnly: true
                });
            } else {
                if (!form.password) {
                    setModal({
                        isOpen: true,
                        title: 'Peringatan',
                        message: 'Password wajib diisi untuk user baru.',
                        type: 'error',
                        showConfirmOnly: true
                    });
                    setLoading(false);
                    return;
                }
                payload.password = form.password;
                await axios.post('https://bizkit-api.onrender.com/api/users', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModal({
                    isOpen: true,
                    title: 'Berhasil',
                    message: 'User baru berhasil ditambahkan.',
                    type: 'success',
                    onConfirm: () => navigate('/pengaturan/user'),
                    showConfirmOnly: true
                });
            }
        } catch (err) {
            console.error("Failed to save user", err);
            const msg = err.response?.data?.error || 'Gagal menyimpan user.';
            setModal({
                isOpen: true,
                title: 'Kesalahan',
                message: msg,
                type: 'error',
                showConfirmOnly: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Nama Lengkap Pengguna */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Nama Lengkap Pengguna</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Email Pengguna */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Email Pengguna</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Username Pengguna */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Username Pengguna</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">
                            Atur password pengguna
                            {isEdit && <span className="text-xs text-orange-500 font-normal ml-1">(biarkan kosong apabila tidak ada perubahan)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Peran */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Peran</label>
                        <select
                            name="role_id"
                            value={form.role_id}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
                        >
                            <option value="">[Peran]</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pilih Outlet */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Pilih Outlet</h3>
                        <div className="space-y-2">
                            {outlets.map(o => (
                                <label key={o.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="outlet_id"
                                        value={o.id}
                                        checked={String(form.outlet_id) === String(o.id)}
                                        onChange={handleChange}
                                        className="form-radio text-green-600 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">{o.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1a8a6a] hover:bg-[#15755a] text-white py-3 rounded font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </form>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                type={modal.type}
                onConfirm={modal.onConfirm || (() => setModal({ ...modal, isOpen: false }))}
                showConfirmOnly={modal.showConfirmOnly}
            >
                {modal.message}
            </Modal>
        </div>
    );
};

export default UserFormPage;
