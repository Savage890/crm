import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    HiOutlineViewGrid,
    HiOutlineUserGroup,
    HiOutlineCurrencyDollar,
    HiOutlineClipboardList,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineX
} from 'react-icons/hi'

const navItems = [
    { to: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/contacts', icon: HiOutlineUserGroup, label: 'Contacts' },
    { to: '/deals', icon: HiOutlineCurrencyDollar, label: 'Deals' },
    { to: '/activities', icon: HiOutlineClipboardList, label: 'Activities' },
]

export default function Layout() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">N</div>
                        <span className="logo-text">NexusCRM</span>
                    </div>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                        <HiOutlineX size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-details">
                            <span className="user-email">{user?.email || 'User'}</span>
                        </div>
                    </div>
                    <button className="sign-out-btn" onClick={handleSignOut}>
                        <HiOutlineLogout size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="top-bar">
                    <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                        <HiOutlineMenu size={22} />
                    </button>
                    <div className="top-bar-right">
                        <div className="user-avatar-sm">{userInitial}</div>
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
