import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Categories from './pages/Categories'
import CategoryFormPage from './pages/CategoryFormPage'
import Products from './pages/Products'
import ProductFormPage from './pages/ProductFormPage'
import Brands from './pages/Brands'
import BrandFormPage from './pages/BrandFormPage'
import Units from './pages/Units'
import UnitFormPage from './pages/UnitFormPage'
import Variants from './pages/Variants'
import VariantFormPage from './pages/VariantFormPage'
import PriceCategories from './pages/PriceCategories'
import PriceCategoryFormPage from './pages/PriceCategoryFormPage'
import PromoPage from './pages/PromoPage'
import PromoFormPage from './pages/PromoFormPage'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('https://bizkit-api.onrender.com/api/auth/login', {
        username,
        password
      })

      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      navigate('/laporan/penjualan-harian')
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal, periksa koneksi atau kredensial Anda')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    axios.get('https://bizkit-api.onrender.com/api/ping').catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-bizkit-green">BizKit POS</h1>
          <p className="text-gray-500">Silakan login ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bizkit-green focus:border-bizkit-green"
              placeholder="ownerdemo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bizkit-green focus:border-bizkit-green"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-green-400' : 'bg-bizkit-green hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bizkit-green`}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

import LaporanPenjualan from './pages/LaporanPenjualan'
import TrendReportPage from './pages/TrendReportPage'
import RiwayatReportPage from './pages/RiwayatReportPage'
import ShiftReportPage from './pages/ShiftReportPage'
import AbsensiReportPage from './pages/AbsensiReportPage'
import UserPage from './pages/UserPage'
import UserFormPage from './pages/UserFormPage'
import HakAksesPage from './pages/HakAksesPage'
import HakAksesFormPage from './pages/HakAksesFormPage'
import PaymentMethodPage from './pages/PaymentMethodPage'
import PaymentMethodFormPage from './pages/PaymentMethodFormPage'
import PengaturanUmumPage from './pages/PengaturanUmumPage'
import GantiPasswordPage from './pages/GantiPasswordPage'

// Generic Placeholder for unimplemented pages
const Placeholder = ({ title }) => (
  <div className="p-8 flex items-center justify-center h-full">
    <h1 className="text-2xl text-gray-500 font-semibold">{title} (Under Construction)</h1>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard/App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/laporan/penjualan-harian" replace />} />

          {/* Penjualan */}
          <Route path="/promo-voucher" element={<PromoPage />} />
          <Route path="/promo-voucher/form" element={<PromoFormPage />} />
          <Route path="/promo-voucher/form/:id" element={<PromoFormPage />} />

          {/* Produk */}
          <Route path="/products" element={<Products />} />
          <Route path="/product/form" element={<ProductFormPage />} />
          <Route path="/product/form/:id" element={<ProductFormPage />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/form" element={<CategoryFormPage />} />
          <Route path="/category/form/:id" element={<CategoryFormPage />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/productBrand/form" element={<BrandFormPage />} />
          <Route path="/productBrand/form/:id" element={<BrandFormPage />} />
          <Route path="/units" element={<Units />} />
          <Route path="/unit/form" element={<UnitFormPage />} />
          <Route path="/unit/form/:id" element={<UnitFormPage />} />
          <Route path="/variants" element={<Variants />} />
          <Route path="/variant/form" element={<VariantFormPage />} />
          <Route path="/variant/form/:id" element={<VariantFormPage />} />
          <Route path="/price-categories" element={<PriceCategories />} />
          <Route path="/price-category/form" element={<PriceCategoryFormPage />} />
          <Route path="/price-category/form/:id" element={<PriceCategoryFormPage />} />

          {/* Laporan */}
          <Route path="/laporan/penjualan-harian" element={<LaporanPenjualan />} />
          <Route path="/dashboard" element={<Navigate to="/laporan/penjualan-harian" replace />} />
          <Route path="/laporan/absensi" element={<AbsensiReportPage />} />
          <Route path="/laporan/shift" element={<ShiftReportPage />} />
          <Route path="/laporan/trend" element={<TrendReportPage />} />
          <Route path="/laporan/riwayat" element={<RiwayatReportPage />} />

          {/* Pengaturan */}
          <Route path="/pengaturan/user" element={<UserPage />} />
          <Route path="/pengaturan/user/form" element={<UserFormPage />} />
          <Route path="/pengaturan/user/form/:id" element={<UserFormPage />} />
          <Route path="/pengaturan/hak-akses" element={<HakAksesPage />} />
          <Route path="/pengaturan/hak-akses/form" element={<HakAksesFormPage />} />
          <Route path="/pengaturan/hak-akses/form/:id" element={<HakAksesFormPage />} />
          <Route path="/pengaturan/metode-pembayaran" element={<PaymentMethodPage />} />
          <Route path="/pengaturan/metode-pembayaran/form" element={<PaymentMethodFormPage />} />
          <Route path="/pengaturan/metode-pembayaran/form/:id" element={<PaymentMethodFormPage />} />
          <Route path="/pengaturan/umum" element={<PengaturanUmumPage />} />
          <Route path="/pengaturan/ganti-password" element={<GantiPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
