import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpring } from '@react-spring/web';

export function Camera(getClientXY) {
    const [zoom, setZoom] = useState(1);
    const [isCameraDragging, setIsCameraDragging] = useState(false);
    const centerSectionRef = useRef(null);

    const [viewportState, setViewportState] = useState({
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        cameraPosition: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
    });

    const cameraProps = useSpring({
        to: { x: viewportState.cameraPosition.x, y: viewportState.cameraPosition.y },
        config: { mass: 1, tension: 170, friction: 26 },
    });

    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
    });

    const zoomProps = useSpring({ zoom });

    // Center the camera in respect to the center section
    const centerCamera = useCallback(() => {
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
    }, [centerSectionRef]);

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
        return () => window.removeEventListener('resize', handleResize);
    }, [centerCamera]);

    // Update camera position on mouse/touch move
    const handleMouseMoveCamera = useCallback((event, positionState, setPositionState, zoom) => {
        const { clientX, clientY } = getClientXY(event);
        if (isCameraDragging) {
            const newMousePosition = { x: clientX, y: clientY };
            setViewportState((prev) => ({
                ...prev,
                cameraPosition: {
                    x: prev.cameraPosition.x - (newMousePosition.x - positionState.offset.x) / zoom,
                    y: prev.cameraPosition.y - (newMousePosition.y - positionState.offset.y) / zoom,
                },
            }));
            setPositionState((prev) => ({
                ...prev,
                offset: { x: newMousePosition.x, y: newMousePosition.y },
            }));
        }
    }, [isCameraDragging]);

    // Handle mouse/touch down to start dragging the camera
    const handleMouseDownCamera = useCallback((event, setPositionState) => {
        const { clientX, clientY } = getClientXY(event);
        setIsCameraDragging(true);
        document.body.style.cursor = 'grabbing';
        setPositionState((prev) => ({
            ...prev,
            offset: { x: clientX, y: clientY },
        }));
    }, []);

    // Handle mouse/touch up to stop dragging the camera
    const handleMouseUpCamera = useCallback((positionState, setPositionState) => {
        setIsCameraDragging(false);
        document.body.style.cursor = 'default';
        setPositionState(prev => ({
            ...prev,
            mousePosition: { x: 0, y: 0 },
            offset: { x: 0, y: 0 }
        }));
        centerCamera();
    }, [centerCamera]);

    // Handle zooming
    const handleZoom = useCallback((delta) => {
        setZoom((prevZoom) => Math.max(0.1, Math.min(prevZoom + delta, 5)));
    }, []);

    // Handle zooming with ctrl button
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    handleZoom(0.1);
                } else if (event.key === '-') {
                    event.preventDefault();
                    handleZoom(-0.1);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoom]);

    return {
        viewportState,
        centerSectionRef,
        handleMouseMoveCamera,
        handleMouseDownCamera,
        handleMouseUpCamera,
        cameraProps,
        zoomProps,
        zoom,
        isCameraDragging,
        positionState,
        setPositionState
    };
}