import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const UserManagement = () => {
    const context = useOutletContext();
    const { searchQuery, session } = context || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        console.log("Admin: Fetching users via dbFetch...");

        try {
            const { data, error } = await dbFetch('profiles', {
                order: 'created_at.desc',
                token: session?.access_token
            });

            if (error) {
                console.error('Admin: Fetch error:', error);
                setUsers([]);
            } else {
                setUsers(data || []);
                console.log(`Admin: Successfully fetched ${data?.length || 0} users.`);
            }
        } catch (err) {
            console.error("Admin: Fetch exception:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    const [editingUser, setEditingUser] = useState(null);
    const [newCredits, setNewCredits] = useState(0);
    const [newPlan, setNewPlan] = useState('free');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditClick = (user) => {
        setEditingUser(user);
        setNewCredits(user.credits || 0);
        setNewPlan(user.plan || 'free');
    };

    const handleUpdateCredits = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsUpdating(true);
        console.log(`Admin: Updating credits for ${editingUser.email} to ${newCredits}`);

        try {
            const { data, error } = await dbFetch('profiles', {
                method: 'PATCH',
                token: session?.access_token,
                filters: { id: editingUser.id },
                body: { credits: parseInt(newCredits), plan: newPlan }
            });

            if (error) {
                console.error('Admin: Credit update error:', error);
                if (window.showToast) window.showToast(`크레딧 수정에 실패했습니다: ${error.message || '알 수 없는 에러'}`, 'error');
                else alert(`크레딧 수정에 실패했습니다: ${error.message || '알 수 없는 에러'}`);
            } else if (!data || data.length === 0) {
                if (window.showToast) window.showToast(`크레딧 수정이 적용되지 않았습니다 (DB 보안 정책 차단).`, 'error');
                else alert('크레딧 수정이 적용되지 않았습니다 (DB 보안 정책 차단).');
            } else {
                if (window.showToast) window.showToast('크레딧이 성공적으로 수정되었습니다.');
                else alert('크레딧이 성공적으로 수정되었습니다.');
                setEditingUser(null);
                fetchUsers(); // Refresh list
            }
        } catch (err) {
            console.error('Admin: Credit update exception:', err);
            if (window.showToast) window.showToast('요청 중 오류가 발생했습니다.', 'error');
            else alert('요청 중 오류가 발생했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();

        return users.filter(user => {
            const emailContent = (user.email || '').toLowerCase();
            const idContent = (user.id || '').toLowerCase();

            // Date formatting for search
            const dateObj = new Date(user.created_at);
            const dateStr = dateObj.toLocaleDateString();
            const isoDate = dateObj.toISOString().split('T')[0];
            const compactDate = isoDate.replace(/-/g, '');

            const phoneContent = (user.phone || '').toLowerCase();
            const companyContent = (user.company || '').toLowerCase();

            return (
                emailContent.includes(query) ||
                phoneContent.includes(query) ||
                companyContent.includes(query) ||
                idContent.includes(query) ||
                dateStr.includes(query) ||
                isoDate.includes(query) ||
                compactDate.includes(query)
            );
        });
    }, [users, searchQuery]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">사용자 관리</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p className="admin-page-desc" style={{ marginBottom: 0 }}>등록된 사용자 및 권한을 확인하고 관리합니다.</p>
                        {searchQuery && (
                            <span style={{
                                background: 'rgba(163, 183, 52, 0.1)',
                                color: '#a3b734',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                검색 결과: {filteredUsers.length}건
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={fetchUsers}>새로고침</button>
                    <button className="admin-btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>사용자 추가</button>
                </div>
            </div>

            <div className="admin-card admin-table-container">
                {loading ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>사용자를 불러오는 중...</div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
                        {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '등록된 사용자가 없습니다.'}
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>사용자</th>
                                <th>업체명</th>
                                <th>전화번호</th>
                                <th>플랜</th>
                                <th>가입일</th>
                                <th>크레딧</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="admin-avatar" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                                                {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span style={{ fontWeight: 500, color: '#fff' }}>{user.email || '알 수 없는 사용자'}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#fff' }}>{user.company || '-'}</td>
                                    <td style={{ color: '#fff' }}>{user.phone || '-'}</td>
                                    <td>
                                        <span className={`admin-plan-badge ${(user.plan || 'free')}`}>
                                            {(user.plan || 'free') === 'pro' ? '✨ Studio' : (user.plan || 'free') === 'basic' ? '🪙 Single' : 'Free'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '해당 없음'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#fff' }}>
                                        {user.credits !== null && user.credits !== undefined ? user.credits.toLocaleString() : '0'}
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn"
                                            style={{ marginRight: '8px' }}
                                            onClick={() => handleEditClick(user)}
                                        >
                                            수정
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Credit Edit Modal */}
            {editingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="admin-card" style={{ width: '400px', padding: '32px' }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', fontWeight: 600 }}>크레딧 수정</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.95rem' }}>
                            <strong style={{ color: '#fff' }}>{editingUser.email}</strong> 님의 크레딧을 수정합니다.
                        </p>

                        <form onSubmit={handleUpdateCredits}>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>
                                    현재 크레딧: {editingUser.credits || 0}
                                </label>
                                <input
                                    type="number"
                                    value={newCredits}
                                    onChange={(e) => setNewCredits(e.target.value)}
                                    className="admin-input"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '1.1rem'
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>
                                    플랜
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setNewPlan('free')}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid',
                                            borderColor: newPlan === 'free' ? '#a3b734' : 'rgba(255,255,255,0.1)',
                                            background: newPlan === 'free' ? 'rgba(163,183,52,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: newPlan === 'free' ? '#a3b734' : '#94a3b8',
                                            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                                        }}
                                    >
                                        Free
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPlan('basic')}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid',
                                            borderColor: newPlan === 'basic' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                            background: newPlan === 'basic' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: newPlan === 'basic' ? '#3b82f6' : '#94a3b8',
                                            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                                        }}
                                    >
                                        🪙 Single
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPlan('pro')}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid',
                                            borderColor: newPlan === 'pro' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                            background: newPlan === 'pro' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: newPlan === 'pro' ? '#f59e0b' : '#94a3b8',
                                            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                                        }}
                                    >
                                        ✨ Studio
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="action-btn"
                                    onClick={() => setEditingUser(null)}
                                    disabled={isUpdating}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? '저장 중...' : '변경사항 저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
