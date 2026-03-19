import React from 'react';
import FeaturesComparisonSlider from './FeaturesComparisonSlider';

/** public/assets/why-features/ — ASCII 파일명 (인코딩 이슈 방지) */
const FEATURE_CARDS = [
    {
        iconSrc: '/assets/why-features/icon-clock.png',
        title: '촬영 시간 98% 단축',
        body: '번거로운 스튜디오 예약, 가구 운반은 이제 그만. 사무실에서 클릭 몇 번으로 완벽한 판매용 사진을 받아 보세요.',
        foot: null,
    },
    {
        iconSrc: '/assets/why-features/icon-sofa.png',
        title: '가구 원본 100% 유지',
        body: '단순 합성이 아니예요. 가구의 재질과 형태를 100% 가까이 유지하고, 가장 자연스러운 배경을 만들어 드려요.',
        foot: null,
    },
    {
        iconSrc: '/assets/why-features/icon-mouse.png',
        title: '클릭 한 번으로 생성',
        body: '어떤 배경이 좋을지 고민하지 마세요. AI 기반으로 선별된 국내 인기 배경을 통해, 클릭 몇 번만으로 최적의 판매용 이미지를 완성하세요.',
        foot: null,
    },
];

const FeaturesSection = () => (
    <section className="itda-why" id="features">
        <div className="itda-why-hero itda-why-hero--above-slider">
            <span className="itda-why-eyebrow">왜 잇다일까요?</span>
            <h2 className="itda-why-headline">
                같은 제품 사진.
                <br />
                <span className="itda-why-headline-line2">완전히 다른 결과.</span>
            </h2>
        </div>

        <div className="itda-why-slider-caption">
            <span className="itda-why-slider-caption-third">타 회사</span>
            <span className="itda-why-slider-caption-twothird">잇다</span>
        </div>

        <FeaturesComparisonSlider />

        <div className="itda-why-hero itda-why-hero--v2 itda-why-hero--below-slider">
            <span className="itda-why-eyebrow itda-why-eyebrow--v2"></span>
            <h2 className="itda-why-headline itda-why-headline--v2">
                <span className="itda-why-headline-v2-line1">가구 셀러를 위한 가장 </span>
                <br className="only-mobile" />
                <span className="itda-why-headline-v2-line2">
                    <span className="itda-why-headline-accent">합리적인</span> 선택
                </span>
            </h2>
            <p className="itda-why-sublead">불필요한 촬영 비용은 줄이고, 퀄리티는 높였습니다.</p>
        </div>

        <div className="itda-why-feature-cards">
            {FEATURE_CARDS.map((card) => (
                <article key={card.title} className="itda-why-feature-card">
                    <div className="itda-why-feature-card-head">
                        <img
                            src={card.iconSrc}
                            alt=""
                            className="itda-why-feature-card-icon-img"
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                        />
                        <h3 className="itda-why-feature-card-title">{card.title}</h3>
                    </div>
                    <p className="itda-why-feature-card-body">{card.body}</p>
                    {card.foot ? (
                        <p className="itda-why-feature-card-foot">{card.foot}</p>
                    ) : null}
                </article>
            ))}
        </div>
    </section>
);

export default FeaturesSection;
