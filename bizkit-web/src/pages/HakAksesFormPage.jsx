import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';

const PERMISSION_MODULES = [
    {
        id: 'pos',
        name: '1. Kasir / POS',
        permissions: [
            { id: 'pos_access', label: 'Buka Menu POS' },
            { id: 'pos_transaction', label: 'Buat Transaksi Baru' },
            { id: 'pos_discount', label: 'Beri Diskon Manual' },
        ]
    },
    {
        id: 'laporan',
        name: '2. Laporan',
        permissions: [
            { id: 'report_sales', label: 'Lihat Laporan Penjualan' },
            { id: 'report_trend', label: 'Lihat Trend Penjualan' },
            { id: 'report_history', label: 'Lihat Riwayat Transaksi' },
            { id: 'report_shift', label: 'Lihat Laporan Shift' },
            { id: 'report_attendance', label: 'Lihat Laporan Absensi' },
        ]
    },
    {
        id: 'master',
        name: '3. Master Data Produk',
        permissions: [
            { id: 'master_product', label: 'Kelola Produk' },
            { id: 'master_category', label: 'Kelola Kategori' },
            { id: 'master_brand', label: 'Kelola Merek' },
            { id: 'master_unit', label: 'Kelola Satuan' },
            { id: 'master_variant', label: 'Kelola Varian' },
            { id: 'master_price', label: 'Kelola Kategori Harga' },
        ]
    },
    {
        id: 'promo',
        name: '4. Promo & Voucher',
        permissions: [
            { id: 'promo_access', label: 'Kelola Promo & Voucher' },
        ]
    },
    {
        id: 'pengaturan',
        name: '5. Pengaturan',
        permissions: [
            { id: 'setting_user', label: 'Kelola User (Operator)' },
            { id: 'setting_role', label: 'Kelola Hak Akses (Role)' },
            { id: 'setting_payment', label: 'Kelola Metode Pembayaran' },
            { id: 'setting_general', label: 'Pengaturan Umum' },
        ]
    }
];

const HakAksesFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    useEffect(() => {
        if (isEdit) {
            fetchRole();
        }
    }, [isEdit]);

    const fetchRole = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8081/api/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // We fetch all roles and find the match since there is no GET /roles/:id yet
            const role = response.data.data.find(r => r.id.toString() === id);
            if (role) {
                setName(role.name);
                try {
                    if (role.permissions) {
                        const permObj = JSON.parse(role.permissions);
                        if (permObj.all) {
                            // If "all" is true, check everything
                            handleSelectAll();
                        } else {
                            setPermissions(permObj);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse permissions", e);
                }
            }
        } catch (err) {
            console.error("Failed to fetch role", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (permId) => {
        setPermissions(prev => ({
            ...prev,
            [permId]: !prev[permId]
        }));
    };

    const handleSelectAll = () => {
        const allPerms = {};
        PERMISSION_MODULES.forEach(mod => {
            mod.permissions.forEach(p => {
                allPerms[p.id] = true;
            });
        });
        setPermissions(allPerms);
    };

    const handleUnselectAll = () => {
        setPermissions({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                name,
                permissions: JSON.stringify(permissions)
            };

            if (isEdit) {
                await axios.put(`http://localhost:8081/api/roles/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`http://localhost:8081/api/roles`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setModal({
                isOpen: true,
                title: 'Berhasil',
                message: `Hak akses berhasil ${isEdit ? 'diperbarui' : 'disimpan'}.`,
                type: 'success',
                onConfirm: () => navigate('/pengaturan/hak-akses'),
                showConfirmOnly: true
            });
        } catch (err) {
            console.error("Failed to save role", err.response?.data || err.message || err);
            const msg = err.response?.data?.error || err.message;
            setModal({
                isOpen: true,
                title: 'Gagal',
                message: `Gagal menyimpan role. Error: ${msg}`,
                type: 'error',
                showConfirmOnly: true
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bizkit-green"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                {isEdit ? 'Edit Hak Akses' : 'Tambah Hak Akses'}
            </h2>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">

                {/* Nama Role Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Role :</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green outline-none"
                    />
                </div>

                {/* Permissions Section */}
                <div className="mb-4 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Permissions :</label>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={handleUnselectAll}
                            className="bg-teal-400 hover:bg-teal-500 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                            Unselect All
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {PERMISSION_MODULES.map(module => (
                        <div key={module.id} className="border-b border-gray-100 pb-4">
                            <h3 className="text-md font-semibold text-gray-800 mb-3">{module.name}</h3>
                            <div className="space-y-2 pl-4">
                                {module.permissions.map(perm => (
                                    <label key={perm.id} className="flex items-center space-x-3 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                checked={!!permissions[perm.id]}
                                                onChange={() => handleCheckboxChange(perm.id)}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600">{perm.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-lg border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/pengaturan/hak-akses')}
                        className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-white font-medium shadow-sm bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded font-medium shadow-sm disabled:bg-gray-400"
                    >
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                type={modal.type}
                onConfirm={modal.onConfirm || (() => setModal({ ...modal, isOpen: false }))}
                showConfirmOnly={true}
            >
                {modal.message}
            </Modal>
        </div>
    );
};

export default HakAksesFormPage;
