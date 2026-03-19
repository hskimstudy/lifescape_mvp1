import React, { useEffect, useRef } from 'react';

const MARQUEE_IMAGES = [
    { src: '/assets/landing_b_wood.png', alt: '내추럴 우드 인테리어' },
    { src: '/assets/landing_b5_ai1.png', alt: 'AI 연출 인테리어' },
    { src: '/assets/landing_b_insta1.png', alt: '인스타 감성 인테리어' },
    { src: '/assets/marquee_new_5.png', alt: '스튜디오 연출' },
    { src: '/assets/landing_a1.png', alt: '모던 거실 연출' },
    { src: '/assets/landing_a2.png', alt: '미드센추리 거실 연출' },
];

const AcquisitionSection = () => {
    const marqueeRef = useRef(null);

    /** 모바일만: 터치 가로 스크롤 + scrollLeft 자동 롤링 (웹은 CSS 마퀴 그대로) */
    useEffect(() => {
        const el = marqueeRef.current;
        if (!el) return;

        const mq = window.matchMedia('(max-width: 768px)');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        let rafId = 0;
        let groupWidth = 0;
        let pausedUntil = 0;

        const updateGroupWidth = () => {
            const first = el.querySelector('.marquee-group');
            groupWidth = first ? first.offsetWidth : 0;
        };

        const pause = () => {
            pausedUntil = Date.now() + 3200;
        };

        const ro = new ResizeObserver(updateGroupWidth);
        ro.observe(el);
        const firstGroup = el.querySelector('.marquee-group');
        if (firstGroup) ro.observe(firstGroup);

        updateGroupWidth();

        const imgs = el.querySelectorAll('img');
        const onImgLoad = () => updateGroupWidth();
        imgs.forEach((img) => {
            if (img.complete) onImgLoad();
            else img.addEventListener('load', onImgLoad);
        });

        el.addEventListener('touchstart', pause, { passive: true });
        el.addEventListener('wheel', pause, { passive: true });

        const tick = () => {
            rafId = requestAnimationFrame(tick);
            if (!mq.matches || reduceMotion.matches || !groupWidth) return;
            if (Date.now() < pausedUntil) return;

            el.scrollLeft += 0.95;
            if (el.scrollLeft >= groupWidth - 0.5) {
                el.scrollLeft -= groupWidth;
            }
        };

        rafId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            imgs.forEach((img) => img.removeEventListener('load', onImgLoad));
            el.removeEventListener('touchstart', pause);
            el.removeEventListener('wheel', pause);
        };
    }, []);

    return (
        <section className="acquisition-section">
            <div className="acquisition-preview-wrapper animate-fade-up">
                <div className="acquisition-preview">
                    <img src="/assets/preview_new_sofa.png" alt="Preview" />
                </div>
                <h2 className="acquisition-title">
                    <span className="acquisition-title-line1">단 한 장의 사진으로 </span>
                    <br className="only-mobile" />
                    <span className="acquisition-title-line2">
                        <span className="accent-blue">스튜디오 촬영본</span> 획득
                    </span>
                </h2>
            </div>
            <div ref={marqueeRef} className="acquisition-marquee-container mt-12 w-full relative">
                <div className="marquee-track">
                    <div className="marquee-group" aria-label="연출 예시 이미지">
                        {MARQUEE_IMAGES.map((item) => (
                            <div key={item.src} className="acquisition-box">
                                <img src={item.src} alt={item.alt} />
                            </div>
                        ))}
                    </div>
                    <div className="marquee-group" aria-hidden="true">
                        {MARQUEE_IMAGES.map((item) => (
                            <div key={`dup-${item.src}`} className="acquisition-box">
                                <img src={item.src} alt="" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AcquisitionSection;
