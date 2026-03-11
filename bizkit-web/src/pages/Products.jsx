import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/master/products');
            // The KasirKuliner UI groups products by Category in the list, so we'll organize them that way visually
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            alert('Gagal mengambil data produk');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await api.delete(`/master/products/${deleteModal.id}`);
            fetchProducts();
            setDeleteModal({ isOpen: false, id: null });
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert(`Gagal menghapus produk: ${error.response?.data?.error || 'Sedang digunakan'}`);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const filteredProducts = products.filter(prod =>
        prod.name.toLowerCase().includes(search.toLowerCase()) ||
        (prod.category && prod.category.name.toLowerCase().includes(search.toLowerCase()))
    );

    // Grouping by category to match KasirKuliner UI
    const groupedProducts = filteredProducts.reduce((acc, product) => {
        const catName = product.category ? product.category.name : 'Tanpa Kategori';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(product);
        return acc;
    }, {});

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0
        }).format(angka);
    };

    // Calculate absolute index across categories to mimic the continuous No column in KasirKuliner
    let globalIndex = 1;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6 relative">
                {/* Header Actions */}
                <div className="flex justify-end mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-bizkit-green focus:border-bizkit-green block w-[250px] pl-10 p-2"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y border-collapse">
                        <thead className="bg-[#cbd5e1] text-[#334155]">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold tracking-wider w-24">
                                    <div className="flex justify-between items-center">
                                        No <span className="text-[10px] text-gray-500 ml-1">▲▼</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold tracking-wider">
                                    <div className="flex justify-between items-center">
                                        Produk <span className="text-[10px] text-gray-500 ml-1">▲▼</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold tracking-wider">
                                    <div className="flex justify-between items-center">
                                        Kategori <span className="text-[10px] text-gray-500 ml-1">▲▼</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold tracking-wider">
                                    <div className="flex justify-end items-center">
                                        Harga Jual
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-bold tracking-wider w-32 border-l border-gray-300">
                                    <div className="flex justify-center items-center">
                                        Aksi
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Memuat data...</td>
                                </tr>
                            ) : Object.keys(groupedProducts).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Data belum tersedia</td>
                                </tr>
                            ) : (
                                Object.keys(groupedProducts).map((catName) => (
                                    <React.Fragment key={catName}>
                                        {/* Category Header Row */}
                                        <tr className="bg-gray-100 border-l-[6px] border-[#f59e0b]">
                                            <td colSpan="5" className="px-6 py-2 text-sm font-bold text-gray-800">
                                                Kategori : {catName}
                                            </td>
                                        </tr>
                                        {/* Products for this category */}
                                        {groupedProducts[catName].map((prod) => {
                                            const currentIndex = globalIndex++;
                                            return (
                                                <tr key={prod.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currentIndex}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prod.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prod.category ? prod.category.name : '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatRupiah(prod.price)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium border-l border-gray-200">
                                                        <button
                                                            onClick={() => navigate(`/product/form/${prod.id}`)}
                                                            className="text-[#1e3a8a] hover:text-blue-900 mr-4"
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 inline-block text-[#1e40af]">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(prod.id)}
                                                            className="hover:opacity-80 transition-opacity"
                                                            title="Hapus"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 inline-block text-[#1e40af]">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Placeholder */}
                    <div className="px-6 py-3 bg-white flex items-center justify-end border-t border-gray-200">
                        <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                            <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span>&larr;</span>
                            </button>
                            <button className="relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-500 text-sm font-medium text-white">
                                1
                            </button>
                            <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span>&rarr;</span>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Floating Add Button */}
                <button
                    onClick={() => navigate('/product/form')}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-bizkit-green hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg focus:outline-none"
                >
                    <PlusIcon className="w-8 h-8 font-light" />
                </button>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black opacity-40 transition-opacity" onClick={() => setDeleteModal({ isOpen: false, id: null })}></div>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full z-10 overflow-hidden transform transition-all">
                        <div className="bg-[#0f766e] px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">Konfirmasi Hapus</h3>
                            <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="text-white hover:text-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="px-6 py-6 text-center">
                            <svg className="mx-auto mb-4 text-red-500 w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <p className="text-md text-gray-700 font-medium">Apakah Anda yakin ingin menghapus data ini?</p>
                            <p className="text-sm text-gray-500 mt-1">Data yang dihapus tidak dapat dikembalikan.</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-center space-x-3 rounded-b-lg border-t border-gray-100">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                                className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2 text-sm font-bold text-white bg-red-600 border border-transparent shadow-sm hover:bg-red-700 focus:outline-none"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
