import React from 'react';

const Footer = () => {
    return (
        <footer className="landing-footer-v3">
            <div className="footer-inner">

                {/* Left: General Info */}
                <div className="footer-col footer-col-left">
                    <strong style={{ color: '#333' }}>라이프스케이프 주식회사 (LifeScape Inc.)</strong><br />
                    사업자등록번호 : 863-88-02746<br />
                    대표 : 김린아<br />
                    주소 : 서울시 송파구 중대로 135, IT벤처타워 11층(서관) 송파ICT 청년창업지원센터
                </div>

                {/* Center: Contact Info */}
                <div className="footer-col footer-col-center">
                    <strong style={{ color: '#333' }}>Customer Support</strong><br />
                    이메일 : <a href="mailto:lifescape@lifescape.kr" style={{ color: '#666', textDecoration: 'none' }}>lifescape@lifescape.kr</a><br />
                    대표번호 : 010-7371-4116
                </div>

                {/* Right: Brand and Copyright */}
                <div className="footer-col footer-col-right">
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/assets/Vector.png" alt="잇다 심볼" style={{ height: '40px', width: 'auto' }} />
                        <img src="/assets/Frame.png" alt="잇다 텍스트 로고" style={{ height: '40px', width: 'auto' }} />
                    </div>
                    <p className="footer-copyright" style={{ fontSize: '0.85rem', color: '#666' }}>&copy; LifeScape, Inc. All rights reserved.</p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
