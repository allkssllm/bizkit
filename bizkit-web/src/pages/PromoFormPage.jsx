import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

const PromoFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        promo_target: '',
        condition_type: '',
        min_qty: 0,
        days: {
            Minggu: true, Senin: true, Selasa: true, Rabu: true, Kamis: true, Jumat: true, Sabtu: true
        },
        start_date: '',
        end_date: '',
        voucher_type: '-- Tanpa Voucher --',
        max_usage: '',
        detail_condition: '',
        detail_promo: '',
        status: 'Aktif'
    });

    useEffect(() => {
        if (isEdit) {
            fetchPromo();
        } else {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;

            setFormData(prev => ({
                ...prev,
                start_date: formatted,
                end_date: formatted
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchPromo = async () => {
        try {
            const response = await api.get('/promotions');
            const promo = response.data.data.find(p => p.id === parseInt(id));
            if (promo) {
                let parsedDays = {};
                try {
                    const daysArr = JSON.parse(promo.days);
                    ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(d => {
                        parsedDays[d] = daysArr.includes(d);
                    });
                } catch (e) { /* default to true */ }

                setFormData({
                    name: promo.name || '',
                    type: promo.type || '',
                    promo_target: promo.promo_target || '',
                    condition_type: promo.condition_type || '',
                    min_qty: promo.min_qty || 0,
                    days: Object.keys(parsedDays).length > 0 ? parsedDays : formData.days,
                    start_date: promo.start_date ? new Date(promo.start_date).toISOString().slice(0, 16) : '',
                    end_date: promo.end_date ? new Date(promo.end_date).toISOString().slice(0, 16) : '',
                    voucher_type: promo.voucher_type || '-- Tanpa Voucher --',
                    max_usage: promo.max_usage || '',
                    detail_condition: promo.detail_condition || '',
                    detail_promo: promo.detail_promo || '',
                    status: promo.status || 'Aktif'
                });
            }
        } catch (error) {
            console.error('Failed to fetch promo:', error);
            setModal({
                isOpen: true,
                title: 'Gagal',
                message: 'Gagal mengambil data promo.',
                type: 'error',
                showConfirmOnly: true
            });
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [day]: !prev.days[day]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            setModal({ isOpen: true, title: 'Validasi', message: 'Nama promo wajib diisi', type: 'error', showConfirmOnly: true });
            return;
        }

        setLoading(true);
        const activeDays = Object.keys(formData.days).filter(day => formData.days[day]);
        const formatDateTime = (dt) => dt.replace('T', ' ');

        const payload = {
            name: formData.name,
            type: formData.type,
            promo_target: formData.promo_target,
            condition_type: formData.condition_type,
            min_qty: parseInt(formData.min_qty) || 0,
            days: JSON.stringify(activeDays),
            start_date: formatDateTime(formData.start_date),
            end_date: formatDateTime(formData.end_date),
            voucher_type: formData.voucher_type,
            max_usage: parseInt(formData.max_usage) || 0,
            detail_condition: formData.detail_condition,
            detail_promo: formData.detail_promo,
            status: formData.status
        };

        try {
            if (isEdit) {
                await api.put(`/promotions/${id}`, payload);
            } else {
                await api.post('/promotions', payload);
            }
            setModal({
                isOpen: true,
                title: 'Berhasil',
                message: `Promo & Voucher berhasil ${isEdit ? 'diperbarui' : 'disimpan'}.`,
                type: 'success',
                onConfirm: () => navigate('/promo-voucher'),
                showConfirmOnly: true
            });
        } catch (error) {
            console.error('Failed to save promo:', error);
            setModal({
                isOpen: true,
                title: 'Gagal',
                message: `Gagal menyimpan: ${error.response?.data?.error || error.message}`,
                type: 'error',
                showConfirmOnly: true
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-500">Memuat data promo...</div>;

    return (
        <div className="p-6 bg-gray-50 flex-1 h-full overflow-y-auto">
            {/* <h2 className="text-xl font-bold mb-6 text-gray-800">
                {isEdit ? 'Edit Promo & Voucher' : 'Tambah Promo & Voucher'}
            </h2> */}

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
                <form id="promo-form" onSubmit={handleSubmit} className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Nama Promo</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama promo"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Jenis Promo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            >
                                <option value="">[Jenis Promo]</option>
                                <option value="Diskon Persen">Diskon Persen</option>
                                <option value="Diskon Nominal">Diskon Nominal</option>
                                <option value="Harga Khusus">Harga Khusus</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Promo Berlaku Pada</label>
                            <select
                                name="promo_target"
                                value={formData.promo_target}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            >
                                <option value="">[Ketentuan Promo]</option>
                                <option value="Semua Produk">Semua Produk</option>
                                <option value="Kategori Tertentu">Kategori Tertentu</option>
                                <option value="Produk Tertentu">Produk Tertentu</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Syarat Promo</label>
                                <select
                                    name="condition_type"
                                    value={formData.condition_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                >
                                    <option value="">[Pilih Syarat]</option>
                                    <option value="Qty Pembelian">Qty Pembelian</option>
                                    <option value="Tanpa Syarat">Tanpa Syarat</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Min Qty Produk</label>
                                <input
                                    type="number"
                                    name="min_qty"
                                    value={formData.min_qty}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-3">Hari Aktif</label>
                        <div className="flex flex-wrap gap-6 bg-gray-50 p-4 rounded border border-dashed border-gray-200">
                            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(day => (
                                <label key={day} className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.days[day]}
                                        onChange={() => handleDayToggle(day)}
                                        className="h-5 w-5 text-bizkit-green border-gray-300 rounded focus:ring-bizkit-green transition-all"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-bizkit-green font-medium transition-colors">{day}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Waktu Mulai</label>
                            <input
                                type="datetime-local"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Waktu Berakhir</label>
                            <input
                                type="datetime-local"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Voucher</h3>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Jenis Voucher</label>
                                <select
                                    name="voucher_type"
                                    value={formData.voucher_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                >
                                    <option value="-- Tanpa Voucher --">-- Tanpa Voucher --</option>
                                    <option value="Voucher Kodepromo">Voucher Kodepromo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Maks Promo Diambil/Qty Voucher</label>
                                <input
                                    type="number"
                                    name="max_usage"
                                    value={formData.max_usage}
                                    onChange={handleChange}
                                    placeholder="Biarkan kosong jika tidak ada limit"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Deskripsi Detail</h3>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Detail Ketentuan</label>
                                <textarea
                                    name="detail_condition"
                                    value={formData.detail_condition}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Contoh: Minimal belanja Rp 50.000"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Detail Promo</label>
                                <textarea
                                    name="detail_promo"
                                    value={formData.detail_promo}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Contoh: Potongan 10% hingga Rp 10.000"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center border-t border-gray-100">
                        <div className="w-1/3">
                            <label className="block text-sm font-bold text-gray-800 mb-2">Promo Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded bg-white font-medium focus:outline-none focus:ring-1 focus:ring-bizkit-green focus:border-bizkit-green"
                            >
                                <option value="Aktif">Aktif</option>
                                <option value="Upcoming">Akan Datang</option>
                                <option value="Finished">Sudah Selesai</option>
                                <option value="Inactive">Tidak Aktif</option>
                            </select>
                        </div>
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-12 py-3 bg-[#334155] hover:bg-[#1e293b] text-white rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Promo'}
                            </button>
                        </div>
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

export default PromoFormPage;
