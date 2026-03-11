import React from 'react';
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    DocumentTextIcon,
    TableCellsIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
    // Current date mock
    const currentDate = "Sen, 2 Mar 2026";

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Top Controllers */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                    <select className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer">
                        <option>Harian</option>
                        <option>Bulan</option>
                        <option>Tahun</option>
                    </select>
                </div>

                <div className="flex space-x-2">
                    <button className="p-1 hover:bg-red-100 rounded text-red-600 transition" title="Export PDF">
                        <DocumentTextIcon className="w-8 h-8" />
                    </button>
                    <button className="p-1 hover:bg-green-100 rounded text-green-600 transition" title="Export Excel">
                        <TableCellsIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Date Navigator */}
            <div className="bg-white rounded-t-md shadow-sm mb-4 border border-gray-100">
                <div className="flex items-center justify-between px-6 py-3">
                    <button className="text-blue-600 hover:text-blue-800 p-2">
                        <ChevronDoubleLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-sm text-gray-800 text-center flex-1">{currentDate}</span>
                    <button className="text-blue-600 hover:text-blue-800 p-2">
                        <ChevronDoubleRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#cbd5e1] text-gray-800 text-xs font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">No. <span className="inline-block align-middle ml-1"><ChevronUpIcon className="w-3" /></span></th>
                            <th className="px-4 py-3 border-l border-gray-300">Waktu</th>
                            <th className="px-4 py-3 border-l border-gray-300">Cust</th>
                            <th className="px-4 py-3 border-l border-gray-300">Bayar</th>
                            <th className="px-4 py-3 border-l border-gray-300 text-right">Q</th>
                            <th className="px-4 py-3 border-l border-gray-300 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white">
                            <td colSpan="6" className="px-4 py-4 text-center text-gray-500 italic">Tidak ada data</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold border-t border-gray-200">
                            <td colSpan="4" className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">0</td>
                            <td className="px-4 py-3 text-right">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Metode Pembayaran Table */}
            <div className="bg-white shadow-sm border border-gray-100 mb-8 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#cbd5e1] text-gray-800 text-xs font-bold">
                        <tr>
                            <th className="px-4 py-3 text-center">Metode Pembayaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white border-b border-gray-200">
                            <td className="px-4 py-3 flex text-gray-700 justify-between">
                                <span>Total Penjualan</span>
                                <span>0</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>


            {/* Statistik Dropdown */}
            <div className="flex justify-center mb-6">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded shadow flex items-center space-x-2">
                    <span>Statistik berdasarkan Qty</span>
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Produk Table */}
            <div className="mb-2 text-sm text-gray-600 font-medium px-1">Produk</div>
            <div className="bg-white shadow-sm border border-gray-100 mb-6 overflow-hidden rounded">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#cbd5e1] text-gray-800 text-xs font-bold">
                        <tr>
                            <th className="px-4 py-3 w-16">No</th>
                            <th className="px-4 py-3 border-l border-gray-300">Produk</th>
                            <th className="px-4 py-3 border-l border-gray-300 text-right w-24">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white">
                            <td colSpan="3" className="px-4 py-3 text-gray-500 italic">Tidak ada data</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold border-t border-gray-200">
                            <td colSpan="2" className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Paket Table */}
            <div className="mb-2 text-sm text-gray-600 font-medium px-1">Paket</div>
            <div className="bg-white shadow-sm border border-gray-100 mb-6 overflow-hidden rounded">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#cbd5e1] text-gray-800 text-xs font-bold">
                        <tr>
                            <th className="px-4 py-3 w-16">No</th>
                            <th className="px-4 py-3 border-l border-gray-300">Paket</th>
                            <th className="px-4 py-3 border-l border-gray-300 text-right w-24">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white">
                            <td colSpan="3" className="px-4 py-3 text-gray-500 italic">Tidak ada data</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold border-t border-gray-200">
                            <td colSpan="2" className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Kategori Table */}
            <div className="mb-2 text-sm text-gray-600 font-medium px-1">Kategori</div>
            <div className="bg-white shadow-sm border border-gray-100 mb-16 overflow-hidden rounded">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#cbd5e1] text-gray-800 text-xs font-bold">
                        <tr>
                            <th className="px-4 py-3 w-16">No</th>
                            <th className="px-4 py-3 border-l border-gray-300">Kategori</th>
                            <th className="px-4 py-3 border-l border-gray-300 text-right w-24">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white">
                            <td colSpan="3" className="px-4 py-3 text-gray-500 italic">Tidak ada data</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold border-t border-gray-200">
                            <td colSpan="2" className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Some padding for the bottom fixed footer */}
            <div className="h-10"></div>
        </div>
    );
};

// Helper icons required in this file
const ChevronUpIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
    </svg>
)

const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
    </svg>
)

export default Dashboard;
