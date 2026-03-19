import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const DashboardOverview = () => {
    const { session } = useOutletContext() || {};
    const [stats, setStats] = useState({ inquiries: 0, feedbacks: 0, users: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const token = session?.access_token;
        console.log("Admin Stats: Fetching stats via dbFetch...");
        try {
            const inquiriesRes = await dbFetch('inquiries', {
                count: true,
                head: true,
                token,
                filters: { status: 'neq.feedback' }
            });
            const feedbackRes = await dbFetch('inquiries', {
                count: true,
                head: true,
                token,
                filters: { status: 'feedback' }
            });
            const usersRes = await dbFetch('profiles', { count: true, head: true, token });
            const paymentsRes = await dbFetch('payments', { select: 'amount', token });

            const totalRevenue = paymentsRes.data
                ? paymentsRes.data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                : 0;

            console.log("Admin Stats Summary:", {
                inquiries: inquiriesRes.count,
                feedbacks: feedbackRes.count,
                users: usersRes.count,
                revenue: totalRevenue
            });

            setStats({
                inquiries: inquiriesRes.count || 0,
                feedbacks: feedbackRes.count || 0,
                users: usersRes.count || 0,
                revenue: totalRevenue,
            });
        } catch (error) {
            console.error('Admin Stats: Exception in fetchStats:', error);
            setStats({ inquiries: 0, feedbacks: 0, users: 0, revenue: 0 });
        }
        setLoading(false);
    }, [session?.access_token]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">대시보드 개요</h1>
                    <p className="admin-page-desc">itda 관리자 페이지에 오신 것을 환영합니다.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="admin-card">
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>총 문의 수</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                        {loading ? '...' : stats.inquiries}
                    </div>
                </div>
                <div className="admin-card">
                    <h3 style={{ color: '#a855f7', fontSize: '0.9rem', marginBottom: '12px' }}>총 피드백 수</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                        {loading ? '...' : stats.feedbacks}
                    </div>
                </div>
                <div className="admin-card">
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>총 사용자 수</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                        {loading ? '...' : stats.users}
                    </div>
                </div>
                <div className="admin-card">
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>누적 수익</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                        {loading ? '...' : `₩${stats.revenue.toLocaleString()}`}
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>최근 활동</h2>
                <p style={{ color: '#94a3b8' }}>아직 표시할 최근 활동이 없습니다.</p>
            </div>
        </div>
    );
};

export default DashboardOverview;
