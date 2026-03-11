import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';

const PaymentMethodFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [form, setForm] = useState({
        name: '',
        show_in_purchase: true,
        show_in_sales: true,
        outlet_id: '',
    });
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Fetch outlets
        axios.get('https://bizkit-api.onrender.com/api/outlets', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setOutlets(res.data.data || []))
            .catch(() => { });

        if (isEdit) {
            axios.get('https://bizkit-api.onrender.com/api/master/payment-methods', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const methods = res.data.data || [];
                    const method = methods.find(m => String(m.id) === String(id));
                    if (method) {
                        setForm({
                            name: method.name || '',
                            show_in_purchase: method.show_in_purchase,
                            show_in_sales: method.show_in_sales,
                            outlet_id: method.outlet_id || '',
                        });
                    }
                })
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: form.name,
                show_in_purchase: form.show_in_purchase,
                show_in_sales: form.show_in_sales,
                outlet_id: parseInt(form.outlet_id) || 0,
            };

            if (isEdit) {
                await axios.put(`https://bizkit-api.onrender.com/api/master/payment-methods/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('https://bizkit-api.onrender.com/api/master/payment-methods', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setModal({
                isOpen: true,
                title: 'Berhasil',
                message: `Metode pembayaran berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`,
                type: 'success',
                onConfirm: () => navigate('/pengaturan/metode-pembayaran'),
                showConfirmOnly: true
            });
        } catch (err) {
            console.error("Failed to save payment method", err);
            setModal({
                isOpen: true,
                title: 'Gagal',
                message: 'Gagal menyimpan metode pembayaran.',
                type: 'error',
                showConfirmOnly: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 flex-1 h-full">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                {/* {isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'} */}
            </h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Nama Metode Bayar */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Nama Metode Bayar</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter Name"
                            required
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                        />
                    </div>

                    {/* Tampil di pembelian? */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider">Tampil di pembelian?</label>
                        <label className="flex items-center space-x-3 cursor-pointer group w-fit">
                            <input
                                type="checkbox"
                                name="show_in_purchase"
                                checked={form.show_in_purchase}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                            <span className="text-sm text-blue-600 font-bold group-hover:text-blue-700 transition-colors">Ya</span>
                        </label>
                    </div>

                    {/* Tampil di penjualan? */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider">Tampil di penjualan?</label>
                        <label className="flex items-center space-x-3 cursor-pointer group w-fit">
                            <input
                                type="checkbox"
                                name="show_in_sales"
                                checked={form.show_in_sales}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                            <span className="text-sm text-blue-600 font-bold group-hover:text-blue-700 transition-colors">Ya</span>
                        </label>
                    </div>

                    {/* Outlet */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-800">Outlet</label>
                        <div className="space-y-2 pl-1">
                            {outlets.map(o => (
                                <label key={o.id} className="flex items-center space-x-3 cursor-pointer group w-fit">
                                    <input
                                        type="checkbox"
                                        name="outlet_id"
                                        value={o.id}
                                        checked={String(form.outlet_id) === String(o.id)}
                                        onChange={(e) => {
                                            const id = e.target.checked ? e.target.value : '';
                                            setForm(prev => ({ ...prev, outlet_id: id }));
                                        }}
                                        className="form-checkbox h-5 w-5 text-gray-600 border-gray-300 rounded focus:ring-gray-400 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{o.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#334155] hover:bg-[#1e293b] text-white py-3.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>

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

export default PaymentMethodFormPage;
