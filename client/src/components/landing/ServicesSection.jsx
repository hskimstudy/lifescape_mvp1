import React, { useState } from 'react';

const SERVICES = [
    {
        id: 'detail',
        badge: 'PREMIUM',
        title: '상품 상세 페이지 제작',
        desc: '설명하지 말고 설득하세요.\n구매 전환율을 높이는 AI 기획 페이지.',
        img: '/assets/service_detail.png'
    },
    {
        id: 'mall',
        badge: 'PLATFORM',
        title: '자사몰 제작',
        desc: '플랫폼 수수료 없는 당신만의 쇼핑몰,\n저희가 만들어 드려요.',
        img: '/assets/service_mall.png'
    },
    {
        id: 'sns',
        badge: 'MARKETING',
        title: 'SNS 마케팅',
        desc: '가구에 관심 있는 고객에게\n당신의 제품을 가장 먼저 보여 주세요.',
        img: '/assets/service_sns.png'
    }
];

const ServicesSection = ({ onContactOpen }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const getCardStyle = (index) => {
        let diff = index - currentIndex;

        // Circular logic for 3 items
        if (diff > 1) diff -= 3;
        if (diff < -1) diff += 3;

        const isCenter = diff === 0;
        const translateX = isMobile ? diff * 100 : diff * 430;
        const scale = isCenter ? 1.05 : 0.85;
        const opacity = 1;
        const zIndex = 10 - Math.abs(diff);

        return {
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
            opacity,
            zIndex,
        };
    };

    return (
        <section className="services-section" id="extra-services">
            <div className="animate-fade-up services-header">
                <h2 className="services-title">완성된 사진, 이제 고객과 직접 <span style={{ color: 'var(--itda-lime)' }}>이어질</span> 차례입니다.</h2>
                <p className="services-sub">이미지 생성을 넘어, 가구 특화 비즈니스의 A to Z를 만나 보세요.<br />번거로운 과정 없이 잇다만의 전문 솔루션이 기다려요.</p>
            </div>

            <div className="services-3d-container animate-fade-up">
                <div className="carousel-track">
                    {SERVICES.map((service, idx) => (
                        <div
                            key={service.id}
                            className={`service-card-v3 ${idx === currentIndex ? 'active' : ''}`}
                            style={getCardStyle(idx)}
                            onClick={() => setCurrentIndex(idx)}
                        >
                            <div className="service-card-badge">{service.badge}</div>
                            <h3 className="service-card-title">{service.title}</h3>
                            <p className="service-card-desc">
                                {service.desc.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                                ))}
                            </p>
                            <div className="service-card-btn-wrap">
                                <button className="service-cta-btn" onClick={onContactOpen}>문의하기</button>
                            </div>
                            <div className="service-card-illust">
                                <img src={service.img} alt={service.title} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
