import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const InquiryManagement = () => {
    const context = useOutletContext();
    const searchQuery = context?.searchQuery || '';
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchInquiries = async () => {
        setLoading(true);
        console.log("Admin: Fetching inquiries with profiles...");

        try {
            const { data, error } = await dbFetch('inquiries', {
                select: '*,profiles(email)',
                filters: { status: 'neq.feedback' },
                order: 'created_at.desc'
            });

            if (error) {
                console.error('Admin: Fetch error:', error);
                setInquiries([]);
            } else {
                console.log(`Admin: Successfully fetched ${data?.length || 0} inquiries.`);
                setInquiries(data || []);
            }
        } catch (err) {
            console.error("Admin: Fetch exception:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        if (selectedInquiry) {
            setReplyText(selectedInquiry.reply || '');
        } else {
            setReplyText('');
        }
    }, [selectedInquiry]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setIsSubmitting(true);

        try {
            const { error } = await dbFetch('inquiries', {
                method: 'PATCH',
                filters: { id: selectedInquiry.id },
                body: {
                    reply: replyText,
                    status: 'answered',
                    replied_at: new Date().toISOString()
                }
            });

            if (error) {
                console.error('Error submitting reply:', error);
                if (window.showToast) window.showToast(`답변 등록에 실패했습니다: ${error.message || JSON.stringify(error)}`, 'error');
                else alert(`답변 등록에 실패했습니다: ${error.message || JSON.stringify(error)}`);
            } else {
                if (window.showToast) window.showToast('답변이 성공적으로 등록되었습니다.');
                else alert('답변이 성공적으로 등록되었습니다.');
                setSelectedInquiry(null);
                setReplyText('');
                fetchInquiries();
            }
        } catch (err) {
            console.error("Reply exception:", err);
            if (window.showToast) window.showToast("통신 중 오류가 발생했습니다.", 'error');
            else alert("통신 중 오류가 발생했습니다.");
        }
        setIsSubmitting(false);
    };

    const getStatusStyle = (status) => {
        return status === 'answered' ? 'completed' : 'pending';
    };

    const filteredInquiries = useMemo(() => {
        if (!searchQuery) return inquiries;
        const query = searchQuery.toLowerCase();

        return inquiries.filter(inq => {
            const nameContent = (inq.name || '').toLowerCase();
            const companyContent = (inq.company || '').toLowerCase();
            const phoneContent = (inq.phone || '').toLowerCase();
            const emailContent = (inq.email || '').toLowerCase();
            const profileEmailContent = (inq.profiles?.email || '').toLowerCase();
            const messageContent = (inq.message || '').toLowerCase();
            const statusContent = (inq.status === 'answered' ? '답변 완료' : '대기 중').toLowerCase();
            const replyContent = (inq.reply || '').toLowerCase();

            // Date formatting for search
            const dateObj = new Date(inq.created_at);
            const dateStr = dateObj.toLocaleDateString();
            const isoDate = dateObj.toISOString().split('T')[0];
            const compactDate = isoDate.replace(/-/g, '');

            const isNonMember = !inq.user_id;
            const matchesNonMemberQuery = query === '비회원' || query === 'guest';

            return (
                nameContent.includes(query) ||
                companyContent.includes(query) ||
                phoneContent.includes(query) ||
                emailContent.includes(query) ||
                profileEmailContent.includes(query) ||
                messageContent.includes(query) ||
                statusContent.includes(query) ||
                replyContent.includes(query) ||
                dateStr.includes(query) ||
                isoDate.includes(query) ||
                compactDate.includes(query) ||
                (isNonMember && matchesNonMemberQuery)
            );
        });
    }, [inquiries, searchQuery]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">문의 관리</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p className="admin-page-desc" style={{ marginBottom: 0 }}>고객 문의를 관리하고 답변을 제공합니다.</p>
                        {searchQuery && (
                            <span style={{
                                background: 'rgba(163, 183, 52, 0.1)',
                                color: '#a3b734',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                검색 결과: {filteredInquiries.length}건
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={fetchInquiries}>새로고침</button>
                </div>
            </div>

            <div className="admin-card admin-table-container">
                {loading ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>문의를 불러오는 중...</div>
                ) : filteredInquiries.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
                        {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '문의 내역이 없습니다.'}
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>성함</th>
                                <th>업체명</th>
                                <th>연락처</th>
                                <th>사용자 계정</th>
                                <th>상태</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInquiries.map((inq) => (
                                <tr key={inq.id}>
                                    <td style={{ color: '#94a3b8' }}>{new Date(inq.created_at).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{inq.name}</td>
                                    <td style={{ color: '#cbd5e1' }}>{inq.company}</td>
                                    <td>
                                        <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{inq.phone}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{inq.email}</div>
                                    </td>
                                    <td style={{ color: '#a3b734' }}>
                                        {inq.user_id
                                            ? (inq.profiles?.email || `${inq.email} (회원)`)
                                            : '비회원'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusStyle(inq.status)}`}>
                                            {inq.status === 'answered' ? '답변 완료' : '대기 중'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn"
                                            style={{ padding: '6px 12px' }}
                                            onClick={() => setSelectedInquiry(inq)}
                                        >
                                            {inq.status === 'answered' ? '보기/수정' : '답변하기'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Reply Modal */}
            {selectedInquiry && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedInquiry(null)}>
                    <div
                        className="admin-card"
                        style={{
                            width: '90%', maxWidth: '600px', padding: '32px',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>문의 상세 정보</h2>
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.9rem' }}>
                                <div style={{ color: '#94a3b8' }}>발신자:</div>
                                <div>{selectedInquiry.name} ({selectedInquiry.email})</div>
                                <div style={{ color: '#94a3b8' }}>업체명:</div>
                                <div style={{ fontWeight: 600 }}>{selectedInquiry.company || '-'}</div>
                                <div style={{ color: '#94a3b8' }}>연락처:</div>
                                <div style={{ color: '#a3b734', fontWeight: 600 }}>{selectedInquiry.phone || '-'}</div>
                                <div style={{ color: '#94a3b8' }}>계정:</div>
                                <div>{selectedInquiry.user_id ? (selectedInquiry.profiles?.email || `${selectedInquiry.email} (회원)`) : '해당 없음 (비회원)'}</div>
                                <div style={{ color: '#94a3b8' }}>날짜:</div>
                                <div>{new Date(selectedInquiry.created_at).toLocaleString()}</div>

                                {selectedInquiry.message.includes('[문의유형:') && (
                                    <>
                                        <div style={{ color: '#94a3b8' }}>문의 유형:</div>
                                        <div style={{ color: '#a3b734', fontWeight: 600 }}>
                                            {selectedInquiry.message.match(/\[문의유형: (.*?)\]/)?.[1] || '기타'}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px' }}>내용:</div>
                            <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {selectedInquiry.message.includes('내용:')
                                    ? selectedInquiry.message.split('내용:')[1].trim()
                                    : selectedInquiry.message}
                            </div>
                        </div>

                        <form onSubmit={handleReplySubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
                                    답변 내용
                                </label>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="여기에 답변을 작성하세요..."
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        height: '160px',
                                        resize: 'vertical',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    className="action-btn"
                                    onClick={() => setSelectedInquiry(null)}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '전송 중...' : (selectedInquiry.status === 'answered' ? '답변 수정' : '답변 전송')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryManagement;
