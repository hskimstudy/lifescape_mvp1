import React, { useState, useEffect } from 'react';
import { dbFetch } from '../dbHelper';

const ContactModal = ({ isOpen, onClose, session }) => {
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({
        type: '상세 페이지 제작',
        name: '',
        company: '',
        phone: '',
        email: '',
        message: ''
    });
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const syncProfile = async () => {
            if (session?.user) {
                setUserId(session.user.id);

                // Fetch latest profile info to autofill company/phone
                const { data } = await dbFetch('profiles', {
                    select: 'company, phone',
                    filters: { id: session.user.id }
                });

                setFormData(prev => ({
                    ...prev,
                    email: session.user.email,
                    company: (data && data[0]?.company) || prev.company,
                    phone: (data && data[0]?.phone) || prev.phone
                }));
            } else {
                setUserId(null);
            }
        };

        if (isOpen) {
            syncProfile();
        }
    }, [session, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.email || !formData.message || !formData.company || !formData.phone) {
            setErrorMessage('모든 필드를 입력해 주세요.');
            setStatus('error');
            return;
        }

        setStatus('sending');
        setErrorMessage('');

        try {
            const body = {
                name: formData.name,
                email: formData.email,
                company: formData.company,
                phone: formData.phone,
                message: formData.message,
                status: 'pending'
            };

            // Only add user_id if it's a valid-looking UUID string
            if (userId && typeof userId === 'string' && userId.length > 30) {
                body.user_id = userId;
            }

            console.log("Submitting inquiry body:", body);

            // Using dbFetch for reliability (bypassing SDK potential hangs)
            const { data, error } = await dbFetch('inquiries', {
                method: 'POST',
                body: body
            });

            if (error) {
                console.error("Inquiry submission error:", error);
                throw new Error(typeof error === 'object' ? (error.message || JSON.stringify(error)) : error);
            }

            console.log("Inquiry submission success:", data);
            setStatus('success');

            setTimeout(() => {
                onClose();
                setStatus('idle');
                setFormData({ type: '상세 페이지 제작', name: '', company: '', phone: '', email: '', message: '' });
            }, 2300);
        } catch (err) {
            console.error("handleSubmit Catch:", err);
            const msg = err.message || '데이터 전송 중 알 수 없는 오류가 발생했습니다.';
            setErrorMessage(msg);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    const types = ['상세 페이지 제작', '자사몰 제작', 'SNS 마케팅', '엔터프라이즈', '기타'];

    return (
        <div
            className="payment-overlay"
            onClick={onClose}
            style={{
                zIndex: 10000,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                className="contact-modal-v2 animate-scale-in"
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    width: '94%',
                    maxWidth: '540px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '40px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '32px',
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >✕</button>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px'
                    }}>
                        <img src="/assets/Frame.png" alt="잇다 로고" style={{ height: '36px', width: 'auto' }} />
                    </div>
                    <p style={{ fontSize: '1.15rem', color: '#333', fontWeight: '500' }}>
                        문의 사항을 작성해서 전송해 주세요.
                    </p>
                </div>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#a3b734',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            color: '#fff', fontSize: '32px'
                        }}>✓</div>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#333' }}>성공적으로 전송되었습니다!</p>
                        <p style={{ color: '#666', marginTop: '8px' }}>최대한 빨리 답변 드리겠습니다.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Inquiry Type */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexDirection: 'column' }}>
                                <label style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1a1a', minWidth: '80px' }}>문의 유형</label>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {types.map(t => (
                                        <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                border: formData.type === t ? 'none' : '2px solid #ddd',
                                                backgroundColor: formData.type === t ? '#3b82f6' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {formData.type === t && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="type"
                                                value={t}
                                                checked={formData.type === t}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                style={{ display: 'none' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: formData.type === t ? '#3b82f6' : '#666', fontWeight: formData.type === t ? '600' : '400' }}>{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group-v2">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>성함</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="성함을 입력해 주세요."
                                    style={{
                                        width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #f0f0f0',
                                        backgroundColor: '#fafafa', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="input-group-v2">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>업체명</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="업체명을 입력해 주세요."
                                    style={{
                                        width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #f0f0f0',
                                        backgroundColor: '#fafafa', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="input-group-v2">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>전화번호</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="연락 가능한 전화번호를 입력해 주세요."
                                    style={{
                                        width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #f0f0f0',
                                        backgroundColor: '#fafafa', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="input-group-v2">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>이메일</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="답변 알림을 받으실 이메일을 입력해 주세요."
                                    style={{
                                        width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #f0f0f0',
                                        backgroundColor: '#fafafa', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="input-group-v2">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>문의 내용</label>
                                <textarea
                                    required
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="어떤 점이 궁금하신가요?"
                                    style={{
                                        width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f0f0f0',
                                        backgroundColor: '#fafafa', fontSize: '1rem', outline: 'none', height: '120px',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div style={{ color: '#ff4d4f', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>
                                {errorMessage}
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                style={{
                                    backgroundColor: '#a3b734',
                                    color: '#000',
                                    border: 'none',
                                    padding: '14px 60px',
                                    borderRadius: '100px',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    opacity: status === 'sending' ? 0.7 : 1
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {status === 'sending' ? '제출 중...' : '제출하기'}
                            </button>
                        </div>

                        {/* Notices */}
                        <div style={{
                            marginTop: '32px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            lineHeight: '1.5'
                        }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ marginBottom: '6px', display: 'flex', gap: '6px' }}>
                                    <span style={{ flexShrink: 0 }}>1.</span>
                                    <span>당일 18시 이후 문의건과 공휴일 1:1 문의는 문의 유형과 이름/연락처/이메일 주소를 남겨 주시면 확인 후 운영시간에 통지해 드릴게요.</span>
                                </li>
                                <li style={{ marginBottom: '6px', display: 'flex', gap: '6px' }}>
                                    <span style={{ flexShrink: 0 }}>2.</span>
                                    <span>상기 운영시간은 정상근무일 기준이며, 통지예정일이 휴일인 경우 다음 정상 근무일에 진행 되어요.</span>
                                </li>
                                <li style={{ marginBottom: '6px', display: 'flex', gap: '6px' }}>
                                    <span style={{ flexShrink: 0 }}>3.</span>
                                    <span>주문 취소 및 변경 문의는 답변 시점에 따라 처리가 어려울 수 있어요.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '6px' }}>
                                    <span style={{ flexShrink: 0 }}>4.</span>
                                    <span>문의에 대한 답변은 마이페이지 내의 문의내역 메뉴에서 확인하실 수 있어요.</span>
                                </li>
                            </ul>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ContactModal;

