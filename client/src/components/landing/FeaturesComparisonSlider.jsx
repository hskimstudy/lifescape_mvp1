import React, { useState, useRef, useCallback, useEffect } from 'react';

const LENS_SIZE = 140;
const ZOOM = 1.4;
const LENS_HANDLE_MARGIN = 28;

/**
 * 랜딩 "왜 잇다" Before/After 슬라이더 + 돋보기
 */
export default function FeaturesComparisonSlider() {
    const [position, setPosition] = useState(33);
    const [isDragging, setIsDragging] = useState(false);
    const [mousePos, setMousePos] = useState(null);
    const [isDesktopPointer, setIsDesktopPointer] = useState(false);
    const sliderRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
        const compute = () => setIsDesktopPointer(mql.matches && window.innerWidth >= 1024);

        compute();
        if (mql.addEventListener) mql.addEventListener('change', compute);
        window.addEventListener('resize', compute);

        return () => {
            if (mql.removeEventListener) mql.removeEventListener('change', compute);
            window.removeEventListener('resize', compute);
        };
    }, []);

    const getPosition = useCallback((clientX) => {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
    }, []);

    const handleMove = useCallback(
        (clientX) => {
            if (!isDragging) return;
            requestAnimationFrame(() => setPosition(getPosition(clientX)));
        },
        [isDragging, getPosition]
    );

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setPosition(getPosition(e.clientX));
    };

    const handleSliderMouseMove = useCallback(
        (e) => {
            if (isDragging) return;
            if (!isDesktopPointer) return;
            setMousePos({ clientX: e.clientX, clientY: e.clientY });
        },
        [isDragging, isDesktopPointer]
    );

    const handleSliderMouseLeave = useCallback(() => {
        setMousePos(null);
    }, []);

    useEffect(() => {
        const onMouseMove = (e) => handleMove(e.clientX);
        const onTouchMove = (e) => handleMove(e.touches[0].clientX);
        const onEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onTouchMove, { passive: true });
            window.addEventListener('touchend', onEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, handleMove]);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setPosition(getPosition(e.touches[0].clientX));
    };

    const rect = sliderRef.current && mousePos ? sliderRef.current.getBoundingClientRect() : null;
    const cursorInSlider =
        rect && mousePos
            ? {
                  x: mousePos.clientX - rect.left,
                  y: mousePos.clientY - rect.top,
              }
            : null;
    const handleCenterX = rect ? (position / 100) * rect.width : 0;
    const distFromHandle = cursorInSlider ? Math.abs(cursorInSlider.x - handleCenterX) : Infinity;
    const showLens =
        isDesktopPointer &&
        !isDragging &&
        mousePos &&
        rect &&
        cursorInSlider &&
        cursorInSlider.x >= 0 &&
        cursorInSlider.x <= rect.width &&
        cursorInSlider.y >= 0 &&
        cursorInSlider.y <= rect.height &&
        distFromHandle > LENS_HANDLE_MARGIN;

    const isOverBefore =
        cursorInSlider && rect ? (cursorInSlider.x / rect.width) * 100 < position : false;

    return (
        <>
            <div
                className={`itda-why-slider${isDragging ? ' dragging' : ''}`}
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleSliderMouseMove}
                onMouseLeave={handleSliderMouseLeave}
                onTouchStart={handleTouchStart}
            >
                <div className="itda-why-slider-layer after">
                    <img src="/assets/slider-after.png" alt="잇다 결과물" />
                </div>

                <div
                    className="itda-why-slider-layer before"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                >
                    <img src="/assets/slider-before_1.png" alt="타사 결과물" />
                </div>

                <div className="itda-why-slider-handle" style={{ left: `${position}%` }}>
                    <div className="itda-why-slider-handle-line" />
                    <div className="itda-why-slider-handle-knob">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M7 4L3 10L7 16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M13 4L17 10L13 16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {showLens && rect && cursorInSlider && (
                <div
                    className="itda-why-magnifier-lens"
                    style={{
                        left: mousePos.clientX - LENS_SIZE / 2,
                        top: mousePos.clientY - LENS_SIZE / 2,
                        width: LENS_SIZE,
                        height: LENS_SIZE,
                    }}
                >
                    <div
                        className="itda-why-magnifier-inner"
                        style={{
                            width: rect.width * ZOOM,
                            height: rect.height * ZOOM,
                            left: LENS_SIZE / 2 - cursorInSlider.x * ZOOM,
                            top: LENS_SIZE / 2 - cursorInSlider.y * ZOOM,
                        }}
                    >
                        <img
                            src={isOverBefore ? '/assets/slider-before_1.png' : '/assets/slider-after.png'}
                            alt=""
                            draggable={false}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
