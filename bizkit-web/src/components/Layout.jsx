import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    HomeIcon,
    PresentationChartBarIcon, // For "Laporan"
    TagIcon,
    ShoppingBagIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Cog6ToothIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    KeyIcon,
    CreditCardIcon,
    AdjustmentsHorizontalIcon,
    ChartBarSquareIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    TicketIcon,
    ArchiveBoxIcon,
    ListBulletIcon,
    SwatchIcon,
    ScaleIcon,
    CircleStackIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const SidebarMenu = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-kasir-green rounded-md transition-colors"
                style={{ outline: 'none' }}
            >
                <div className="flex items-center space-x-3">
                    <div className="w-5 h-5">{icon}</div>
                    <span className="font-medium text-sm">{title}</span>
                </div>
                {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

const SidebarItem = ({ to, icon, label, isSubItem = false }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors duration-200 text-sm ${isActive
                    ? 'bg-white text-bizkit-green font-semibold shadow-md'
                    : 'text-white hover:bg-kasir-green'
                } ${isSubItem ? 'ml-6' : ''}`
            }
        >
            {icon && <div className="w-5 h-5">{icon}</div>}
            <span>{label}</span>
        </NavLink>
    );
};

// Component for a section title (e.g. UMUM, PENJUALAN under Laporan)
const SidebarGroupTitle = ({ title }) => (
    <div className="px-4 py-2 mt-2 text-xs font-semibold text-green-200 uppercase tracking-wider ml-6">
        {title}
    </div>
);


const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [outletLogo, setOutletLogo] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const location = useLocation();

    // Permissions logic
    let userPermissions = {};
    try {
        if (user.role && user.role.permissions) {
            userPermissions = JSON.parse(user.role.permissions);
        }
    } catch (e) {
        console.error("Failed to parse user permissions");
    }

    const hasPermission = (permissionId) => {
        // Owner/Superuser might bypass if needed, but for now we strictly check permissions object
        // If the role has full access check 'all' flag if we use it, otherwise check specific ID
        if (userPermissions.all) return true;
        return !!userPermissions[permissionId];
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isDropdownOpen && !e.target.closest('.user-dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    // Dark mode effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('https://bizkit-api.onrender.com/api/settings', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (res.data.data?.logo) setOutletLogo(res.data.data.logo);
                })
                .catch(() => { });
        }
    }, [location.pathname]);

    // Mapping path routes to page titles to show dynamically in the topbar
    const pageTitles = {
        '/laporan/penjualan-harian': 'Laporan Penjualan Harian',
        '/categories': 'Kategori',
        '/products': 'Produk',
        '/laporan/absensi': 'Laporan Absensi',
        '/laporan/shift': 'Pergantian Shift',
        '/laporan/trend': 'Trend Penjualan',
        '/laporan/riwayat': 'Riwayat Penjualan',
        '/brands': 'Merek',
        '/units': 'Satuan',
        '/variants': 'Varian',
        '/price-categories': 'Multi Harga',
        '/promo-voucher': 'Promo & Voucher',
    };

    // Dynamic match for form routes
    let currentTitle = pageTitles[location.pathname] || 'BizKit POS';
    if (location.pathname.startsWith('/category/form')) {
        currentTitle = 'Tambah Kategori';
    } else if (location.pathname.startsWith('/product/form')) {
        currentTitle = 'Tambah Produk';
    } else if (location.pathname.startsWith('/productBrand/form')) {
        currentTitle = 'Tambah Merek';
    } else if (location.pathname.startsWith('/unit/form')) {
        currentTitle = 'Tambah Satuan';
    } else if (location.pathname.startsWith('/variant/form')) {
        currentTitle = 'Tambah Varian';
    } else if (location.pathname.startsWith('/price-category/form')) {
        currentTitle = 'Tambah Multi Harga';
    } else if (location.pathname.startsWith('/promo-voucher/form')) {
        currentTitle = 'Tambah Promo & Voucher';
    }


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-kasir-gray font-sans overflow-hidden">
            {/* Mobile sidebar overlay */}
            {!isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(true)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-bizkit-green shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo Area */}
                <div className="flex items-center justify-center h-16 border-b border-kasir-green px-4">
                    {outletLogo ? (
                        <img src={`https://bizkit-api.onrender.com${outletLogo}`} alt="Logo" className="h-10 max-w-[140px] object-contain" />
                    ) : (
                        <span className="text-xl font-bold text-white italic tracking-wider flex items-center">
                            <span className="bg-white text-bizkit-green px-1 py-0.5 rounded-sm mr-2 not-italic text-sm">BizKit</span>
                            KASIRKULINER
                        </span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden absolute right-4 text-white hover:text-gray-200"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">

                    {/* Penjualan */}
                    {(hasPermission('pos_access') || hasPermission('pos_transaction') || hasPermission('pos_discount') || hasPermission('promo_access')) && (
                        <SidebarMenu title="Penjualan" icon={<ListBulletIcon />}>
                            {hasPermission('promo_access') && <SidebarItem to="/promo-voucher" icon={<TicketIcon />} label="Promo & Voucher" isSubItem />}
                        </SidebarMenu>
                    )}

                    {/* Produk */}
                    {(hasPermission('master_product') || hasPermission('master_category') || hasPermission('master_brand') || hasPermission('master_unit') || hasPermission('master_variant') || hasPermission('master_price')) && (
                        <SidebarMenu title="Produk" icon={<ListBulletIcon />} defaultOpen={location.pathname === '/products' || location.pathname === '/categories'}>
                            {hasPermission('master_product') && <SidebarItem to="/products" icon={<ArchiveBoxIcon />} label="Produk" isSubItem />}
                            {hasPermission('master_category') && <SidebarItem to="/categories" icon={<TagIcon />} label="Kategori" isSubItem />}
                            {hasPermission('master_brand') && <SidebarItem to="/brands" icon={<TagIcon />} label="Merek" isSubItem />}
                            {hasPermission('master_unit') && <SidebarItem to="/units" icon={<TagIcon />} label="Satuan" isSubItem />}
                            {hasPermission('master_variant') && <SidebarItem to="/variants" icon={<CircleStackIcon />} label="Varian" isSubItem />}
                            {hasPermission('master_price') && <SidebarItem to="/price-categories" icon={<TagIcon />} label="Multi Harga" isSubItem />}
                        </SidebarMenu>
                    )}

                    {/* Laporan */}
                    {(hasPermission('report_sales') || hasPermission('report_trend') || hasPermission('report_history') || hasPermission('report_shift') || hasPermission('report_attendance')) && (
                        <SidebarMenu title="Laporan" icon={<PresentationChartBarIcon />} defaultOpen={location.pathname.startsWith('/laporan')}>
                            {(hasPermission('report_attendance') || hasPermission('report_shift')) && <SidebarGroupTitle title="UMUM" />}
                            {hasPermission('report_attendance') && <SidebarItem to="/laporan/absensi" icon={<ClipboardDocumentListIcon />} label="Laporan Absensi" isSubItem />}
                            {hasPermission('report_shift') && <SidebarItem to="/laporan/shift" icon={<ClockIcon />} label="Pergantian Shift" isSubItem />}

                            {(hasPermission('report_sales') || hasPermission('report_trend') || hasPermission('report_history')) && <SidebarGroupTitle title="PENJUALAN" />}
                            {hasPermission('report_sales') && <SidebarItem to="/laporan/penjualan-harian" icon={<ChartBarSquareIcon />} label="Penjualan Harian" isSubItem />}
                            {hasPermission('report_trend') && <SidebarItem to="/laporan/trend" icon={<ChartBarSquareIcon />} label="Trend Penjualan" isSubItem />}
                            {hasPermission('report_history') && <SidebarItem to="/laporan/riwayat" icon={<ChartBarSquareIcon />} label="Riwayat Penjualan" isSubItem />}
                        </SidebarMenu>
                    )}

                    {/* Pengaturan */}
                    {(hasPermission('setting_user') || hasPermission('setting_role') || hasPermission('setting_payment') || hasPermission('setting_general')) && (
                        <SidebarMenu title="Pengaturan" icon={<Cog6ToothIcon />}>
                            {hasPermission('setting_user') && <SidebarItem to="/pengaturan/user" icon={<UserGroupIcon />} label="User" isSubItem />}
                            {hasPermission('setting_role') && <SidebarItem to="/pengaturan/hak-akses" icon={<KeyIcon />} label="Hak Akses" isSubItem />}
                            {hasPermission('setting_payment') && <SidebarItem to="/pengaturan/metode-pembayaran" icon={<CreditCardIcon />} label="Metode Pembayaran" isSubItem />}
                            {hasPermission('setting_general') && <SidebarItem to="/pengaturan/umum" icon={<AdjustmentsHorizontalIcon />} label="Pengaturan Umum" isSubItem />}
                        </SidebarMenu>
                    )}

                </nav>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full bg-kasir-gray overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-kasir-green flex items-center justify-between px-6 shadow-md shrink-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-white hover:text-gray-200 focus:outline-none lg:hidden mr-4"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h1 className="text-white text-lg font-semibold tracking-wide">{currentTitle}</h1>
                    </div>

                    {/* Right side Topbar */}
                    <div className="flex items-center space-x-6">
                        <span className="text-white font-medium text-sm">{user.outlet || 'Dagashi'}</span>
                        <div className="relative user-dropdown-container">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="text-white hover:text-gray-200 focus:outline-none"
                                title="Menu"
                            >
                                <UserIcon className="w-6 h-6" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                                    {/* Greeting */}
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm text-gray-500">Hi, {user.username || 'User'}</p>
                                    </div>

                                    {/* Dark Mode */}
                                    <button
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                        Dark Mode
                                        <div className={`ml-auto w-9 h-5 rounded-full transition-colors ${isDarkMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${isDarkMode ? 'translate-x-4.5 ml-[18px]' : 'ml-0.5'}`} />
                                        </div>
                                    </button>

                                    {/* Ganti Kata Sandi */}
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); navigate('/pengaturan/ganti-password'); }}
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Ganti Kata Sandi
                                    </button>

                                    {/* Keluar */}
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-auto bg-kasir-gray relative custom-scrollbar">
                    <Outlet />
                </div>

                {/* Footer at the bottom of the main content area */}
                <footer className="shrink-0 flex justify-between items-center px-6 py-3 text-xs text-gray-500 bg-kasir-gray">
                    <span>Copyright © 2014-2026 AINDO. All rights reserved.</span>
                    <span>BizKit</span>
                </footer>
            </main>
        </div>
    );
};

export default Layout;
