import React, { useState } from 'react';
import { dbFetch } from '../dbHelper';

export default function Onboarding({ session, onComplete, showToast }) {
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!company.trim() || !phone.trim()) {
            if (showToast) showToast('모든 정보를 입력해 주세요.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await dbFetch('profiles', {
                method: 'PATCH',
                filters: { id: session.user.id },
                body: {
                    company: company.trim(),
                    phone: phone.trim()
                }
            });

            if (error) throw error;

            if (showToast) showToast('정보가 저장되었습니다.');
            onComplete();
        } catch (error) {
            console.error('Onboarding Error:', error);
            if (showToast) showToast(error.message || '정보 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container-v2">
            <div className="itda-login-logo">
                <img src="/assets/Vector.png" alt="Symbol" className="symbol" />
            </div>

            <div className="auth-header-text-v2">
                <p>환영합니다!</p>
                <p>원활한 서비스 이용을 위해 추가 정보를 입력해 주세요.</p>
            </div>

            <div className="auth-card-v2">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="auth-field-v2">
                        <label className="auth-label-v2">업체명</label>
                        <input
                            type="text"
                            className="auth-input-v2"
                            placeholder="업체명을 입력하세요. ex) 라이프스케이프(주)"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field-v2">
                        <label className="auth-label-v2">전화번호</label>
                        <input
                            type="tel"
                            className="auth-input-v2"
                            placeholder="전화번호를 입력하세요. ex) 010-1234-5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`auth-btn-v2 ${company.trim() && phone.trim() ? 'active' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '시작하기'}
                    </button>
                </form>
            </div>

            <div className="auth-footer-copyright">
                © LifeScape, Inc. All rights reserved.
            </div>
        </div>
    );
}
