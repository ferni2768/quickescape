import { useState, useCallback, useEffect, useRef } from 'react';

export const useGlobalPinchZoom = (isOpen) => {
    const touchRef = useRef({ startDistance: null, initialMidpoint: null });
    const [zooming, setZooming] = useState(false);

    // Handle touch start events
    const handleTouchStart = useCallback((event) => {
        if (isOpen) return;
        event.preventDefault();

        if (event.touches.length === 2) {
            setZooming(true);
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculate initial distance between touches
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const distance = Math.hypot(dx, dy);

            // Store initial distance and midpoint
            touchRef.current = {
                startDistance: distance,
                initialMidpoint: {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2,
                },
            };
        }
    }, [isOpen]);

    // Handle touch move events
    const handleTouchMove = useCallback((event) => {
        event.preventDefault();

        if (event.touches.length === 2 && touchRef.current.startDistance !== null) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculate current distance between touches
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const currentDistance = Math.hypot(dx, dy);

            // Calculate scale relative to the initial distance
            const scale = currentDistance / touchRef.current.startDistance;

            setTimeout(() => { touchRef.current.startDistance = currentDistance; }, 0);
            return { scale, midpoint: touchRef.current.initialMidpoint };
        }

        return null;
    }, []);

    // Handle touch end events
    const handleTouchEnd = useCallback(() => {
        touchRef.current = { startDistance: null, initialMidpoint: null };
        setZooming(false);
    }, []);

    // Add event listeners
    useEffect(() => {
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { handleTouchMove, zooming };
};