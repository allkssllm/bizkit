import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GantiPasswordPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!form.current_password || !form.new_password || !form.confirm_password) {
            setMessage('Semua field wajib diisi.');
            setIsError(true);
            return;
        }

        if (form.new_password !== form.confirm_password) {
            setMessage('Password baru dan konfirmasi password tidak sama.');
            setIsError(true);
            return;
        }

        if (form.new_password.length < 6) {
            setMessage('Password baru minimal 6 karakter.');
            setIsError(true);
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.put(`/users/${user.id}/password`, {
                current_password: form.current_password,
                new_password: form.new_password,
            });

            setMessage('Password berhasil diubah!');
            setIsError(false);
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            const msg = err.response?.data?.error || 'Gagal mengubah password.';
            setMessage(msg);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-8 max-w-lg mx-auto">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Ganti Kata Sandi</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Password Lama */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Password Lama</label>
                        <input
                            type="password"
                            name="current_password"
                            value={form.current_password}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Password Baru */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Password Baru</label>
                        <input
                            type="password"
                            name="new_password"
                            value={form.new_password}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Konfirmasi Password Baru */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Message */}
                    {message && (
                        <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
                            {message}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded font-bold text-sm text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(to right, #1a8a6a, #17a2b8)' }}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GantiPasswordPage;
