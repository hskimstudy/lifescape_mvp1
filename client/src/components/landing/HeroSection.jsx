import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import HeroOrbitalRing from './hero/HeroOrbitalRing';
import HeroParticleField from './hero/HeroParticleField';
import { HERO_CAROUSEL_IMAGES } from './hero/heroCarouselData';

const HeroSection = ({ onStart }) => {
    const images = HERO_CAROUSEL_IMAGES;
    const [currentIndex, setCurrentIndex] = useState(5);

    useEffect(() => {
        // 자동 스크롤 비활성화 (고정)
    }, [images.length]);

    const getCardStyle = (index) => {
        let diff = index - currentIndex;

        if (diff > Math.floor(images.length / 2)) diff -= images.length;
        if (diff < -Math.floor(images.length / 2)) diff += images.length;

        const isCenter = diff === 0;
        const absDiff = Math.abs(diff);
        const translateX = diff * 330;
        const translateZ = isCenter ? 50 : -150 - Math.abs(diff) * 50;
        const rotateY = -diff * 15;
        const opacity = Math.abs(diff) > 2 ? 0 : isCenter ? 1 : 0.6;
        const zIndex = 10 - Math.abs(diff);
        const scaleY = isCenter ? 1 : absDiff === 1 ? 0.96 : absDiff === 2 ? 0.92 : 0.9;

        return {
            transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scaleY(${scaleY})`,
            opacity,
            zIndex,
        };
    };

    return (
        <section className="landing-hero landing-hero--fx-bg" id="home">
            <div className="landing-hero-fx" aria-hidden>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'radial-gradient(circle at center, rgba(201,236,0,0.05), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.025), transparent 18%, transparent 78%, rgba(201,236,0,0.035))',
                    }}
                />
                <HeroParticleField focalYRatio={0.24} />
                <div
                    className="landing-hero-fx-orbitals"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'clamp(140px, 19%, 230px)',
                        transform: 'translate(-50%, -50%)',
                        width: 800,
                        height: 800,
                        pointerEvents: 'none',
                    }}
                >
                    <HeroOrbitalRing size={360} duration={16} opacity={0.14} />
                    <HeroOrbitalRing size={520} duration={24} opacity={0.09} delay={0.3} />
                    <HeroOrbitalRing size={700} duration={32} opacity={0.05} blur={0.5} />
                </div>
                <Motion.div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'clamp(140px, 19%, 230px)',
                        transform: 'translate(-50%, -50%)',
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'rgba(201, 236, 0, 0.12)',
                        filter: 'blur(80px)',
                        zIndex: 0,
                    }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Motion.div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'clamp(195px, 25%, 295px)',
                        transform: 'translate(-50%, -50%)',
                        width: 640,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(201, 236, 0, 0.07)',
                        filter: 'blur(48px)',
                        zIndex: 0,
                    }}
                    animate={{ opacity: [0.1, 0.16, 0.1], scaleX: [0.94, 1.02, 0.94] }}
                    transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="hero-content animate-fade-up" style={{ position: 'relative', zIndex: 20 }}>
                <Motion.h1
                    className="hero-title hero-title--lined"
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '3.5rem',
                        paddingBottom: '8px',
                        color: '#fff',
                    }}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                >
                    <span>가구 촬영,</span>
                    <span>스튜디오 없이 완벽하게</span>
                </Motion.h1>

                <div className="hero-actions landing-hero-actions" style={{ marginTop: '48px' }}>
                    <Motion.button
                        type="button"
                        className="cta-btn"
                        onClick={onStart}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="cta-text">지금 체험하기</span>
                        <span className="cta-shimmer" aria-hidden />
                        <span className="cta-inner-glow" aria-hidden />
                        <span className="cta-outer-glow" aria-hidden />
                    </Motion.button>
                </div>
            </div>

            <div
                className="carousel-3d-container animate-fade-up"
                style={{ animationDelay: '0.4s', marginTop: '76px', height: '520px', position: 'relative', zIndex: 5 }}
            >
                <div className="carousel-track" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
                    {images.map((item, idx) => (
                        <div
                            key={idx}
                            className="carousel-card"
                            style={getCardStyle(idx)}
                            onClick={() => setCurrentIndex(idx)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCurrentIndex(idx);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="carousel-card-media">
                                <img src={item.src} alt={item.alt} />
                                <div className="hero-carousel-preset-label" aria-hidden="true">
                                    {item.preset}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 50,
                    }}
                >
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            style={{
                                width: currentIndex === idx ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: currentIndex === idx ? '#C8E600' : 'rgba(255,255,255,0.3)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            aria-label={`슬라이드 ${idx + 1}로 이동`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
