import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const ProductFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // States
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [isDescriptionChecked, setIsDescriptionChecked] = useState(false);
    const [isHargaTambahanChecked, setIsHargaTambahanChecked] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Dropdowns
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [variants, setVariants] = useState([]);
    const [priceCategories, setPriceCategories] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        image: '',
        sku: '',
        name: '',
        description: '', // UI has description, but DB doesn't have it natively unless stored elsewhere (will omit for now or send as is)
        brand_id: '',
        category_id: '',
        unit_id: '',
        has_variant: false,
        variant_ids: [],
        is_favorite: false,
        price: '',
        additional_prices: {} // mapping priceCategoryId -> price
    });

    useEffect(() => {
        fetchDependencies();
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchDependencies = async () => {
        try {
            const [catRes, brandRes, unitRes, varRes, priceCatRes] = await Promise.all([
                api.get('/master/categories'),
                api.get('/master/brands'),
                api.get('/master/units'),
                api.get('/master/variants'),
                api.get('/master/price-categories')
            ]);
            setCategories(catRes.data.data || []);
            setBrands(brandRes.data.data || []);
            setUnits(unitRes.data.data || []);
            setVariants(varRes.data.data || []);
            setPriceCategories(priceCatRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch dependencies:', error);
            setErrorModal({ isOpen: true, message: 'Gagal memuat data pendukung (Kategori/Merek/dll).' });
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await api.get('/master/products');
            const product = response.data.data.find(p => p.id === parseInt(id));
            if (product) {
                setFormData({
                    image: product.image || '',
                    sku: product.sku || '',
                    name: product.name,
                    description: product.description || '',
                    brand_id: product.brand_id || '',
                    category_id: product.category_id || '',
                    unit_id: product.unit_id || '',
                    has_variant: product.has_variant || false,
                    variant_ids: product.variants ? product.variants.map(v => v.variant_id) : [],
                    is_favorite: product.is_favorite || false,
                    price: product.price || '',
                    additional_prices: {} // Not implemented in DB yet, leave empty for now
                });
                if (product.description) {
                    setIsDescriptionChecked(true);
                }
                if (product.image) {
                    setImagePreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}${product.image}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            setErrorModal({ isOpen: true, message: 'Gagal mengambil data produk.' });
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVariantToggle = (variantId) => {
        setFormData(prev => {
            const isSelected = prev.variant_ids.includes(variantId);
            if (isSelected) {
                return { ...prev, variant_ids: prev.variant_ids.filter(id => id !== variantId) };
            } else {
                return { ...prev, variant_ids: [...prev.variant_ids, variantId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validations
        if (!formData.name) return setErrorModal({ isOpen: true, message: 'Nama Produk harus diisi' });
        if (!formData.brand_id) return setErrorModal({ isOpen: true, message: 'Merek harus dipilih' });
        if (!formData.category_id) return setErrorModal({ isOpen: true, message: 'Kategori harus dipilih' });
        if (!formData.unit_id) return setErrorModal({ isOpen: true, message: 'Satuan harus dipilih' });
        if (!formData.price) return setErrorModal({ isOpen: true, message: 'Harga Jual harus diisi' });
        if (formData.has_variant && formData.variant_ids.length === 0) {
            return setErrorModal({ isOpen: true, message: 'Pilih minimal satu varian jika fitur Varian diaktifkan.' });
        }

        setLoading(true);
        try {
            const formDataPayload = new FormData();
            formDataPayload.append('name', formData.name);
            formDataPayload.append('sku', formData.sku);
            formDataPayload.append('description', isDescriptionChecked ? formData.description : '');
            formDataPayload.append('category_id', formData.category_id);
            formDataPayload.append('brand_id', formData.brand_id);
            formDataPayload.append('unit_id', formData.unit_id);
            formDataPayload.append('price', formData.price);
            formDataPayload.append('status', 'Active');
            formDataPayload.append('has_variant', formData.has_variant);
            formDataPayload.append('is_favorite', formData.is_favorite);
            
            if (selectedImage) {
                formDataPayload.append('image', selectedImage);
            }

            if (formData.has_variant) {
                formData.variant_ids.forEach(id => {
                    formDataPayload.append('variant_ids', id);
                });
            }

            if (isEdit) {
                await api.put(`/master/products/${id}`, formDataPayload);
            } else {
                await api.post('/master/products', formDataPayload);
            }
            navigate('/products');
        } catch (error) {
            console.error('Failed to save product:', error);
            setErrorModal({ isOpen: true, message: `Gagal menyimpan produk: ${error.response?.data?.error || error.message}` });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-8 text-center text-gray-500">Memuat data produk...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6">
                <div className="bg-white border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
                    <div className="p-8 flex-1">
                        <form id="product-form" onSubmit={handleSubmit} className="space-y-6 max-w-full">

                            {/* Upload Image */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Upload Gambar Produk</label>
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-400 text-xs text-center p-2">No Image</div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                </div>
                            </div>

                            {/* SKU */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Kode Produk</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    placeholder="Kode Produk"
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Nama Produk</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    placeholder="Nama Produk"
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                />
                            </div>

                            {/* Description (Checkbox dummy for layout matching KasirKuliner) */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="deskripsi-cb"
                                        checked={isDescriptionChecked}
                                        onChange={(e) => setIsDescriptionChecked(e.target.checked)}
                                        className="h-4 w-4 text-bizkit-green focus:ring-bizkit-green border-gray-300 rounded"
                                    />
                                    <label htmlFor="deskripsi-cb" className="ml-2 block text-sm font-bold text-gray-900">
                                        Deskripsi
                                    </label>
                                </div>
                                {isDescriptionChecked && (
                                    <div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Masukkan deskripsi produk..."
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                        ></textarea>
                                    </div>
                                )}
                            </div>

                            {/* Brand & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Merek</label>
                                    <select
                                        name="brand_id"
                                        value={formData.brand_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                    >
                                        <option value="" disabled>[Merek]</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Kategori</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                    >
                                        <option value="" disabled>[Kategori]</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Unit (highlighted box in KasirKuliner) */}
                            <div className="bg-[#eef2ff] p-4 rounded border border-blue-100">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Satuan Utama</label>
                                        <select
                                            name="unit_id"
                                            value={formData.unit_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                        >
                                            <option value="" disabled>[Satuan]</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Variant Checkbox */}
                            <div className="bg-[#f8fafc] p-4 rounded border border-gray-100 space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="has_variant"
                                        id="has_variant"
                                        checked={formData.has_variant}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-bizkit-green focus:ring-bizkit-green border-gray-300 rounded"
                                    />
                                    <label htmlFor="has_variant" className="ml-2 block text-sm font-bold text-gray-900">
                                        Varian
                                    </label>
                                </div>

                                {/* Show variant selection if checked */}
                                {formData.has_variant && (
                                    <div className="pl-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {variants.map(v => (
                                            <label key={v.id} className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.variant_ids.includes(v.id)}
                                                    onChange={() => handleVariantToggle(v.id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{v.name}</span>
                                            </label>
                                        ))}
                                        {variants.length === 0 && <span className="text-sm text-gray-500 italic">Belum ada varian tersedia.</span>}
                                    </div>
                                )}
                            </div>

                            {/* Tampil Penjualan Checkbox (Mock 'Semua Outlet', 'Tampil Penjualan di Bagus'in' -> is_favorite) */}
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input type="checkbox" id="semua-outlet" defaultChecked className="h-4 w-4 text-gray-400 focus:ring-gray-300 border-gray-300 rounded" />
                                    <label htmlFor="semua-outlet" className="ml-2 block text-sm text-gray-700">{user.outlet || 'dagashi'}</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_favorite"
                                        id="is_favorite"
                                        checked={formData.is_favorite}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-bizkit-green focus:ring-bizkit-green border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-700">Tampil Penjualan di Bagus'in (Set sebagai Favorit)</label>
                                </div>
                            </div>

                            {/* Base Price Panel */}
                            <div className="bg-[#eef2ff] p-4 rounded border border-blue-100">
                                <h4 className="font-bold text-sm text-gray-800 mb-4">Bahan Terkait</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Harga Jual</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center pb-2">
                                        <input
                                            type="checkbox"
                                            id="harga-tambahan"
                                            checked={isHargaTambahanChecked}
                                            onChange={(e) => setIsHargaTambahanChecked(e.target.checked)}
                                            className="h-4 w-4 text-bizkit-green focus:ring-bizkit-green border-gray-300 rounded"
                                        />
                                        <label htmlFor="harga-tambahan" className="ml-2 block text-sm text-gray-900 font-bold">Harga Tambahan</label>
                                    </div>
                                </div>
                                {isHargaTambahanChecked && (
                                    <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {priceCategories.map(cat => (
                                            <div key={cat.id} className="relative">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">{cat.name}</label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={formData.additional_prices[cat.id] || ''}
                                                        onChange={(e) => setFormData({ ...formData, additional_prices: { ...formData.additional_prices, [cat.id]: e.target.value } })}
                                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </form>
                    </div>

                    {/* Footer Action */}
                    <div className="bg-[#f1f5f9] px-8 py-4 border-t border-gray-200">
                        <button
                            type="submit"
                            form="product-form"
                            disabled={loading}
                            className={`w-full py-2.5 px-4 font-bold text-white shadow-md transition-colors rounded-lg
                                ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#1e40af] hover:bg-blue-800'}
                            `}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Custom Modal */}
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

export default ProductFormPage;
