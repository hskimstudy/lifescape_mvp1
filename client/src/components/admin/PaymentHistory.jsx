import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const PaymentHistory = () => {
    const context = useOutletContext();
    const searchQuery = context?.searchQuery || '';
    const session = context?.session;
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, subs: 0, refundRate: 0, avg: 0 });
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        setLoading(true);
        const { data, error } = await dbFetch('payments', {
            select: '*',
            order: 'created_at.desc',
            token: session?.access_token
        });

        if (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } else {
            setPayments(data || []);

            const validData = data || [];
            const revenue = validData.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const subs = validData.length;
            const refunds = validData.filter(p => p.status === 'refunded').length;
            const refundRate = subs > 0 ? ((refunds / subs) * 100).toFixed(1) : 0;
            const avg = validData.filter(p => p.status === 'completed').length > 0
                ? (revenue / validData.filter(p => p.status === 'completed').length).toFixed(0) : 0;

            setStats({ revenue, subs, refundRate, avg });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'completed'; // uses existing css class (green)
            case 'failed': return 'pending'; // need a red version, but we'll adapt pending for now or add inline
            case 'refunded': return '';
            default: return '';
        }
    };

    const filteredPayments = useMemo(() => {
        if (!searchQuery) return payments;
        const query = searchQuery.toLowerCase();
        return payments.filter(payment =>
            (payment.id && payment.id.toLowerCase().includes(query)) ||
            (payment.user_email && payment.user_email.toLowerCase().includes(query)) ||
            (payment.plan && payment.plan.toLowerCase().includes(query)) ||
            (payment.amount && payment.amount.toString().includes(query)) ||
            (payment.status && (payment.status === 'completed' ? '완료' : payment.status === 'failed' ? '실패' : '환불').includes(query)) ||
            (new Date(payment.date || payment.created_at).toLocaleString().includes(query))
        );
    }, [payments, searchQuery]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">결제 내역</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p className="admin-page-desc" style={{ marginBottom: 0 }}>트랜잭션, 구독 및 수익을 추적합니다.</p>
                        {searchQuery && (
                            <span style={{
                                background: 'rgba(163, 183, 52, 0.1)',
                                color: '#a3b734',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                검색 결과: {filteredPayments.length}건
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn">CSV 내보내기</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="admin-card" style={{ padding: '20px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>총 수익</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>₩{stats.revenue.toLocaleString()}</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>트랜잭션</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{stats.subs.toLocaleString()}</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>환불률</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>{stats.refundRate}%</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>평균 결제 금액</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>₩{Number(stats.avg).toLocaleString()}</div>
                </div>
            </div>

            <div className="admin-card admin-table-container">
                {loading ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>결제 내역을 불러오는 중...</div>
                ) : filteredPayments.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
                        {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '결제 내역이 없습니다.'}
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>결제 ID</th>
                                <th>날짜</th>
                                <th>고객</th>
                                <th>상품 / 플랜</th>
                                <th>금액</th>
                                <th>상태</th>
                                <th>영수증</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id}>
                                    <td style={{ fontFamily: 'monospace', color: '#a3b734' }}>{payment.id}</td>
                                    <td style={{ color: '#94a3b8' }}>{new Date(payment.date || payment.created_at).toLocaleString()}</td>
                                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{payment.user_email}</td>
                                    <td>{payment.plan === 'pro' ? '스튜디오 플랜' : payment.plan === 'basic' ? '싱글 플랜' : payment.plan}</td>
                                    <td style={{ fontWeight: 600, color: '#fff' }}>₩{payment.amount.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusStyle(payment.status)}`} style={{
                                            background: payment.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : payment.status === 'refunded' ? 'rgba(255, 255, 255, 0.1)' : '',
                                            color: payment.status === 'failed' ? '#ef4444' : payment.status === 'refunded' ? '#94a3b8' : '',
                                            border: '1px solid',
                                            borderColor: payment.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : payment.status === 'refunded' ? 'rgba(255, 255, 255, 0.1)' : ''
                                        }}>
                                            {payment.status === 'completed' ? '완료' : payment.status === 'failed' ? '실패' : payment.status === 'refunded' ? '환불' : payment.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn" style={{ padding: '6px 12px' }}>보기</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
