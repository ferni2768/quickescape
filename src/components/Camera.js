import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSpring } from '@react-spring/web';
import { useGlobalPinchZoom } from './useGlobalPinchZoom';

// Helper function to calculate xOffset
const calculateXOffset = (buttonsWidth, windowWidth, visible, zoom) => {
    const minProportion = 0.2;
    const minProportion_bigScreens = 0.15;
    const proportion = buttonsWidth / windowWidth;

    if (!visible || (proportion < minProportion && zoom <= 0.6) || proportion < minProportion_bigScreens)
        return 0;

    return Math.max(buttonsWidth * 1.25 - buttonsWidth * zoom, 0);
};

// Helper function to calculate initial zoom
const calculateInitialZoom = (proportion) => {
    const minProportion = 0.1;
    const maxProportion = 0.3;
    const minZoom = 0.4;
    const maxZoom = 0.6;
    const clampedProportion = Math.min(Math.max(proportion, minProportion), maxProportion);
    return maxZoom - ((clampedProportion - minProportion) * (maxZoom - minZoom)) / (maxProportion - minProportion);
};

export function Camera(getClientXY, locked, visible, isOpen, overlay, zoom, setZoom, cameraPosition, setCameraPosition, buttonContainerRef) {
    const zoomRef = useRef(zoom);
    const [isCameraDragging, setIsCameraDragging] = useState(false);
    const [buttonsWidth, setButtonsWidth] = useState(0);
    const buttonsWidthRef = useRef(buttonsWidth);
    const centerSectionRef = useRef(null);

    // Update refs whenever state changes
    useEffect(() => {
        zoomRef.current = zoom;
        buttonsWidthRef.current = buttonsWidth;
    }, [zoom, buttonsWidth]);

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

    const cameraProps = useSpring({
        to: { x: cameraPosition.x, y: cameraPosition.y },
        config: { mass: 0.75, tension: 260, friction: 30 },
    });

    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
    });

    const viewportState = useMemo(() => ({
        windowSize,
        cameraPosition,
    }), [windowSize, cameraPosition]);

    const { handleTouchMove, zooming } = useGlobalPinchZoom(isOpen, overlay);

    // Center the camera in respect to the center section
    const centerCamera = useCallback(() => {
        if (!locked || !centerSectionRef.current) return;

        const windowWidth = window.innerWidth;
        const xOffset = calculateXOffset(buttonsWidthRef.current, windowWidth, visible, zoomRef.current);

        const centerSectionTop = centerSectionRef.current.offsetTop - windowSize.height / 5;
        const centerSectionBottom = centerSectionTop + centerSectionRef.current.offsetHeight + windowSize.height / 5;

        setCameraPosition((prev) => ({
            x: -windowWidth / 2 - xOffset,
            y: Math.min(
                Math.max(prev.y, centerSectionTop - windowSize.height / 4),
                centerSectionBottom - windowSize.height / 2
            ),
        }));
    }, [locked, visible, windowSize.height, setCameraPosition]);

    // Update camera position based on zoom and buttonsWidth
    useEffect(() => {
        centerCamera();
    }, [zoom, locked, visible, buttonsWidth, centerCamera]);

    // Observe buttons' container width and set initial zoom and xOffset
    useEffect(() => {
        if (!buttonContainerRef?.current) return;

        const observer = new ResizeObserver((entries) => {
            const newWidth = entries[0].contentRect.width;
            setButtonsWidth(newWidth);

            const windowWidth = window.innerWidth;
            const proportion = newWidth / windowWidth;

            // Set initial zoom only once when the app starts
            if (zoomRef.current === 0.4) {
                const newZoom = calculateInitialZoom(proportion);
                setZoom(newZoom);
            }

            centerCamera();
        });

        observer.observe(buttonContainerRef.current);
        return () => observer.disconnect();
    }, [buttonContainerRef, visible, centerCamera, setZoom]);

    // Update window size on resize
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            setWindowSize({ width: newWidth, height: newHeight });
            centerCamera();
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
    }, [centerCamera, visible]);

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
    }, [isCameraDragging, getClientXY, positionState.offset.x, positionState.offset.y, zoom, cameraPosition, setCameraPosition]);

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
    }, [zoomLimits.min, zoomLimits.max, setZoom]);

    // Handle touch move events
    const handlePinchCamera = useCallback((event) => {
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
    }, [zoom, handleTouchMove, setCameraPosition, setZoom]);

    // Handle touch end to stop pinch to zoom
    const handleTouchEnd = useCallback(() => {
        setIsCameraDragging(false);
        touchStartDistanceRef.current = null;
        touchMidpointRef.current = null;
        setRefresh((prev) => !prev);

        const clampedZoom = Math.max(zoomLimits.min, Math.min(zoom, zoomLimits.max));
        setZoom(clampedZoom);

        if (locked) centerCamera();
    }, [zoom, locked, zoomLimits.min, zoomLimits.max, centerCamera, setZoom]);

    // Handle zooming with ctrl button
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    if (zoom < zoomLimits.max && !isOpen && !overlay) {
                        handleZoom(0.1);
                    }
                } else if (event.key === '-') {
                    event.preventDefault();
                    if (zoom > zoomLimits.min && !isOpen && !overlay) {
                        handleZoom(-0.1);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoom, zoom, zoomLimits.min, zoomLimits.max, isOpen, overlay]);

    // Set up touch move event listener
    useEffect(() => {
        const handleTouchMoveWrapper = (event) => {
            if (event.touches && event.touches.length > 1) handlePinchCamera(event);
            else handleMouseMoveCamera(event);
        };

        window.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false });
        return () => window.removeEventListener('touchmove', handleTouchMoveWrapper);
    }, [handlePinchCamera, handleMouseMoveCamera]);

    return {
        viewportState,
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