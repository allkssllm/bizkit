import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PengaturanUmumPage = () => {
    const [logoFile, setLogoFile] = useState(null);
    const [currentLogo, setCurrentLogo] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('http://localhost:8081/api/settings', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const data = res.data.data;
                if (data?.logo) {
                    setCurrentLogo(data.logo);
                }
            })
            .catch(() => { });
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!logoFile) {
            setMessage('Pilih file logo terlebih dahulu.');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('logo', logoFile);

            const response = await axios.post('http://localhost:8081/api/settings', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setCurrentLogo(response.data.data?.logo || '');
            setMessage('Pengaturan berhasil disimpan!');
            setLogoFile(null);
        } catch (err) {
            console.error("Failed to save settings", err);
            setMessage('Gagal menyimpan pengaturan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Logo */}
                    <div className="flex items-center">
                        <label className="text-sm font-bold text-red-600 w-32 flex-shrink-0">Logo</label>
                        <div className="flex-1 flex items-center space-x-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
                            />
                            {currentLogo && (
                                <img
                                    src={`http://localhost:8081${currentLogo}`}
                                    alt="Current Logo"
                                    className="w-16 h-16 object-contain border border-gray-200 rounded p-1"
                                />
                            )}
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <p className={`text-sm ${message.includes('berhasil') ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </p>
                    )}

                    {/* Submit Button */}
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

export default PengaturanUmumPage;
