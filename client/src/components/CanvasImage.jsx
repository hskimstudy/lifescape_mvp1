import React, { useRef, useEffect } from 'react';

const CanvasImage = ({ src, style, className }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = src;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
    }, [src]);

    return (
        <canvas
            ref={canvasRef}
            style={{ ...style, cursor: 'default' }}
            className={className}
            onContextMenu={e => e.preventDefault()}
        />
    );
};

export default CanvasImage;
