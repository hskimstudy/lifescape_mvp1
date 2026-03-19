import React, { useState, useEffect, useRef } from 'react';

const STEPS = [
    { title: '배경을 바꾸고 싶은\n가구 사진 업로드' },
    { title: '원하는 분위기의\n배경 선택' },
    { title: '집에서 손쉽게\n스튜디오 촬영본 획득' },
];

const StickyStepsSection = () => {
    const sectionRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        let rafId;

        const tick = () => {
            const rect = section.getBoundingClientRect();
            const viewH = window.innerHeight;
            const scrolled = -rect.top;
            const total = section.offsetHeight - viewH;

            if (total > 0) {
                const p = Math.max(0, Math.min(STEPS.length - 0.99, (scrolled / total) * (STEPS.length - 0.9)));
                setProgress(p);
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const activeStep = Math.round(progress);

    return (
        <section className="sts-section" ref={sectionRef}>
            <div className="sts-sticky">
                <div className="sts-a-layout">
                    <aside className="sts-copy-aside" aria-label="단계 안내">
                        <div className="sts-a-title-block">
                            <span className="sts-a-step-label" key={`lbl-${activeStep}`}>
                                STEP {activeStep + 1}
                            </span>
                            <h2 className="sts-a-title" key={activeStep}>
                                {STEPS[activeStep].title.split('\n').map((line, j) => (
                                    <React.Fragment key={j}>
                                        {line}
                                        {j === 0 && <br />}
                                    </React.Fragment>
                                ))}
                            </h2>
                        </div>
                    </aside>

                    {/* 오른쪽: 스크롤 연동 일러스트 레이어 */}
                    <div className="sts-illust-zone">
                        {STEPS.map((__, i) => {
                            let translateY = 0;
                            let scale = 1;
                            let opacity = 0;
                            let brightness = 1;

                            if (progress >= i && progress < i + 1) {
                                opacity = 1;
                                translateY = 0;
                                const exitP = progress - i;
                                scale = 1 - exitP * 0.1;
                                brightness = 1 - exitP * 0.4;
                            } else if (progress < i && progress >= i - 1) {
                                const entranceP = progress - (i - 1);
                                translateY = 100 * (1 - entranceP);
                                opacity = entranceP;
                            } else if (progress >= i + 1) {
                                opacity = 1;
                                scale = 0.9;
                                brightness = 0.6;
                            } else {
                                translateY = 100;
                                opacity = 0;
                            }

                            return (
                                <div
                                    key={i}
                                    className={`sts-step-layer sts-step-layer--illust ${activeStep === i ? 'is-active' : ''}`}
                                    style={{
                                        zIndex: (i + 1) * 10,
                                        transform: `translateY(${translateY}vh) scale(${scale})`,
                                        opacity,
                                        filter: `brightness(${brightness})`,
                                        visibility: opacity > 0 ? 'visible' : 'hidden',
                                    }}
                                >
                                    <div className="sts-panel sts-panel--glass show">
                                        {i === 0 && (
                                            <div className="sts-illust-1 sts-stage-unified">
                                                <div className="sts-glass-frame sts-glass-frame--stage">
                                                    <img src="/assets/step1__.png" alt="Sofa" />
                                                </div>
                                                <div className="sts-float-card">
                                                    <button type="button">가구 사진 업로드</button>
                                                </div>
                                            </div>
                                        )}
                                        {i === 1 && (
                                            <div className="sts-illust-2 sts-stage-unified">
                                                <div className="sts-bg-select-card">
                                                    <div className="sts-bg-header">
                                                        <h3>원하는 배경 선택</h3>
                                                        <p>
                                                            클릭 한 번으로 다양한 프리셋과
                                                            <br />
                                                            커스텀 프롬프트를 적용하세요.
                                                        </p>
                                                    </div>
                                                    <div className="sts-bg-grid">
                                                        <div className="sts-bg-item">
                                                            <img src="/assets/landing_a1.png" alt="모던 거실" />
                                                            <span>포근한 침실</span>
                                                        </div>
                                                        <div className="sts-bg-item">
                                                            <img src="/assets/landing_a2.png" alt="포근한 침실" />
                                                            <span>미드센추리 거실</span>
                                                        </div>
                                                        <div className="sts-bg-item">
                                                            <img src="/assets/landing_a4.png" alt="자연주의" />
                                                            <span>원룸 인테리어</span>
                                                        </div>
                                                        <div className="sts-bg-item sts-bg-custom">
                                                            <span
                                                                className="no-bg"
                                                                style={{
                                                                    position: 'relative',
                                                                    background: 'none',
                                                                    padding: 0,
                                                                    fontSize: '1.5rem',
                                                                }}
                                                            ></span>
                                                            <span
                                                                className="no-bg"
                                                                style={{
                                                                    position: 'relative',
                                                                    background: 'none',
                                                                    padding: 0,
                                                                    color: '#C8E600',
                                                                }}
                                                            >
                                                                직접 입력하기
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {i === 2 && (
                                            <div className="sts-illust-3 sts-stage-unified">
                                                <div className="sts-glass-frame sts-glass-frame--stage sts-glass-frame--result">
                                                    <img src="/assets/sticky_step3.png" alt="Result" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StickyStepsSection;
