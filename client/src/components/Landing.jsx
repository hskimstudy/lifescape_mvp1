import React, { useState } from 'react';

import {
    HeroSection,
    FeaturesSection,
    AcquisitionSection,
    StickyStepsSection,
    ServicesSection,
    PricingSection,
    FaqSection,
    Footer,
} from './landing/index.js';
import ContactModal from './ContactModal';

const Landing = ({ onStart, session, onLogout }) => {
    const [isVisible] = useState(true);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleFaq = (idx) => {
        setExpandedFaq(expandedFaq === idx ? null : idx);
    };

    const handleLogout = async () => {
        console.log("Landing: Logout button clicked");
        await onLogout();
        console.log("Landing: After onLogout() call");
    };

    return (
        <div className={`landing-overlay ${isVisible ? 'visible' : ''}`}>

            {/* Nav */}
            <nav className="landing-nav animate-fade-down" aria-label="Main Navigation">
                <div className="nav-left-group">
                    <div className="itda-logo-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top" role="button" tabIndex={0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/assets/Vector.png" alt="잇다 로고 심볼" style={{ height: '28px', width: 'auto' }} />
                        <img src="/assets/Frame.png" alt="잇다 텍스트 로고" style={{ height: '24px', width: 'auto' }} />
                    </div>
                    <div className="nav-links desktop-only">
                        <a href="#services">메인서비스</a>
                        <a href="#pricing">요금제</a>
                        <a href="#extra-services">다른 서비스</a>
                        <a href="#faq">FAQ</a>
                    </div>
                </div>
                <div className="nav-actions desktop-only">
                    {session ? (
                        <>
                            <button className="nav-btn-outline" onClick={handleLogout} aria-label="Logout">로그아웃</button>
                            <button className="nav-btn-filled" onClick={onStart} aria-label="Start">시작하기</button>
                        </>
                    ) : (
                        <>
                            <button className="nav-btn-filled" onClick={onStart} aria-label="Sign up">회원가입</button>
                            <button className="nav-btn-outline" onClick={onStart} aria-label="Login">로그인</button>
                        </>
                    )}
                </div>
                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Mobile Nav Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-nav-overlay animate-fade-down" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="mobile-nav-content" onClick={e => e.stopPropagation()}>
                        <div className="mobile-nav-links">
                            <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>메인서비스</a>
                            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>요금제</a>
                            <a href="#extra-services" onClick={() => setIsMobileMenuOpen(false)}>다른 서비스</a>
                            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
                        </div>
                        <div className="mobile-nav-actions">
                            {session ? (
                                <>
                                    <button className="nav-btn-outline" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>로그아웃</button>
                                    <button className="nav-btn-filled" onClick={() => { onStart(); setIsMobileMenuOpen(false); }}>시작하기</button>
                                </>
                            ) : (
                                <>
                                    <button className="nav-btn-filled" onClick={() => { setIsMobileMenuOpen(false); onStart(); }}>회원가입</button>
                                    <button className="nav-btn-outline" onClick={() => { setIsMobileMenuOpen(false); onStart(); }}>로그인</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="landing-body">
                <HeroSection onStart={onStart} />
                <FeaturesSection />
                <AcquisitionSection />
                <StickyStepsSection />
                <PricingSection onContactOpen={() => setIsContactOpen(true)} />
                <ServicesSection onContactOpen={() => setIsContactOpen(true)} />
                <FaqSection expandedFaq={expandedFaq} toggleFaq={toggleFaq} />
            </main>

            <Footer />

            <ContactModal
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
                session={session}
            />
        </div>
    );
};

export default Landing;
