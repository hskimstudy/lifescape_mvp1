import React, { useState, useEffect, useRef } from 'react';

/** 히어로 배경 파티클 캔버스 */
export default function HeroParticleField({ focalYRatio = 0.5 }) {
    const canvasRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    const [particles] = useState(() =>
        Array.from({ length: 90 }, (_, i) => ({
            id: i,
            angle: Math.random() * Math.PI * 2,
            radius: 70 + Math.random() * 280,
            size: Math.random() * 2.8 + 0.8,
            speed: 0.0008 + Math.random() * 0.0018,
            drift: 0.15 + Math.random() * 0.65,
            alpha: 0.25 + Math.random() * 0.65,
            hueMix: Math.random(),
            offset: Math.random() * 1000,
        }))
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let width = 0;
        let height = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);

        const render = (t) => {
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height * focalYRatio;

            const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.42);
            radial.addColorStop(0, 'rgba(201, 236, 0, 0.10)');
            radial.addColorStop(0.45, 'rgba(201, 236, 0, 0.04)');
            radial.addColorStop(1, 'rgba(201, 236, 0, 0)');
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, width, height);

            for (const p of particles) {
                const time = t * p.speed + p.offset;
                const breathing = Math.sin(time * 0.9) * 24;
                const orbitR = p.radius + breathing;
                const angle = p.angle + time * p.drift;
                const x = cx + Math.cos(angle) * orbitR;
                const y = cy + Math.sin(angle) * orbitR * 0.52;

                const glow = 8 + p.size * 5;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);

                const isLime = p.hueMix > 0.28;
                const fill = isLime
                    ? `rgba(201, 236, 0, ${p.alpha})`
                    : `rgba(255, 255, 255, ${p.alpha * 0.78})`;

                ctx.shadowBlur = glow;
                ctx.shadowColor = isLime ? 'rgba(201,236,0,0.55)' : 'rgba(255,255,255,0.35)';
                ctx.fillStyle = fill;
                ctx.fill();
            }

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [mounted, particles, focalYRatio]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden
        />
    );
}
