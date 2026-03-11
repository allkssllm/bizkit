import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const VariantFormPage = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minChoice, setMinChoice] = useState(1);
    const [maxChoice, setMaxChoice] = useState(1);
    const [status, setStatus] = useState('Active');
    const [options, setOptions] = useState([
        { id: null, name: '', price_add: '' }
    ]);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchVariant();
        }
    }, [id]);

    const fetchVariant = async () => {
        try {
            // Note: Since there isn't a single GET endpoint, fetch all and find
            const response = await api.get('/master/variants');
            const variant = response.data.data.find(v => v.id === parseInt(id));
            if (variant) {
                setName(variant.name || '');
                setDescription(variant.description || '');
                setMinChoice(variant.min_choice || 0);
                setMaxChoice(variant.max_choice || 1);
                setStatus(variant.status || 'Active');
                if (variant.options && variant.options.length > 0) {
                    setOptions(variant.options.map(opt => ({
                        id: opt.id,
                        name: opt.name,
                        price_add: opt.price_add
                    })));
                }
            }
        } catch (error) {
            console.error('Failed to fetch variant:', error);
            alert('Gagal mengambil data varian');
        }
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { id: null, name: '', price_add: '' }]);
    };

    const removeOption = (index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorModal({ isOpen: true, message: 'Nama kategori varian harus diisi' });
            return;
        }

        // Validate options length
        if (options.length === 0) {
            setErrorModal({ isOpen: true, message: 'Minimal harus ada 1 varian (pilihan) didaftarkan!' });
            return;
        }

        // Filter out empty options or throw error
        const cleanOptions = options.filter(opt => opt.name.trim() !== '');
        if (cleanOptions.length === 0) {
            setErrorModal({ isOpen: true, message: 'Semua pilihan varian masih kosong!' });
            return;
        }

        setLoading(true);
        const payload = {
            name,
            description,
            min_choice: parseInt(minChoice) || 0,
            max_choice: parseInt(maxChoice) || 1,
            status,
            options: cleanOptions.map(opt => ({
                id: opt.id || undefined, // Send ID so backend doesn't recreate if we were to handle updates by ID, but wait, variant_controller replaces all options. If we want them kept, we'd need to send it. Currently controller replaces all, so we just pass name/price.
                name: opt.name,
                price_add: parseFloat(opt.price_add) || 0
            }))
        };

        try {
            if (isEdit) {
                await api.put(`/master/variants/${id}`, payload);
            } else {
                await api.post('/master/variants', payload);
            }
            navigate('/variants');
        } catch (error) {
            console.error('Error saving variant:', error);
            setErrorModal({ isOpen: true, message: `Gagal menyimpan varian: ${error.response?.data?.error || error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6 relative">
                <div className="bg-white border border-gray-200 shadow-sm flex flex-col mb-6">
                    <div className="p-8 pb-4">
                        <form id="variant-form" onSubmit={handleSubmit} className="space-y-6 max-w-full">

                            {/* General Information */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Nama Kategori Varian</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Deskripsi Kategori Varian</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Dipilih Minimal</label>
                                        <input
                                            type="number"
                                            value={minChoice}
                                            onChange={(e) => setMinChoice(e.target.value)}
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Dipilih Maksimal</label>
                                        <input
                                            type="number"
                                            value={maxChoice}
                                            onChange={(e) => setMaxChoice(e.target.value)}
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="status"
                                        type="checkbox"
                                        checked={status === 'Active'}
                                        onChange={(e) => setStatus(e.target.checked ? 'Active' : 'Inactive')}
                                        className="h-4 w-4 text-bizkit-green focus:ring-bizkit-green border-gray-300 rounded"
                                    />
                                    <label htmlFor="status" className="ml-2 block text-sm font-bold text-blue-600">
                                        Aktif
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Variant Options Box */}
                    <div className="px-8 pb-8 pt-4">
                        <div className="bg-[#eef2ff] border border-blue-100 p-6 rounded relative">
                            <h4 className="text-lg text-gray-700 font-semibold mb-4 border-b border-blue-200 pb-2">Varian</h4>

                            <div className="space-y-4">
                                {options.map((opt, index) => (
                                    <div key={index} className="relative bg-white p-4 border border-blue-100 shadow-sm">

                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="absolute -top-3 -right-3 bg-red-500 rounded-full text-white p-1 hover:bg-red-600 transition shadow"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-700 mb-1">Varian #{index + 1}</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nama Varian"
                                                    value={opt.name}
                                                    onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-700 mb-1">Harga Varian</label>
                                                <input
                                                    type="number"
                                                    placeholder="Harga Varian"
                                                    value={opt.price_add}
                                                    onChange={(e) => handleOptionChange(index, 'price_add', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="bg-[#1e3a8a] text-white p-2 rounded hover:bg-blue-900 transition shadow"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="sticky bottom-0 left-0 right-0 bg-gray-100 px-8 py-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
                    <button
                        type="submit"
                        form="variant-form"
                        disabled={loading}
                        className={`w-full py-2 px-4 font-bold text-white shadow-sm transition-colors rounded-full
                            ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#374151] hover:bg-gray-900'}
                        `}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
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

export default VariantFormPage;
