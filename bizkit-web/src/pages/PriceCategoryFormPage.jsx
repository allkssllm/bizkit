import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const PriceCategoryFormPage = () => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get('/master/price-categories');
            const cat = response.data.data.find(c => c.id === parseInt(id));
            if (cat) {
                setName(cat.name);
            }
        } catch (error) {
            console.error('Failed to fetch price category:', error);
            setErrorModal({ isOpen: true, message: 'Gagal mengambil data kategori harga.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorModal({ isOpen: true, message: 'Nama Kategori Harga Tambahan wajib diisi' });
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/master/price-categories/${id}`, { name });
            } else {
                await api.post('/master/price-categories', { name });
            }
            navigate('/price-categories');
        } catch (error) {
            console.error('Failed to save price category:', error);
            setErrorModal({ isOpen: true, message: `Gagal menyimpan kategori harga: ${error.response?.data?.error || error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6">
                <div className="bg-white border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
                    <div className="p-8 flex-1">
                        <form id="price-category-form" onSubmit={handleSubmit} className="space-y-6 max-w-full">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Nama Kategori Harga Tambahan</label>
                                <input
                                    type="text"
                                    value={name}
                                    placeholder="Harga Grab, Harga A, Harga B"
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                    required
                                />
                            </div>
                        </form>
                    </div>

                    <div className="bg-gray-100 px-8 py-4 border-t border-gray-200">
                        <button
                            type="submit"
                            form="price-category-form"
                            disabled={loading}
                            className={`w-full py-2 px-4 font-bold text-white shadow-sm transition-colors rounded-full
                                ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#374151] hover:bg-gray-900'}
                            `}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Popup Custom Modal */}
            {errorModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black opacity-40 transition-opacity" onClick={() => setErrorModal({ isOpen: false, message: '' })}></div>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full z-10 overflow-hidden transform transition-all">
                        <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">Peringatan</h3>
                            <button onClick={() => setErrorModal({ isOpen: false, message: '' })} className="text-white hover:text-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="px-6 py-6 text-center">
                            <svg className="mx-auto mb-4 text-red-500 w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <p className="text-md text-gray-700 font-medium">{errorModal.message}</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-center rounded-b-lg border-t border-gray-100">
                            <button
                                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                                className="px-6 py-2 text-sm font-bold text-white bg-red-600 border border-transparent shadow-sm hover:bg-red-700 focus:outline-none"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceCategoryFormPage;
