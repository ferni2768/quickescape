import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpring } from '@react-spring/web';

export function Camera(getClientXY, locked) {
    const [zoom, setZoom] = useState(1);
    const [isCameraDragging, setIsCameraDragging] = useState(false);
    const centerSectionRef = useRef(null);

    // For pinch to zoom
    const [touchStartDistance, setTouchStartDistance] = useState(null);
    const [touchMidpoint, setTouchMidpoint] = useState(null);

    const zoomLimits = { min: 0.5, max: 2 };
    const zoomProps = useSpring({ zoom });
    const [refresh, setRefresh] = useState(false);

    const [viewportState, setViewportState] = useState({
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        cameraPosition: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
    });

    const cameraProps = useSpring({
        to: { x: viewportState.cameraPosition.x, y: viewportState.cameraPosition.y },
        config: { mass: 0.75, tension: 260, friction: 30 },
    });

    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
    });

    // Center the camera in respect to the center section
    const centerCamera = useCallback(() => {
        if (!locked) return;
        setViewportState((prev) => {
            const centerSectionTop = centerSectionRef.current?.offsetTop - prev.windowSize.height / 5 || 0;
            const centerSectionBottom = centerSectionTop + (centerSectionRef.current?.offsetHeight || 0) + prev.windowSize.height / 5;

            let newY = prev.cameraPosition.y;

            if (prev.cameraPosition.y < centerSectionTop - prev.windowSize.height / 4) {
                newY = centerSectionTop - prev.windowSize.height / 4;
            } else if (prev.cameraPosition.y > centerSectionBottom - prev.windowSize.height / 2) {
                newY = centerSectionBottom - prev.windowSize.height / 2;
            }

            return {
                ...prev,
                cameraPosition: {
                    x: -prev.windowSize.width / 2,
                    y: newY,
                },
            };
        });
    }, [centerSectionRef, locked]);

    // Center the camera when locked is toggled
    useEffect(() => {
        if (locked) centerCamera();
    }, [locked, centerCamera]);

    // Update window size on resize
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            setViewportState((prev) => ({
                ...prev,
                windowSize: { width: newWidth, height: newHeight },
            }));

            setIsCameraDragging(false);
            document.body.style.cursor = 'default';

            centerCamera();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        }
    }, [centerCamera]);

    // Update camera position on mouse/touch move
    const handleMouseMoveCamera = useCallback((event) => {
        if (event.touches && event.touches.length > 1) return;
        const { clientX, clientY } = getClientXY(event);
        if (isCameraDragging) {
            const newCameraX = viewportState.cameraPosition.x - (clientX - positionState.offset.x) / zoom;
            const newCameraY = viewportState.cameraPosition.y - (clientY - positionState.offset.y) / zoom;

            setViewportState((prev) => ({
                ...prev,
                cameraPosition: {
                    x: newCameraX,
                    y: newCameraY,
                },
            }));

            setPositionState((prev) => ({
                ...prev,
                offset: { x: clientX, y: clientY },
            }));
        }
    }, [isCameraDragging, getClientXY, positionState.offset.x, positionState.offset.y, zoom, viewportState.cameraPosition]);

    // Handle mouse/touch down to start dragging the camera
    const handleMouseDownCamera = useCallback((event) => {
        const { clientX, clientY } = getClientXY(event);
        setIsCameraDragging(true);
        document.body.style.cursor = 'grabbing';
        setPositionState((prev) => ({
            ...prev,
            offset: { x: clientX, y: clientY },
        }));
    }, [getClientXY]);

    // Handle mouse/touch up to stop dragging the camera
    const handleMouseUpCamera = useCallback(() => {
        setIsCameraDragging(false);
        document.body.style.cursor = 'default';
        setPositionState((prev) => ({
            ...prev,
            offset: { x: 0, y: 0 },
        }));
        centerCamera();
    }, [centerCamera]);

    // Handle zooming
    const handleZoom = useCallback((delta) => {
        setZoom((prevZoom) => prevZoom + delta);
        setRefresh((prev) => !prev);
    }, []);

    // Handle pinch to zoom
    const handleTouchMove = useCallback((event) => {
        event.preventDefault();

        if (event.touches.length === 2 && touchStartDistance !== null) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const scale = distance / touchStartDistance;

            const newZoom = zoom * scale;
            setZoom(Math.max(0.1, Math.min(newZoom, 5)));

            // Update camera position to keep the midpoint centered
            const centerX = viewportState.windowSize.width / 2;
            const centerY = viewportState.windowSize.height / 2;
            const newCameraX = viewportState.cameraPosition.x + (touchMidpoint.x - centerX) * (scale - 1);
            const newCameraY = viewportState.cameraPosition.y + (touchMidpoint.y - centerY) * (scale - 1);

            setViewportState((prev) => ({
                ...prev,
                cameraPosition: { x: newCameraX, y: newCameraY },
            }));

            setTouchStartDistance(distance);
        }
    }, [zoom, touchStartDistance, viewportState, touchMidpoint]);

    // Handle touch end to stop pinch to zoom
    const handleTouchEnd = useCallback(() => {
        if (!isCameraDragging) return;
        setTouchStartDistance(null);
        setTouchMidpoint(null);
        setRefresh((prev) => !prev);

        setZoom((prevZoom) => {
            if (prevZoom < zoomLimits.min) {
                return zoomLimits.min;
            } else if (prevZoom > zoomLimits.max) {
                return zoomLimits.max;
            }
            return prevZoom;
        });
    }, [zoomLimits.max, zoomLimits.min, isCameraDragging]);

    // Handle zooming with ctrl button
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    if (zoom < zoomLimits.max) { handleZoom(0.1); }
                } else if (event.key === '-') {
                    event.preventDefault();
                    if (zoom > zoomLimits.min) { handleZoom(-0.1); }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoom, zoom, zoomLimits.min, zoomLimits.max]);

    // Add event listeners for touch events
    useEffect(() => {
        if (!isCameraDragging) return;
        const handleTouchStart = (event) => {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const midpointX = (touch1.clientX + touch2.clientX) / 2;
                const midpointY = (touch1.clientY + touch2.clientY) / 2;

                setTouchStartDistance(distance);
                setTouchMidpoint({ x: midpointX, y: midpointY });
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
    }, [handleTouchMove, handleTouchEnd, isCameraDragging]);

    return {
        viewportState,
        centerSectionRef,
        handleMouseMoveCamera,
        handleMouseDownCamera,
        handleMouseUpCamera,
        cameraProps,
        zoomProps,
        zoom,
        refresh,
        isCameraDragging,
        positionState,
        setPositionState
    };
}