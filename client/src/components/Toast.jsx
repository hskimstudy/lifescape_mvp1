import React, { useEffect, useState } from 'react';

/**
 * A premium Toast notification component for ITDA.
 * Displays a message and automatically closes after a delay.
 */
const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(), 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        if (type === 'error') return '❌';
        return '✅';
    };

    return (
        <div className={`itda-toast ${type} ${isExiting ? 'exiting' : ''}`} onClick={handleClose} role="alert">
            <div className="itda-toast-icon">{getIcon()}</div>
            <div className="itda-toast-message">{message}</div>
        </div>
    );
};

export default Toast;
