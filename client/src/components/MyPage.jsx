import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { dbFetch, authFetch, adminDeleteUserFull } from '../dbHelper';

const MyPage = ({ session, showToast, onLogout }) => {
    const navigate = useNavigate();
    const [inquiries, setInquiries] = useState([]);
    const [generations, setGenerations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [credits, setCredits] = useState(0);
    const [userPlan, setUserPlan] = useState('free');
    const [isDownloading, setIsDownloading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
    const [pendingDownload, setPendingDownload] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [fbRating, setFbRating] = useState(5);
    const [fbText, setFbText] = useState('');
    const [fbHideForWeek, setFbHideForWeek] = useState(false);
    const [inquiryLoading, setInquiryLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Identify if the user is a social login (OTP/Social users don't have passwords in ITDA)
    const isOAuthUser = session?.user?.app_metadata?.provider && session?.user?.app_metadata?.provider !== 'email';
    const [activeTab, setActiveTab] = useState('history'); // history | payment | inquiry | info
    const [viewLikedOnly, setViewLikedOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);

    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalConfirmText, setWithdrawalConfirmText] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, viewLikedOnly]);

    useEffect(() => {
        if (session?.user) {
            fetchUserData();
            fetchInquiries();
            fetchGenerations();
            fetchPayments();
        } else {
            navigate('/');
        }
    }, [session]);

    const fetchUserData = async () => {
        try {
            // Use dbFetch for consistent behavior across components
            const { data, error } = await dbFetch('profiles', {
                select: 'credits,plan',
                filters: { id: session.user.id }
            });

            if (data && data.length > 0) {
                const profile = data[0];
                setCredits(profile.credits ?? 0);
                setUserPlan(profile.plan || 'free');
            } else if (error) {
                console.error("fetchUserData error:", error);
                // Fallback attempt
                const { data: fallback } = await dbFetch('profiles', {
                    select: 'credits',
                    filters: { id: session.user.id }
                });
                if (fallback && fallback.length > 0) {
                    setCredits(fallback[0].credits ?? 0);
                }
            }
        } catch (e) {
            console.error("fetchUserData exception:", e);
        }
    };

    const fetchInquiries = async () => {
        if (!session?.user) return;
        setInquiryLoading(true);
        console.log("MyPage: Fetching inquiries for user:", session.user.id);

        try {
            const { data, error } = await dbFetch('inquiries', {
                select: '*',
                filters: {
                    user_id: session.user.id,
                    status: 'neq.feedback' // Exclude feedbacks from history
                },
                order: 'created_at.desc'
            });

            if (error) {
                console.error('MyPage: Fetch error:', error);
            } else if (data) {
                console.log(`MyPage: Successfully fetched ${data.length} inquiries.`);
                setInquiries(data);
            }
        } catch (err) {
            console.error("MyPage: fetchInquiries exception:", err);
        } finally {
            setInquiryLoading(false);
        }
    };

    const fetchGenerations = async () => {
        setLoading(true);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        try {
            const { data, error } = await dbFetch('generations', {
                select: '*',
                filters: { user_id: session.user.id },
                order: 'created_at.desc'
            });

            if (error) {
                console.error('Error fetching generations:', error);
            } else if (data) {
                const filteredData = data.filter(item => {
                    const itemDate = new Date(item.created_at);
                    if (item.is_favorite) {
                        return itemDate >= oneYearAgo;
                    } else {
                        return itemDate >= sevenDaysAgo;
                    }
                });
                setGenerations(filteredData);
            }
        } catch (err) {
            console.error('Exception fetching generations:', err);
        }
        setLoading(false);
    };

    const fetchPayments = async () => {
        if (!session?.user) return;
        setPaymentLoading(true);
        try {
            const { data, error } = await dbFetch('payments', {
                select: '*',
                filters: { user_email: session.user.email },
                order: 'created_at.desc'
            });
            if (error) {
                console.error('MyPage: Payment fetch error:', error);
            } else if (data) {
                setPayments(data);
            }
        } catch (err) {
            console.error("MyPage: fetchPayments exception:", err);
        } finally {
            setPaymentLoading(false);
        }
    };

    const deductCredits = async (amount) => {
        if (!amount || typeof amount !== 'number') return false;
        try {
            const { data, error: fetchError } = await dbFetch('profiles', {
                select: 'credits',
                filters: { id: session.user.id }
            });
            if (fetchError || !data || data.length === 0) return false;
            const latest = parseInt(data[0].credits) || 0;
            const newVal = Math.max(0, latest - amount);
            const { error: patchError } = await dbFetch('profiles', {
                method: 'PATCH',
                filters: { id: session.user.id },
                body: { credits: newVal }
            });
            if (!patchError) {
                setCredits(newVal);
                return true;
            }
            return false;
        } catch (err) {
            console.error("deductCredits error:", err);
            return false;
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword)) {
            setPasswordError('비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.');
            return;
        }

        setIsPasswordChanging(true);
        setPasswordError('');
        try {
            const token = session?.access_token || session?.session?.access_token || (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!token) throw new Error("인증 정보가 만료되었습니다. 다시 로그인 해 주세요.");

            const { error } = await authFetch('user', {
                method: 'PUT',
                token: token,
                body: { password: newPassword }
            });

            if (error) {
                if (error.status === 422 && (error.code === 'same_password' || error.error_code === 'same_password')) {
                    setPasswordError('이전에 사용한 비밀번호와 동일합니다.');
                    return;
                }
                throw error;
            }

            // Reset state and close modal before blocking alert
            setIsPasswordChanging(false);
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            if (window.showToast) window.showToast('비밀번호가 성공적으로 변경되었습니다.');
            else if (showToast) showToast('비밀번호가 성공적으로 변경되었습니다.');
        } catch (err) {
            console.error('Password change error:', err);
            setPasswordError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setIsPasswordChanging(false);
        }
    };

    const handleWithdrawal = async () => {
        if (withdrawalConfirmText !== '탈퇴확인') {
            if (window.showToast) window.showToast("'탈퇴확인'을 정확히 입력해주세요.", 'error');
            else alert("'탈퇴확인'을 정확히 입력해주세요.");
            return;
        }

        console.log("Withdrawal: Starting process for", session?.user?.id);
        setIsWithdrawing(true);
        try {
            // Use the comprehensive deletion helper
            console.log("Withdrawal: Triggering full account deletion...");
            await adminDeleteUserFull(session.user.id, session.user.email);
            console.log("Withdrawal: Data and account deleted successfully");

            // Log out using the global handler
            if (onLogout) {
                console.log("Withdrawal: Triggering global onLogout");
                await onLogout();
            } else {
                console.log("Withdrawal: Fallback signOut");
                await supabase.auth.signOut();
            }

            console.log("Withdrawal: Process complete");
            if (window.showToast) window.showToast('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
            navigate('/');
        } catch (err) {
            console.error('Withdrawal error:', err);
            const msg = (err && err.message) ? err.message : "회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 서버가 안정된 뒤 다시 시도해주세요.";
            if (window.showToast) window.showToast(msg, 'error');
            else alert(msg);
        } finally {
            console.log("Withdrawal: finally block");
            setIsWithdrawing(false);
        }
    };

    const toggleFavorite = async (id, currentStatus) => {
        const nextStatus = !currentStatus;

        // Optimistic update
        setGenerations(prev => prev.map(item => item.id === id ? { ...item, is_favorite: nextStatus } : item));

        const { error } = await dbFetch('generations', {
            method: 'PATCH',
            filters: { id: id },
            body: { is_favorite: nextStatus }
        });

        if (error) {
            // Revert state on error
            setGenerations(prev => prev.map(item => item.id === id ? { ...item, is_favorite: currentStatus } : item));
            if (showToast) showToast('오류가 발생했습니다. 다시 시도해 주세요.', 'error');
        }
    };

    const handleDownload = async (imageUrl, imageId) => {
        if (credits < 5) {
            alert('다운로드하려면 5 크레딧이 필요합니다. 결제 탭에서 충전해주세요.');
            setActiveTab('payment');
            return;
        }

        setPendingDownload({ url: imageUrl, id: imageId });
        setShowDownloadConfirmModal(true);
    };

    const executeDownload = async () => {
        if (!pendingDownload) return;
        const { url: imageUrl, id: imageId } = pendingDownload;

        setIsDownloading(true);
        setShowDownloadConfirmModal(false);
        if (showToast) showToast('다운로드를 시작합니다...');

        try {
            const success = await deductCredits(5);
            if (!success) {
                alert('크레딧 차감에 실패했습니다. 다시 시도해 주세요.');
                setIsDownloading(false);
                return;
            }

            const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            // Extract extension or default to png
            const extension = imageUrl.split('.').pop().split('?')[0] || 'png';
            a.download = `itda_result_${imageId || Date.now()}.${extension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                if (document.body.contains(a)) document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
                if (showToast) showToast('갤러리에 저장되었습니다! ✨');

                // Show feedback modal logic
                const hideUntil = localStorage.getItem('itda_feedback_hide_until');
                const now = new Date().getTime();
                if (!hideUntil || now > parseInt(hideUntil)) {
                    setFbRating(5);
                    setFbText('');
                    setShowFeedbackModal(true);
                }
            }, 2000); // 2s is safer for cleanup
        } catch (error) {
            console.error('Download failed, trying fallback:', error);
            try {
                const a = document.createElement('a');
                a.href = imageUrl;
                const extension = imageUrl.split('.').pop().split('?')[0] || 'png';
                a.download = `itda_result_${imageId || Date.now()}.${extension}`;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    if (document.body.contains(a)) document.body.removeChild(a);
                }, 1000);
            } catch {
                if (window.showToast) window.showToast('다운로드 중 오류가 발생했습니다.', 'error');
                else alert('다운로드 중 오류가 발생했습니다.');
            }
        } finally {
            setIsDownloading(false);
            setPendingDownload(null);
        }
    };

    const filteredGenerations = viewLikedOnly
        ? generations.filter(g => g.is_favorite)
        : generations;

    return (
        <main className="itda-mypage-container">
            {/* Tab Bar */}
            <div className="itda-tab-bar">
                <button
                    className={`itda-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    히스토리
                </button>
                <button
                    className={`itda-tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment')}
                >
                    결제 관리
                </button>
                <button
                    className={`itda-tab-btn ${activeTab === 'inquiry' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inquiry')}
                >
                    문의 내역
                </button>
                <button
                    className={`itda-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    내 정보
                </button>
            </div>

            {activeTab === 'history' && (
                <section className="itda-history-section">
                    <div className="itda-history-header">
                        <div className="itda-history-title">
                            <h2>{viewLikedOnly ? '좋아요한 사진' : '최근 7일간 생성 기록'}</h2>
                            <p>좋아요 누른 생성 사진은 최대 1년까지 보관할 수 있어요.</p>
                        </div>
                        <button
                            className="itda-toggle-liked"
                            onClick={() => setViewLikedOnly(!viewLikedOnly)}
                        >
                            {viewLikedOnly ? '전체 보기' : '좋아요만 보기'}
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--itda-text-muted)' }}>기록을 불러오는 중...</div>
                    ) : filteredGenerations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--itda-text-muted)', background: 'var(--itda-card-bg)', borderRadius: '20px' }}>
                            <p>{viewLikedOnly ? '좋아요 표시한 이미지가 없습니다.' : '생성 기록이 없습니다.'}</p>
                        </div>
                    ) : (
                        <div className="itda-history-grid">
                            {filteredGenerations.slice((currentPage - 1) * 12, currentPage * 12).map((gen) => (
                                <div key={gen.id} className="itda-history-card">
                                    <img src={gen.url} alt="Generated" />
                                    <button
                                        className="itda-card-download-btn"
                                        disabled={isDownloading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(gen.url, gen.id);
                                        }}
                                    >
                                        {isDownloading ? '...' : '↓'}
                                    </button>
                                    <button
                                        className={`itda-history-heart-btn ${gen.is_favorite ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(gen.id, gen.is_favorite);
                                        }}
                                    >
                                        {gen.is_favorite ? '💚' : '🤍'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination UI */}
                    {filteredGenerations.length > 12 && (
                        <div className="itda-pagination">
                            <button
                                className="itda-page-arrow"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                〈
                            </button>
                            {Array.from({ length: Math.ceil(filteredGenerations.length / 12) }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    className={`itda-page-dot ${currentPage === num ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(num)}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                className="itda-page-arrow"
                                disabled={currentPage === Math.ceil(filteredGenerations.length / 12)}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredGenerations.length / 12), prev + 1))}
                            >
                                〉
                            </button>
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'inquiry' && (
                <section className="itda-inquiries-section">
                    <div className="itda-history-header">
                        <div className="itda-history-title">
                            <h2>문의 내역</h2>
                            <p>접수된 문의사항의 답변을 확인하실 수 있습니다.</p>
                        </div>
                        <button
                            className="itda-toggle-liked"
                            onClick={fetchInquiries}
                            disabled={inquiryLoading}
                        >
                            {inquiryLoading ? '불러오는 중...' : '새로고침 ↻'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {inquiryLoading && inquiries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--itda-text-muted)' }}>
                                기록을 불러오는 중...
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--itda-text-muted)', background: 'var(--itda-card-bg)', borderRadius: '20px' }}>
                                문의 내역이 없습니다.
                            </div>
                        ) : (
                            inquiries.map((inq) => (
                                <div key={inq.id} style={{
                                    background: 'var(--itda-card-bg)',
                                    border: '1px solid var(--itda-border)',
                                    borderRadius: '16px',
                                    padding: '24px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ color: 'var(--itda-text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(inq.created_at).toLocaleDateString()}
                                        </div>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            background: inq.status === 'answered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: inq.status === 'answered' ? '#10b981' : '#f59e0b',
                                            border: `1px solid ${inq.status === 'answered' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                        }}>
                                            {inq.status === 'answered' ? '답변 완료' : '답변 대기'}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        {inq.message.includes('[문의유형:') && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                background: 'rgba(163, 183, 52, 0.2)',
                                                color: 'var(--itda-lime)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                marginRight: '8px',
                                                fontWeight: 600
                                            }}>
                                                {inq.message.match(/\[문의유형: (.*?)\]/)?.[1] || '문의'}
                                            </span>
                                        )}
                                        <div style={{ color: '#fff', marginTop: '8px', fontWeight: 500, lineHeight: 1.5 }}>
                                            {inq.message.includes('내용:')
                                                ? inq.message.split('내용:')[1].trim()
                                                : inq.message}
                                        </div>
                                    </div>
                                    {inq.status === 'answered' && inq.reply && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--itda-lime)', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                                            <div style={{ color: 'var(--itda-lime)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>운영자 답변:</div>
                                            <div style={{ color: '#ccc', lineHeight: 1.5 }}>{inq.reply}</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'payment' && (
                <section className="itda-payment-section">
                    <div className="itda-history-header">
                        <div className="itda-history-title">
                            <h2>결제 관리</h2>
                            <p>현재 플랜 상태를 확인하고 업그레이드할 수 있습니다.</p>
                        </div>
                    </div>

                    {/* Current Plan Status */}
                    <div style={{
                        background: 'var(--itda-card-bg)',
                        borderRadius: '20px',
                        border: '1px solid var(--itda-border)',
                        padding: '32px',
                        marginBottom: '28px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--itda-text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>현재 플랜</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        fontSize: '1.6rem',
                                        fontWeight: 800,
                                        color: userPlan === 'pro' ? '#f59e0b' : userPlan === 'basic' ? '#3b82f6' : '#94a3b8'
                                    }}>
                                        {userPlan === 'pro' ? '✨ Studio' : userPlan === 'basic' ? '🪙 Single' : 'Free'}
                                    </span>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: userPlan === 'pro' ? 'rgba(245,158,11,0.15)' : userPlan === 'basic' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                        color: userPlan === 'pro' ? '#f59e0b' : userPlan === 'basic' ? '#3b82f6' : '#94a3b8'
                                    }}>
                                        활성화됨
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--itda-text-muted)', marginBottom: '4px' }}>남은 크레딧</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--itda-lime)' }}>{credits}</div>
                            </div>
                        </div>

                        {/* Plan Features */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                            {[
                                { label: '고화질 이미지 생성', unlocked: userPlan === 'pro' },
                                { label: '이미지 생성', unlocked: true },
                                { label: '상세 수정 프롬프트', unlocked: true },
                            ].map((feat, i) => (
                                <span key={i} style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    background: feat.unlocked ? 'rgba(163,230,53,0.1)' : 'rgba(255,255,255,0.05)',
                                    color: feat.unlocked ? 'var(--itda-lime)' : 'var(--itda-text-muted)',
                                    border: `1px solid ${feat.unlocked ? 'rgba(163,230,53,0.2)' : 'rgba(255,255,255,0.08)'}`
                                }}>
                                    {feat.unlocked ? '✓' : '🔒'} {feat.label}
                                </span>
                            ))}
                        </div>

                        {/* Upgrade Cards */}
                        {userPlan !== 'pro' && (
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--itda-text-muted)', marginBottom: '16px', fontWeight: 600 }}>플랜 업그레이드</div>
                                <div style={{ display: 'grid', gridTemplateColumns: userPlan === 'free' ? '1fr 1fr' : '1fr', gap: '16px' }}>
                                    {userPlan === 'free' && (
                                        <div
                                            onClick={async () => {
                                                if (paymentLoading) return;
                                                if (!window.IMP) { alert('결제 모듈을 불러오지 못했습니다.'); return; }

                                                window.IMP.init('imp46237155');
                                                const orderId = `AO09C_${Date.now()}`;

                                                window.IMP.request_pay({
                                                    pg: 'kcp.AO09C', pay_method: 'card', merchant_uid: orderId,
                                                    name: 'Single Plan - 50 Credits - Lifescape', amount: 24900,
                                                    buyer_email: session.user.email, m_redirect_url: window.location.origin
                                                }, async (rsp) => {
                                                    if (rsp.success) {
                                                        setPaymentLoading(true);
                                                        try {
                                                            // Fetch latest credits to avoid stale state issues
                                                            const { data } = await dbFetch('profiles', { select: 'credits', filters: { id: session.user.id } });
                                                            const latestCredits = data?.[0]?.credits || 0;
                                                            const newTotal = latestCredits + 50;

                                                            await dbFetch('profiles', {
                                                                method: 'PATCH',
                                                                filters: { id: session.user.id },
                                                                body: { credits: newTotal, plan: 'basic' }
                                                            });

                                                            await dbFetch('payments', {
                                                                method: 'POST',
                                                                body: {
                                                                    user_email: session.user.email,
                                                                    amount: 24900,
                                                                    credits: 50,
                                                                    plan: 'basic',
                                                                    imp_uid: rsp.imp_uid,
                                                                    merchant_uid: orderId,
                                                                    status: 'completed'
                                                                }
                                                            });

                                                            setCredits(newTotal);
                                                            setUserPlan('basic');
                                                            if (showToast) showToast('Single 플랜으로 업그레이드되었습니다! 50 크레딧 충전!');
                                                            fetchPayments();
                                                        } catch (err) {
                                                            console.error("Upgrade error:", err);
                                                            alert('결제는 완료되었으나 정보 업데이트 중 오류가 발생했습니다. 고객센터로 문의주세요.');
                                                        } finally {
                                                            setPaymentLoading(false);
                                                        }
                                                    } else {
                                                        if (showToast) showToast(`결제 실패: ${rsp.error_msg}`, 'error');
                                                    }
                                                });
                                            }}
                                            style={{
                                                background: 'rgba(59,130,246,0.08)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                borderRadius: '16px',
                                                padding: '24px',
                                                cursor: paymentLoading ? 'default' : 'pointer',
                                                opacity: paymentLoading ? 0.7 : 1,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>🪙</span>
                                                <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '1.1rem' }}>Single</span>
                                            </div>
                                            <div style={{ color: '#3b82f6', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>24,900원</div>
                                            <div style={{ color: 'var(--itda-text-muted)', fontSize: '0.85rem' }}>크레딧 50개 지급</div>
                                        </div>
                                    )}
                                    <div
                                        onClick={async () => {
                                            if (paymentLoading) return;
                                            if (!window.IMP) { alert('결제 모듈을 불러오지 못했습니다.'); return; }

                                            window.IMP.init('imp46237155');
                                            const orderId = `AO09C_${Date.now()}`;

                                            window.IMP.request_pay({
                                                pg: 'kcp.AO09C', pay_method: 'card', merchant_uid: orderId,
                                                name: 'Studio Plan - 1000 Credits - Lifescape', amount: 249000,
                                                buyer_email: session.user.email, m_redirect_url: window.location.origin
                                            }, async (rsp) => {
                                                if (rsp.success) {
                                                    setPaymentLoading(true);
                                                    try {
                                                        const { data } = await dbFetch('profiles', { select: 'credits', filters: { id: session.user.id } });
                                                        const latestCredits = data?.[0]?.credits || 0;
                                                        const newTotal = latestCredits + 1000;

                                                        await dbFetch('profiles', {
                                                            method: 'PATCH',
                                                            filters: { id: session.user.id },
                                                            body: { credits: newTotal, plan: 'pro' }
                                                        });

                                                        await dbFetch('payments', {
                                                            method: 'POST',
                                                            body: {
                                                                user_email: session.user.email,
                                                                amount: 249000,
                                                                credits: 1000,
                                                                plan: 'pro',
                                                                imp_uid: rsp.imp_uid,
                                                                merchant_uid: orderId,
                                                                status: 'completed'
                                                            }
                                                        });

                                                        setCredits(newTotal);
                                                        setUserPlan('pro');
                                                        if (showToast) showToast('Studio 플랜으로 업그레이드되었습니다! 1000 크레딧 충전!');
                                                        fetchPayments();
                                                    } catch (err) {
                                                        console.error("Upgrade error:", err);
                                                        alert('결제는 완료되었으나 정보 업데이트 중 오류가 발생했습니다. 고객센터로 문의주세요.');
                                                    } finally {
                                                        setPaymentLoading(false);
                                                    }
                                                } else {
                                                    if (showToast) showToast(`결제 실패: ${rsp.error_msg}`, 'error');
                                                }
                                            });
                                        }}
                                        style={{
                                            background: 'rgba(245,158,11,0.08)',
                                            border: '1px solid rgba(245,158,11,0.2)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            cursor: paymentLoading ? 'default' : 'pointer',
                                            opacity: paymentLoading ? 0.7 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>✨</span>
                                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>Studio</span>
                                            <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>BEST</span>
                                        </div>
                                        <div style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>249,000원</div>
                                        <div style={{ color: 'var(--itda-text-muted)', fontSize: '0.85rem' }}>크레딧 1,000개 + 고화질 이미지 생성</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {userPlan === 'pro' && (
                            <div style={{ textAlign: 'center', color: 'var(--itda-text-muted)', fontSize: '0.9rem', padding: '8px' }}>
                                ✅ 최고 플랜을 사용 중입니다
                            </div>
                        )}
                    </div>

                    {/* Payment History */}
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>결제 내역</h3>
                    </div>
                    <div className="itda-payment-table-container" style={{ background: 'var(--itda-card-bg)', borderRadius: '20px', border: '1px solid var(--itda-border)', overflow: 'hidden' }}>
                        {paymentLoading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--itda-text-muted)' }}>결제 내역을 불러오는 중...</div>
                        ) : payments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--itda-text-muted)' }}>결제 내역이 없습니다.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--itda-text-muted)', fontSize: '0.85rem', textAlign: 'left' }}>
                                        <th style={{ padding: '16px 24px' }}>날짜</th>
                                        <th style={{ padding: '16px 24px' }}>상품 / 플랜</th>
                                        <th style={{ padding: '16px 24px' }}>금액</th>
                                        <th style={{ padding: '16px 24px' }}>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(pay => (
                                        <tr key={pay.id} style={{ borderTop: '1px solid var(--itda-border)' }}>
                                            <td style={{ padding: '16px 24px', color: 'var(--itda-text-muted)', fontSize: '0.9rem' }}>
                                                {new Date(pay.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    background: pay.plan === 'pro' ? 'rgba(245,158,11,0.15)' : pay.plan === 'basic' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                                    color: pay.plan === 'pro' ? '#f59e0b' : pay.plan === 'basic' ? '#3b82f6' : '#94a3b8',
                                                    marginRight: '8px'
                                                }}>
                                                    {pay.plan === 'pro' ? 'Pro' : pay.plan === 'basic' ? 'Basic' : pay.plan}
                                                </span>
                                                {pay.credits}크레딧
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>₩{pay.amount?.toLocaleString()}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: pay.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: pay.status === 'completed' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {pay.status === 'completed' ? '결제 완료' : pay.status === 'failed' ? '실패' : pay.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'info' && (
                <section className="itda-info-section">
                    <div className="itda-history-header">
                        <div className="itda-history-title">
                            <h2>내 정보</h2>
                            <p>계정 설정 및 회원 정보를 관리할 수 있습니다.</p>
                        </div>
                    </div>

                    <div style={{ background: 'var(--itda-card-bg)', borderRadius: '24px', border: '1px solid var(--itda-border)', padding: '40px' }}>
                        <div style={{ marginBottom: '40px' }}>
                            <label style={{ display: 'block', color: 'var(--itda-text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>계정 정보</label>

                            {/* Email Row */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>이메일</span>
                                <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>{session?.user?.email}</span>
                            </div>

                            {/* Password Row (Hide for Social Logins) */}
                            {!isOAuthUser ? (
                                <div
                                    onClick={() => setShowPasswordModal(true)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '24px 0', cursor: 'pointer', transition: 'all 0.2s ease'
                                    }}
                                    className="itda-info-row"
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>비밀번호</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: 'var(--itda-lime)', fontSize: '0.9rem', fontWeight: 700 }}>변경하기</span>
                                        <span style={{ color: 'var(--itda-lime)', fontSize: '1.4rem', lineHeight: 1 }}>›</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '24px 0', opacity: 0.6
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>비밀번호</span>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>소셜 계정은 해당 서비스에서 변경해 주세요.</span>
                                </div>
                            )}
                        </div>

                        <div style={{
                            marginTop: '40px',
                            paddingTop: '32px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>회원 탈퇴</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                    탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWithdrawalModal(true)}
                                style={{
                                    background: 'rgba(255, 77, 77, 0.1)',
                                    color: '#ff4d4d',
                                    border: '1px solid rgba(255, 77, 77, 0.2)',
                                    padding: '10px 18px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 77, 77, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.2)';
                                }}
                            >
                                서비스 탈퇴
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="itda-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="itda-modal-content" style={{
                        background: '#1a1a1a', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid var(--itda-border)'
                    }}>
                        <h2 style={{ color: '#fff', marginBottom: '24px' }}>비밀번호 변경</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--itda-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>새 비밀번호</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="8자 이상 (영문 대소문자, 숫자, 특수문자 포함)"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#2a2a2a', border: '1px solid var(--itda-border)', color: '#fff' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: 'var(--itda-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 재입력"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#2a2a2a', border: '1px solid var(--itda-border)', color: '#fff' }}
                                    required
                                />
                            </div>
                            {passwordError && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '16px' }}>{passwordError}</p>}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--itda-border)', color: '#fff', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPasswordChanging}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--itda-lime)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {isPasswordChanging ? '변경 중...' : '변경하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {showWithdrawalModal && (
                <div className="itda-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="itda-modal-content" style={{
                        background: '#1a1a1a', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid var(--itda-border)'
                    }}>
                        <h2 style={{ color: '#ff4d4d', marginBottom: '16px' }}>정말 탈퇴하시겠습니까?</h2>
                        <p style={{ color: 'var(--itda-text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
                            탈퇴 후에는 모든 데이터가 영구 삭제되며, 동일 이메일로 재가입하더라도 이전 기록은 복구할 수 없습니다.
                            <br /><br />
                            확인을 위해 아래에 <strong>탈퇴확인</strong>을 입력해주세요.
                        </p>
                        <input
                            type="text"
                            value={withdrawalConfirmText}
                            onChange={(e) => setWithdrawalConfirmText(e.target.value)}
                            placeholder="탈퇴확인"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#2a2a2a', border: '1px solid var(--itda-border)', color: '#fff', marginBottom: '24px' }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowWithdrawalModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--itda-border)', color: '#fff', cursor: 'pointer' }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleWithdrawal}
                                disabled={isWithdrawing || withdrawalConfirmText !== '탈퇴확인'}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', background: withdrawalConfirmText === '탈퇴확인' ? '#ff4d4d' : '#333',
                                    color: '#fff', border: 'none', fontWeight: 700, cursor: withdrawalConfirmText === '탈퇴확인' ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isWithdrawing ? '처리 중...' : '탈퇴하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Download Confirmation Modal (User Request Sync) */}
            {showDownloadConfirmModal && (
                <div className="itda-download-confirm-overlay" onClick={() => setShowDownloadConfirmModal(false)}>
                    <div className="itda-download-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="itda-dc-logo">
                            <img src="/assets/Frame.png" alt="잇다" style={{ height: '32px', width: 'auto' }} />
                        </div>
                        <button className="itda-dc-close" onClick={() => setShowDownloadConfirmModal(false)}>&times;</button>

                        <h2 className="itda-dc-title">다운로드하시겠어요?</h2>
                        <p className="itda-dc-subtitle">다운로드한 이미지는 최대 1년까지 보관할 수 있어요.</p>

                        <div className="itda-dc-credit-box">
                            <div className="itda-dc-credit-row">
                                현재 보유한 크레딧: <span className="itda-dc-credit-value">{credits}</span>
                            </div>
                            <div className="itda-dc-credit-row">
                                사용 후 크레딧: <span className="itda-dc-credit-value" style={{ color: '#3b82f6' }}>{credits - 5}</span>
                            </div>
                        </div>

                        <div className="itda-dc-actions">
                            <button className="itda-dc-btn-cancel" onClick={() => setShowDownloadConfirmModal(false)}>취소</button>
                            <button
                                className="itda-dc-btn-download"
                                disabled={isDownloading}
                                onClick={executeDownload}
                            >
                                다운로드 <span className="cost-tag">-5</span> <span className="coin-icon">🪙</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback / Success Modal (User Request Sync) */}
            {showFeedbackModal && (
                <div className="itda-feedback-overlay">
                    <div className="itda-feedback-modal">
                        <div className="itda-dc-logo">
                            <img src="/assets/Frame.png" alt="잇다" style={{ height: '32px', width: 'auto' }} />
                        </div>
                        <button className="itda-dc-close" onClick={() => setShowFeedbackModal(false)}>&times;</button>

                        <h2 className="itda-fb-title">다운로드가 완료되었어요.</h2>
                        <p className="itda-fb-subtitle">방금 만든 사진 어떠셨나요? 1분 투자로 <span>무료 크레딧</span>을 받아 가세요!</p>

                        <div className="itda-fb-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`itda-fb-star ${star <= fbRating ? 'active' : ''}`}
                                    onClick={() => setFbRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <div className="itda-fb-textarea-wrap">
                            <textarea
                                className="itda-fb-textarea"
                                placeholder="아쉬운 점이나 마음에 들었던 점을 자유롭게 적어 주시면 서비스 발전에 큰 도움이 됩니다."
                                value={fbText}
                                onChange={(e) => setFbText(e.target.value)}
                            />
                        </div>

                        <div className="itda-fb-actions">
                            <button className="itda-fb-btn-home" onClick={() => {
                                if (fbHideForWeek) {
                                    const expiry = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                                    localStorage.setItem('itda_feedback_hide_until', expiry.toString());
                                }
                                setShowFeedbackModal(false);
                            }}>
                                메인으로 이동
                            </button>
                            <button className="itda-fb-btn-submit" onClick={() => {
                                if (fbHideForWeek) {
                                    const expiry = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                                    localStorage.setItem('itda_feedback_hide_until', expiry.toString());
                                }

                                // Close instantly for snappy feel
                                setShowFeedbackModal(false);
                                if (showToast) showToast('피드백을 제출 중입니다...');

                                // Process in background
                                (async () => {
                                    try {
                                        await dbFetch('inquiries', {
                                            method: 'POST',
                                            body: {
                                                user_id: session.user.id,
                                                name: session.user.email.split('@')[0],
                                                email: session.user.email,
                                                message: `[별점: ${fbRating}점]\n\n피드백 내용:\n${fbText || '(내용 없음)'}`,
                                                status: 'feedback'
                                            }
                                        });

                                        const { data: profile } = await dbFetch('profiles', {
                                            select: 'credits',
                                            filters: { id: session.user.id }
                                        });
                                        if (profile && profile.length > 0) {
                                            const newCredits = (profile[0].credits || 0) + 1;
                                            await dbFetch('profiles', {
                                                method: 'PATCH',
                                                filters: { id: session.user.id },
                                                body: { credits: newCredits }
                                            });
                                            setCredits(newCredits);
                                            if (showToast) showToast('피드백 보상 +1 크레딧 지급 완료! 🪙');
                                        }
                                    } catch (e) {
                                        console.error('Feedback background error:', e);
                                    }
                                })();
                            }}>
                                제출하기 <span className="bonus">+1</span> <span className="coin-icon">🪙</span>
                            </button>
                        </div>

                        <label className="itda-fb-dontshow">
                            <input
                                type="checkbox"
                                checked={fbHideForWeek}
                                onChange={(e) => setFbHideForWeek(e.target.checked)}
                            />
                            7일 동안 다시 보지 않기
                        </label>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MyPage;
