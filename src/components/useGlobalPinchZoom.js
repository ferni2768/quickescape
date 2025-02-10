import { useState, useCallback, useEffect } from 'react';

export const useGlobalPinchZoom = () => {
    // Track touch state
    const [touchStartDistance, setTouchStartDistance] = useState(null);
    const [touchMidpoint, setTouchMidpoint] = useState(null);
    const [zooming, setZooming] = useState(false);

    // Handle touch start events
    const handleTouchStart = useCallback((event) => {
        event.preventDefault();

        // Only care about two-touch gestures
        if (event.touches.length === 2) {
            setZooming(true);
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculate initial distance between touches
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const distance = Math.hypot(dx, dy);

            // Store initial distance and midpoint
            setTouchStartDistance(distance);
            setTouchMidpoint({
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            });
        }
    }, []);

    // Handle touch move events
    const handleTouchMove = useCallback((event) => {
        event.preventDefault();

        // Only process if we have two touches and initial distance
        if (event.touches.length === 2 && touchStartDistance !== null) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculate new distance between touches
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const currentDistance = Math.hypot(dx, dy);

            // Calculate zoom scale
            const scale = currentDistance / touchStartDistance;

            // Update state with new distance for next calculation
            setTouchStartDistance(currentDistance);

            return { scale, midpoint: touchMidpoint };
        }

        return null;
    }, [touchStartDistance, touchMidpoint]);

    // Handle touch end events
    const handleTouchEnd = useCallback(() => {
        setTouchStartDistance(null);
        setTouchMidpoint(null);
        setZooming(false);
    }, []);

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