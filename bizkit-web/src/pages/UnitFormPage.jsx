import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const UnitFormPage = () => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchUnit();
        }
    }, [id]);

    const fetchUnit = async () => {
        try {
            // Note: Since there isn't a single GET endpoint, fetch all and find
            const response = await api.get('/master/units');
            const unit = response.data.data.find(u => u.id === parseInt(id));
            if (unit) {
                setName(unit.name);
            }
        } catch (error) {
            console.error('Failed to fetch unit:', error);
            alert('Gagal mengambil data satuan');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Nama satuan harus diisi');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/master/units/${id}`, { name });
            } else {
                await api.post('/master/units', { name });
            }
            navigate('/units');
        } catch (error) {
            console.error('Error saving unit:', error);
            alert(`Gagal menyimpan satuan: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-6">
                <div className="bg-white border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
                    <div className="p-8 flex-1">
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Unit Name
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
                        </form>
                    </div>

                    <div className="bg-gray-100 px-8 py-4 border-t border-gray-200">
                        <button
                            type="submit"
                            onClick={handleSubmit}
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
        </div>
    );
};

export default UnitFormPage;
