import { motion as Motion } from 'framer-motion';

/** 히어로 배경 궤도 링 (데코) */
export default function HeroOrbitalRing({ size, delay = 0, duration = 18, opacity = 0.18, blur = 0 }) {
    return (
        <Motion.div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                borderRadius: '50%',
                border: '1px solid rgba(201, 236, 0, 0.22)',
                opacity,
                filter: blur ? `blur(${blur}px)` : undefined,
            }}
            animate={{ rotate: 360 }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'linear',
            }}
        />
    );
}
