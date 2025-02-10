import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSpring } from '@react-spring/web';
import { useGlobalPinchZoom } from './useGlobalPinchZoom';

export function Camera(getClientXY, locked) {
    const [zoom, setZoom] = useState(1);
    const [isCameraDragging, setIsCameraDragging] = useState(false);
    const centerSectionRef = useRef(null);

    // For pinch to zoom
    const touchStartDistanceRef = useRef(null);
    const touchMidpointRef = useRef(null);

    const zoomLimits = useMemo(() => ({ min: 0.25, max: 1.5 }), []);
    const zoomProps = useSpring({ zoom });
    const [refresh, setRefresh] = useState(false);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [cameraPosition, setCameraPosition] = useState({
        x: -window.innerWidth / 2,
        y: -window.innerHeight / 2,
    });

    const cameraProps = useSpring({
        to: { x: cameraPosition.x, y: cameraPosition.y },
        config: { mass: 0.75, tension: 260, friction: 30 },
    });

    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
    });

    const { handleTouchMove, zooming } = useGlobalPinchZoom();

    // Center the camera in respect to the center section
    const centerCamera = useCallback(() => {
        if (!locked || !centerSectionRef.current) return;

        const centerSectionTop = centerSectionRef.current.offsetTop - windowSize.height / 5;
        const centerSectionBottom = centerSectionTop + centerSectionRef.current.offsetHeight + windowSize.height / 5;

        setCameraPosition((prev) => ({
            x: -windowSize.width / 2,
            y: Math.min(
                Math.max(prev.y, centerSectionTop - windowSize.height / 4),
                centerSectionBottom - windowSize.height / 2
            ),
        }));
    }, [locked, windowSize.height, windowSize.width]);

    // Center the camera when locked is toggled
    useEffect(() => {
        if (locked) centerCamera();
    }, [locked, centerCamera]);

    // Update window size on resize
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            setWindowSize({ width: newWidth, height: newHeight });
            setIsCameraDragging(false);
            document.body.style.cursor = 'default';

            centerCamera();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [centerCamera]);

    // Update camera position on mouse/touch move
    const handleMouseMoveCamera = useCallback((event) => {
        event.preventDefault();
        if (event.touches && event.touches.length > 1) return;

        const { clientX, clientY } = getClientXY(event);
        if (isCameraDragging) {
            const newCameraX = cameraPosition.x - (clientX - positionState.offset.x) / zoom;
            const newCameraY = cameraPosition.y - (clientY - positionState.offset.y) / zoom;

            setCameraPosition({ x: newCameraX, y: newCameraY });

            setPositionState((prev) => ({
                ...prev,
                offset: { x: clientX, y: clientY },
            }));
        }
    }, [isCameraDragging, getClientXY, positionState.offset.x, positionState.offset.y, zoom, cameraPosition]);

    // Handle mouse/touch down to start dragging the camera
    const handleMouseDownCamera = useCallback((event) => {
        event.preventDefault();
        const { clientX, clientY } = getClientXY(event);
        setIsCameraDragging(true);
        document.body.style.cursor = 'grabbing';
        setPositionState((prev) => ({
            ...prev,
            offset: { x: clientX, y: clientY },
        }));
    }, [getClientXY]);

    // Handle zooming
    const handleZoom = useCallback((delta) => {
        setZoom((prevZoom) => Math.max(zoomLimits.min, Math.min(prevZoom + delta, zoomLimits.max)));
        setRefresh((prev) => !prev);
    }, [zoomLimits.min, zoomLimits.max]);

    // Handle touch move events
    const handleTouchMoveCamera = useCallback((event) => {
        const result = handleTouchMove(event);
        if (!result) return;

        const { scale, midpoint } = result;
        const newZoom = zoom * scale;

        // During touch, allow zooming beyond limits
        setZoom(newZoom);

        if (centerSectionRef.current) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const relativeX = midpoint.x / viewportWidth;
            const relativeY = midpoint.y / viewportHeight;

            setCameraPosition(prev => ({
                x: prev.x + (relativeX * viewportWidth - viewportWidth / 2) * (scale - 1),
                y: prev.y + (relativeY * viewportHeight - viewportHeight / 2) * (scale - 1),
            }));
        }

        event.preventDefault();
    }, [zoom, handleTouchMove]);

    // Handle touch end to stop pinch to zoom
    const handleTouchEnd = useCallback(() => {
        setIsCameraDragging(false);
        touchStartDistanceRef.current = null;
        touchMidpointRef.current = null;
        setRefresh((prev) => !prev);

        // Spring back to limits on touch end
        setZoom((prevZoom) => {
            if (prevZoom < zoomLimits.min) return zoomLimits.min;
            if (prevZoom > zoomLimits.max) return zoomLimits.max;
            return prevZoom;
        });

        centerCamera();
    }, [zoomLimits.min, zoomLimits.max, centerCamera]);

    // Handle zooming with ctrl button
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    if (zoom < zoomLimits.max) {
                        handleZoom(0.1);
                    }
                } else if (event.key === '-') {
                    event.preventDefault();
                    if (zoom > zoomLimits.min) {
                        handleZoom(-0.1);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoom, zoom, zoomLimits.min, zoomLimits.max]);

    // Add event listeners for touch events
    useEffect(() => {
        const handleTouchStart = (event) => {
            event.preventDefault();

            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                const distance = Math.hypot(dx, dy);

                const midpointX = (touch1.clientX + touch2.clientX) / 2;
                const midpointY = (touch1.clientY + touch2.clientY) / 2;

                touchStartDistanceRef.current = distance;
                touchMidpointRef.current = { x: midpointX, y: midpointY };
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchMove, handleTouchEnd]);

    // Set up touch move event listener
    useEffect(() => {
        const handleTouchMoveWrapper = (event) => {
            if (event.touches && event.touches.length > 1) handleTouchMoveCamera(event);
            else handleMouseMoveCamera(event);
        };

        window.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false });
        return () => window.removeEventListener('touchmove', handleTouchMoveWrapper);
    }, [handleTouchMoveCamera, handleMouseMoveCamera]);

    return {
        viewportState: { windowSize, cameraPosition },
        centerSectionRef,
        handleMouseMoveCamera,
        handleMouseDownCamera,
        handleTouchEnd,
        cameraProps,
        zoomProps,
        zoom,
        zooming,
        refresh,
        isCameraDragging,
        positionState,
        setPositionState,
    };
}