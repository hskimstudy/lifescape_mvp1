import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';

const AdminLayout = ({ session, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        console.log("AdminLayout: Logout button clicked");
        await onLogout();
        console.log("AdminLayout: After onLogout() call");
    };

    const navItems = [
        { path: '/admin', label: '대시보드', icon: '📊' },
        { path: '/admin/generations', label: '이미지 결과', icon: '🖼️' },
        { path: '/admin/inquiries', label: '문의 관리', icon: '✉️' },
        { path: '/admin/feedback', label: '사용자 피드백', icon: '⭐' },
        { path: '/admin/users', label: '사용자 관리', icon: '👥' },
        { path: '/admin/payments', label: '결제 내역', icon: '💳' },
    ];

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <img src="/assets/Vector.png" alt="Logo" className="admin-logo-mark" />
                    <h2>itda 관리자</h2>
                </div>

                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => item.path === '/admin' && setSearchQuery('')}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-avatar">A</div>
                        <div className="admin-details">
                            <span className="admin-name">관리자</span>
                            <span className="admin-email">{session?.user?.email}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="admin-logout-btn">
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-search">
                        {location.pathname !== '/admin' && (
                            <input
                                type="text"
                                placeholder="검색어 입력..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="admin-search-input"
                            />
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="admin-home-btn" onClick={() => navigate('/')}>
                            <span className="home-icon">🏠</span>
                            사이트 홈으로
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    <Outlet context={{ searchQuery, session }} />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
