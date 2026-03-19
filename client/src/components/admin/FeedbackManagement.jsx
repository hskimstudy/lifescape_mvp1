import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const FeedbackManagement = () => {
    const context = useOutletContext();
    const searchQuery = context?.searchQuery || '';
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const fetchFeedbacks = async () => {
        setLoading(true);
        console.log("Admin: Fetching user feedbacks...");

        try {
            const { data, error } = await dbFetch('inquiries', {
                select: '*,profiles(email)',
                filters: { status: 'feedback' },
                order: 'created_at.desc'
            });

            if (error) {
                console.error('Admin: Feedback fetch error:', error);
                setFeedbacks([]);
            } else {
                console.log(`Admin: Successfully fetched ${data?.length || 0} feedbacks.`);
                setFeedbacks(data || []);
            }
        } catch (err) {
            console.error("Admin: Feedback fetch exception:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const filteredFeedbacks = useMemo(() => {
        if (!searchQuery) return feedbacks;
        const query = searchQuery.toLowerCase();

        return feedbacks.filter(fb => {
            const nameContent = (fb.name || '').toLowerCase();
            const emailContent = (fb.email || '').toLowerCase();
            const messageContent = (fb.message || '').toLowerCase();

            // Star rating extraction for search (e.g. searching "5")
            const starMatch = fb.message.match(/\[별점: (\d+)점\]/);
            const stars = starMatch ? starMatch[1] : '';

            return (
                nameContent.includes(query) ||
                emailContent.includes(query) ||
                messageContent.includes(query) ||
                stars.includes(query) ||
                (query === '별점' && stars)
            );
        });
    }, [feedbacks, searchQuery]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">사용자 피드백</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p className="admin-page-desc" style={{ marginBottom: 0 }}>다운로드 완료 후 사용자들이 제출한 별점과 의견을 확인합니다.</p>
                        {searchQuery && (
                            <span style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                color: '#a855f7',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                검색 결과: {filteredFeedbacks.length}건
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={fetchFeedbacks}>새로고침</button>
                </div>
            </div>

            <div className="admin-card admin-table-container">
                {loading ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>피드백을 불러오는 중...</div>
                ) : filteredFeedbacks.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
                        {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '피드백 내역이 없습니다.'}
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>사용자</th>
                                <th>별점</th>
                                <th>피드백 내용</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeedbacks.map((fb) => {
                                const starMatch = fb.message.match(/\[별점: (\d+)점\]/);
                                const stars = starMatch ? parseInt(starMatch[1]) : 5;
                                const content = fb.message.includes('피드백 내용:')
                                    ? fb.message.split('피드백 내용:')[1].trim()
                                    : fb.message;

                                return (
                                    <tr key={fb.id}>
                                        <td style={{ color: '#94a3b8' }}>{new Date(fb.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{fb.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fb.email}</div>
                                        </td>
                                        <td>
                                            <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>
                                                {'★'.repeat(stars)}
                                            </span>
                                            <span style={{ color: '#475569', fontSize: '0.8rem', marginLeft: '4px' }}>
                                                ({stars})
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {content}
                                        </td>
                                        <td>
                                            <button
                                                className="action-btn"
                                                style={{ padding: '6px 12px' }}
                                                onClick={() => setSelectedFeedback(fb)}
                                            >
                                                상세보기
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {selectedFeedback && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedFeedback(null)}>
                    <div
                        className="admin-card"
                        style={{
                            width: '90%', maxWidth: '500px', padding: '32px',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>피드백 상세 정보</h2>
                            <button
                                onClick={() => setSelectedFeedback(null)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
                                <div style={{ color: '#94a3b8' }}>사용자:</div>
                                <div>{selectedFeedback.name} ({selectedFeedback.email})</div>
                                <div style={{ color: '#94a3b8' }}>일시:</div>
                                <div>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
                                <div style={{ color: '#94a3b8' }}>만족도:</div>
                                <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginTop: '-4px' }}>
                                    {'★'.repeat(parseInt(selectedFeedback.message.match(/\[별점: (\d+)점\]/)?.[1] || '5'))}
                                </div>
                            </div>

                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                피드백 의견:
                            </div>
                            <div style={{
                                color: '#e2e8f0',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                padding: '16px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '12px',
                                fontSize: '0.95rem'
                            }}>
                                {selectedFeedback.message.includes('피드백 내용:')
                                    ? selectedFeedback.message.split('피드백 내용:')[1].trim()
                                    : selectedFeedback.message}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="admin-btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => setSelectedFeedback(null)}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackManagement;
