import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const BrandFormPage = () => {
    const [name, setName] = useState('');
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchBrand();
        }
    }, [id]);

    const fetchBrand = async () => {
        try {
            // Note: Currently we don't have a single GET endpoint for brand, 
            // so we fetch all and find it. A dedicated endpoint is better.
            const response = await api.get('/master/brands');
            const brand = response.data.data.find(b => b.id === parseInt(id));
            if (brand) {
                setName(brand.name);
            }
        } catch (error) {
            console.error('Failed to fetch brand:', error);
            alert('Gagal mengambil data merek');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Nama merek harus diisi');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/master/brands/${id}`, { name });
            } else {
                await api.post('/master/brands', { name });
            }
            navigate('/brands');
        } catch (error) {
            console.error('Error saving brand:', error);
            alert(`Gagal menyimpan merek: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Toolbar Title (usually handled by Layout, but let's assume it handles "Tambah Merek") */}

            <div className="flex-1 p-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Produk Brand Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter Name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green transition-shadow"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Upload Brand Logo
                                </label>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1 rounded text-gray-800 cursor-pointer">
                                        Choose File
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => setLogo(e.target.files[0])}
                                        />
                                    </label>
                                    <span className="text-gray-500">
                                        {logo ? logo.name : "No file chosen"}
                                    </span>
                                </div>
                            </div>

                        </form>
                    </div>

                    <div className="bg-gray-100 px-6 py-4 rounded-b-lg border-t border-gray-200">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded font-bold text-white shadow-sm transition-colors
                                ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#374151] hover:bg-gray-900'}
                            `}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-3 px-6 text-sm text-gray-500 flex justify-between mt-auto">
                <div>Copyright © 2014-2026 AINDO. All rights reserved.</div>
                <div>BizKit</div>
            </footer>
        </div>
    );
};

export default BrandFormPage;
