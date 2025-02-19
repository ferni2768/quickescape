import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpring, animated, easings } from '@react-spring/web';
import { RECTANGLE_SIZES } from '../Controller';
import { RECTANGLE_BORDER_RADIUS } from '../Controller';
import './styles/Rectangle.css';

const Rectangle = React.memo(({ viewportState, zoom, zooming, refresh, centerSectionRef, mouseFollowerRef, rect, adjustedMousePosition, gridSize,
    rectangles, setRectangles, getClientXY, isDragging, color, size, icon, isNote, isOverTrashcan }) => {

    // State object with state variables
    const [rectangleState, setRectangleState] = useState({
        absolutePosition: { x: rect.x, y: rect.y },
        initialDragPosition: { x: rect.x, y: rect.y },
        height: rect.height || gridSize * 4,
        deleting: false
    });

    // State variables for dragging and resizing
    const [state, setState] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [showGhost, setShowGhost] = useState(false);
    const rectangleWidth = RECTANGLE_SIZES[size];
    const justCreated = useRef(true);
    const dragged = useRef(false);
    const xOffsetSpring = useSpring({
        from: { xOffset: (viewportState.windowSize.width) / zoom },
        to: { xOffset: 0 },
        config: {
            duration: 300,
            easing: easings.easeOutQuad
        },
    });
    const xOffset = xOffsetSpring.xOffset;
    const [styleProps, setStyleProps] = useSpring(() => ({
        scale: 1,
        opacity: 1,
        backgroundColor: color,
        boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
        config: { tension: 2000, friction: 100 },
    }));

    // State variables for rectangle text editing
    const [startTime, setStartTime] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState("");
    const textareaRef = useRef(null);

    // Animation parameters for rectangle position and size
    const mass = 0.3 * (1 + zoom / 2) + (rectangleState.height * rectangleWidth) / 10;
    const rectangleProps = useSpring({
        x: rectangleState.absolutePosition.x,
        y: rectangleState.absolutePosition.y,
        height: rectangleState.height,
        config: {
            mass: mass,
            tension: 200 + mass * 240,
            friction: (mass * 100) / 4
        },
    });

    // State object with mouse position variables
    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
    });

    // Utility to check if two rectangles overlap
    const doesOverlap = useCallback((id, customPos1, customHeight) => {
        const otherRect = rectangles.find(r => r.id === id);
        if (!otherRect || otherRect.x !== centerSectionRef.current.style.x - (RECTANGLE_SIZES[otherRect.size] / 2)) return false;

        const threshold = 5;
        const pos1 = customPos1 !== undefined ? customPos1 : rectangleState.absolutePosition.y;
        const hei = customHeight !== undefined ? customHeight : rectangleState.height;

        // Calculate clamped ghost position for comparison
        const snappedY = Math.round(pos1 / gridSize) * gridSize;
        const maxY = centerSectionRef.current.offsetHeight - hei;
        const ghostY = Math.min(maxY, Math.max(0, snappedY));

        const top1 = ghostY + threshold;
        const bot1 = top1 + hei - threshold;

        const top2 = otherRect.y + threshold;
        const bot2 = top2 + otherRect.height - threshold;

        return (top1 < top2 && bot1 > top2) || (top1 >= top2 && top1 < bot2);
    }, [rectangleState.absolutePosition, rectangleState.height, rectangles, centerSectionRef, gridSize]);

    // Update rectangle data when dragging or resizing
    useEffect(() => {
        setRectangles((prevRectangles) =>
            prevRectangles.map((r) => {
                if (r.id === rect.id) {
                    // Only update if one of the values has changed
                    if (r.x !== rectangleState.absolutePosition.x || r.y !== rectangleState.absolutePosition.y || r.height !== rectangleState.height || r.border !== rect.border)
                        return { ...r, x: rectangleState.absolutePosition.x, y: rectangleState.absolutePosition.y, height: rectangleState.height, border: rect.border };
                }
                return r;
            })
        );
    }, [rectangleState.absolutePosition.x, rectangleState.absolutePosition.y, rectangleState.height, rect.id, rect.border, setRectangles]);

    // Get the relative position of an absolute position for the rectangle
    const getRelativePosition = useCallback(
        (absolutePos) => {
            const centerX = centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) : viewportState.windowSize.width / 2;
            const centerY = centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) : viewportState.windowSize.height / 2;
            return {
                x: absolutePos.x + centerX,
                y: absolutePos.y + centerY,
            };
        },
        [viewportState, centerSectionRef]
    );

    // Handle mouse/touch move for the rectangle to update its position and size
    const handleMouseRectangle = useCallback((event) => {
        event.preventDefault();

        if (event.touches && event.touches.length > 1) {
            setState(0);
            setStartTime(null);
            return;
        }

        if (state === 0) {
            setState(1);
            dragged.current = true;
            if (isEditing) setIsEditing(false);
            event.stopPropagation();

            const { clientX, clientY } = getClientXY(event);
            const currentRectBottom = rectangleState.absolutePosition.y + rectangleState.height;
            const currentRectRight = rectangleState.absolutePosition.x + rectangleWidth + 47.5;

            setRectangleState((prev) => ({ ...prev, initialDragPosition: { ...rectangleState.absolutePosition } }));

            if (!justCreated.current && adjustedMousePosition.y >= currentRectBottom - 50 && adjustedMousePosition.x >= currentRectRight - 50) {
                setIsResizing(true);
                document.body.style.cursor = 'ns-resize';
                setPositionState((prev) => ({
                    ...prev,
                    offset: {
                        x: clientX - rectangleState.absolutePosition.x,
                        y: clientY - currentRectBottom,
                    },
                }));
            } else {
                document.body.style.cursor = 'grabbing';
                const relativeRectPos = getRelativePosition(rectangleState.absolutePosition);
                setPositionState((prev) => ({
                    ...prev,
                    offset: {
                        x: clientX - (relativeRectPos.x - viewportState.cameraPosition.x) * zoom,
                        y: clientY - (relativeRectPos.y - viewportState.cameraPosition.y) * zoom,
                    },
                }));
            }
        } else if (state === 1) {
            if (event.touches && event.touches.length > 1) {
                setState(0);
                return;
            }

            const { clientX, clientY } = getClientXY(event);

            if (!isResizing) {
                const newMousePosition = { x: clientX, y: clientY };
                if (newMousePosition.x !== positionState.mousePosition.x || newMousePosition.y !== positionState.mousePosition.y) {
                    setPositionState((prev) => ({
                        ...prev,
                        mousePosition: newMousePosition,
                    }));
                }

                let newAbsolutePosition;

                if (!justCreated.current) {
                    newAbsolutePosition = {
                        x: (newMousePosition.x - positionState.offset.x) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
                        y: (newMousePosition.y - positionState.offset.y) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
                    };
                } else {
                    const { offsetLeft, offsetTop } = mouseFollowerRef.current;

                    newAbsolutePosition = {
                        x: (offsetLeft - (rectangleWidth / 2) * zoom) / zoom,
                        y: (offsetTop - (rectangleState.height / 2) * zoom) / zoom,
                    };
                }
                setRectangleState((prev) => ({ ...prev, absolutePosition: newAbsolutePosition }));
            } else {
                const newY = clientY - positionState.offset.y;
                const newHeight = Math.max(gridSize * 2, Math.min(gridSize * 4 * 24, Math.min(
                    centerSectionRef.current.offsetHeight - rectangleState.absolutePosition.y,
                    Math.round((newY - rectangleState.absolutePosition.y) / gridSize) * gridSize
                )));
                var canResize = true;

                if (rectangleState.absolutePosition.x === centerSectionRef.current.style.x - rectangleWidth / 2 && !isNote) {
                    for (let i = 0; i < rectangles.length; i++) {
                        const otherRect = rectangles[i];
                        if (otherRect.id !== rect.id && doesOverlap(otherRect.id, undefined, newHeight)) {
                            canResize = false;
                            break;
                        }
                    }
                }
                if (canResize) setRectangleState((prev) => ({ ...prev, height: newHeight }));
            }
        }
    }, [centerSectionRef, mouseFollowerRef, viewportState, zoom, positionState, isResizing, isNote, gridSize, rectangles, rectangleState, rectangleWidth, doesOverlap, getClientXY, adjustedMousePosition, getRelativePosition, state, rect.id, isEditing]);

    // Update the rectangle scale, opacity, and backgroundColor when dragging over the trashcan
    useEffect(() => {
        const bigScale = 1.075;

        const getScale = () => {
            if (rectangleState.deleting) return 0.7;
            if (isDragging && !isResizing) {
                if (isOverTrashcan) return 0.8;
                if (state === 1) return bigScale;
            }
            return 1;
        };

        const scale = getScale();

        setStyleProps.start({
            scale,
            opacity: rectangleState.deleting ? 0 :
                (isDragging && !isResizing && isOverTrashcan) ? 0.7 : 1,
            backgroundColor: (isDragging && !isResizing && isOverTrashcan) ?
                'rgba(255, 0, 0, 0.5)' : color,
            boxShadow: (isDragging && !isOverTrashcan) ? '-7px 7px 20px rgba(0, 0, 0, 0.3)' : '0px 0px 0px rgba(0, 0, 0, 0)',
            config: {
                tension: (scale === bigScale && styleProps.scale.get() > 1) ? 1000 : 2000,
                friction: 100
            }
        });
    }, [isDragging, isResizing, isOverTrashcan, rectangleState.deleting, setStyleProps, color, state, styleProps.scale]);

    // Handle mouse/touch down/up for the rectangle
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseRectangle);
            window.addEventListener('touchmove', handleMouseRectangle, { passive: false });

            setStartTime(performance.now());
        } else {
            if (dragged.current) {
                if (!zooming && !justCreated.current && !isResizing && performance.now() - startTime < 100)
                    setIsEditing(true);

                setStartTime(null);

                if (isOverTrashcan && !isResizing) {
                    const trashcan = document.querySelector('.trashcan');
                    trashcan.classList.remove('deleting');
                    document.body.style.cursor = 'default';
                    setRectangleState((prev) => ({ ...prev, deleting: true }));
                    setStyleProps.start({ scale: 0.7, opacity: 0 });

                    setTimeout(() => {
                        setRectangles((prevRectangles) => prevRectangles.filter((r) => r.id !== rect.id));
                    }, 200);

                    return;
                }

                if (!isResizing && !isNote) {
                    var overlapping = false;

                    if (showGhost) {
                        for (let i = 0; i < rectangles.length; i++) {
                            const otherRect = rectangles[i];
                            if (otherRect.id !== rect.id && doesOverlap(otherRect.id, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) {
                                overlapping = true;
                                break;
                            }
                        }
                    }

                    if (showGhost && !overlapping) {
                        const snappedY = centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - rectangleState.height,
                            Math.max(0, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) : Math.max(0, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize);
                        setRectangleState((prev) => ({ ...prev, absolutePosition: { x: centerSectionRef.current.style.x - rectangleWidth / 2, y: snappedY } }));
                    } else if (showGhost && overlapping) {
                        if (!justCreated.current) setRectangleState((prev) => ({ ...prev, absolutePosition: rectangleState.initialDragPosition }));
                        else {
                            const randomOffset = rectangleState.absolutePosition.x + rectangleWidth / 2 <= 0 ? (Math.random() * -150 - 150 - rectangleWidth) : (Math.random() * 150 + 150);
                            setRectangleState((prev) => ({ ...prev, absolutePosition: { x: randomOffset, y: rectangleState.absolutePosition.y } }));
                        }
                    }
                }
            } else {
                setStartTime(null);

                const { offsetLeft, offsetTop } = mouseFollowerRef.current;
                const newAbsolutePosition = {
                    x: (offsetLeft - (rectangleWidth / 2) * zoom) / zoom,
                    y: (offsetTop - (rectangleState.height / 2) * zoom) / zoom,
                };
                setRectangleState((prev) => ({ ...prev, absolutePosition: newAbsolutePosition }));

                setTimeout(() => {
                    if (!isNote) {
                        var overlapping = false;
                        var ghost = false;

                        const centerSectionStart = centerSectionRef.current.style.x - (rectangleWidth + 100);
                        const centerSectionEnd = centerSectionRef.current.style.x + 100;
                        if (!isResizing && rectangleState.absolutePosition.x > centerSectionStart && rectangleState.absolutePosition.x < centerSectionEnd
                            && rectangleState.absolutePosition.y >= -gridSize * 7 && rectangleState.absolutePosition.y <= (centerSectionRef.current ? centerSectionRef.current.offsetHeight - rectangleState.height + 7 * gridSize : 0)) {
                            ghost = true;
                        }
                        if (ghost) {
                            for (let i = 0; i < rectangles.length; i++) {
                                const otherRect = rectangles[i];
                                if (otherRect.id !== rect.id && doesOverlap(otherRect.id, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) {
                                    overlapping = true;
                                    break;
                                }
                            }
                            if (!overlapping) {
                                const snappedY = centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - rectangleState.height,
                                    Math.max(0, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) : Math.max(0, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize);
                                setRectangleState((prev) => ({ ...prev, absolutePosition: { x: centerSectionRef.current.style.x - rectangleWidth / 2, y: snappedY } }));
                            } else {
                                const randomOffset = Math.random() < 0.5 ? Math.random() * -100 - 300 : Math.random() * 100 + 300;
                                setRectangleState((prev) => ({ ...prev, absolutePosition: { x: rectangleState.absolutePosition.x + randomOffset, y: rectangleState.absolutePosition.y } }));
                            }
                        }
                    }
                }, 0);
            }

            setIsResizing(false);
            justCreated.current = false;
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleMouseRectangle);
            window.removeEventListener('touchmove', handleMouseRectangle);
            setState(0);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseRectangle);
            window.removeEventListener('touchmove', handleMouseRectangle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, rectangleState.initialDragPosition, rect.id, centerSectionRef]);

    // Show ghost when rectangle is in the center section
    useEffect(() => {
        const centerSectionStart = centerSectionRef.current.style.x - (rectangleWidth + 100);
        const centerSectionEnd = centerSectionRef.current.style.x + 100;
        if (!isResizing && rectangleState.absolutePosition.x > centerSectionStart && rectangleState.absolutePosition.x < centerSectionEnd
            && rectangleState.absolutePosition.y >= -gridSize * 7 && rectangleState.absolutePosition.y <= (centerSectionRef.current ? centerSectionRef.current.offsetHeight - rectangleState.height + 7 * gridSize : 0)) {
            setShowGhost(true);
        } else {
            setShowGhost(false);
        }
    }, [rectangleState.absolutePosition, viewportState, isResizing, gridSize, centerSectionRef, rectangleState.height, rectangleWidth]);

    // Update rectangle position when zooming
    useEffect(() => {
        setPositionState((prev) => ({
            ...prev,
            rectanglePosition: {
                x: getRelativePosition(rectangleState.absolutePosition).x * zoom - viewportState.cameraPosition.x,
                y: getRelativePosition(rectangleState.absolutePosition).y * zoom - viewportState.cameraPosition.y,
            },
        }));
    }, [rectangleState.absolutePosition, zoom, viewportState.cameraPosition, getRelativePosition]);

    // Handle click outside to exit editing mode
    useEffect(() => {
        const handleClickOutside = (event) => {
            event.preventDefault();
            if (isEditing && !event.target.closest(`.rectangle-${rect.id}`)) {
                setIsEditing(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('touchstart', handleClickOutside, { passive: false });
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isEditing, rect.id]);

    // Handle rectangle deletion when dragging over the trashcan
    useEffect(() => {
        if (!isOverTrashcan || !isDragging) return;

        if (isOverTrashcan && isDragging && !isResizing) {
            const trashcan = document.querySelector('.trashcan');
            trashcan.classList.add('deleting');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOverTrashcan]);

    // Convert grid position to time
    const gridPositionToTime = (position) => {
        const totalMinutes = position / gridSize * 15;
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        return { days, hours, minutes };
    };

    // Format time as HH:MM
    const formatTime = ({ hours, minutes }) => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Calculate duration in HH:MM
    const calculateDuration = (height) => {
        const totalMinutes = height / gridSize * 15;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };


    // Function to render the rectangle
    const renderRectangle = (isVisible) => {
        const isSmallRectangle = rectangleState.height < gridSize * 4;
        const snappedY = Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize;
        const maxY = centerSectionRef.current.offsetHeight - rectangleState.height;
        const ghostY = Math.min(maxY, Math.max(0, snappedY));

        return (
            <>
                <animated.div
                    className={`rectangle-outline size-${rect.size}`}
                    style={{
                        transform: rectangleProps.x.to((x) => {
                            const relativePos = getRelativePosition({
                                x: rectangleProps.x.get(),
                                y: rectangleProps.y.get(),
                            });
                            return `translate3d(${relativePos.x - xOffset.get()}px, ${relativePos.y}px, 0) rotate(${(x - rectangleState.absolutePosition.x - xOffset.get()) / 10}deg) scale(${styleProps.scale.get()})`;
                        }),
                        height: rectangleProps.height,
                        width: rectangleWidth,
                        outline: `3px solid rgba(36,47,54, 1)`,
                        border: `1px solid ${color}`,
                        borderTopLeftRadius: isNote ? 0 : (rect.border & 1) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderTopRightRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 1) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderBottomLeftRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 2) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderBottomRightRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 2) ? 0 : RECTANGLE_BORDER_RADIUS,
                        position: 'absolute',
                        zIndex: isNote ? '98' : (isDragging ? '99' : '9'),
                        opacity: styleProps.opacity,
                        visibility: isVisible ? 'visible' : 'hidden',
                        pointerEvents: 'none',
                    }}
                />

                <animated.div
                    className={`rectangle ${isSmallRectangle && !isNote ? "small" : ""} rectangle-${rect.id} size-${rect.size} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isNote ? 'note' : ''}`}
                    style={{
                        transform: rectangleProps.x.to((x) => {
                            const relativePos = getRelativePosition({
                                x: rectangleProps.x.get(),
                                y: rectangleProps.y.get(),
                            });
                            return `translate3d(${relativePos.x - xOffset.get()}px, ${relativePos.y}px, 0) rotate(${(x - rectangleState.absolutePosition.x - xOffset.get()) / 10}deg) scale(${styleProps.scale.get()})`;
                        }),
                        height: rectangleProps.height,
                        pointerEvents: 'all',
                        position: 'absolute',
                        backgroundColor: styleProps.backgroundColor,
                        boxShadow: styleProps.boxShadow,
                        zIndex: isNote ? '99' : (isDragging || isEditing ? '100' : '10'),
                        visibility: isVisible ? 'visible' : 'hidden',
                        opacity: styleProps.opacity,
                        borderTopLeftRadius: isNote ? 0 : (rect.border & 1) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderTopRightRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 1) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderBottomLeftRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 2) ? 0 : RECTANGLE_BORDER_RADIUS,
                        borderBottomRightRadius: isNote ? RECTANGLE_BORDER_RADIUS : (rect.border & 2) ? 0 : RECTANGLE_BORDER_RADIUS,
                        outline: `3px solid rgba(36, 47, 54, ${(rectangleState.absolutePosition.x === centerSectionRef.current.style.x - rectangleWidth / 2 || isOverTrashcan) ? 0 : 0.75})`,
                    }}
                >
                    <div className={`${isSmallRectangle ? "rectangle-header-small" : "rectangle-header"}`}>
                        {!isNote && (
                            <>
                                {!isSmallRectangle ? (
                                    <>
                                        {icon}
                                        <div className='rectangle-header-text'>
                                            {((showGhost || rectangleState.absolutePosition.x === centerSectionRef.current.style.x - rectangleWidth / 2) && (!isOverTrashcan || !isDragging || isResizing)) ?
                                                `${formatTime(gridPositionToTime(ghostY))}-${formatTime(gridPositionToTime(ghostY + rectangleState.height))}` :
                                                `${calculateDuration(rectangleState.height)}h`}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ flexDirection: "column" }}>
                                        <div className='rectangle-icon-small'>{icon}</div>
                                        <div className='rectangle-time' style={{ transform: rectangleState.height <= gridSize * 2 ? 'translateY(1ch)' : 'translateY(0)' }}>
                                            {((showGhost || rectangleState.absolutePosition.x === centerSectionRef.current.style.x - rectangleWidth / 2) && (!isOverTrashcan || !isDragging || isResizing)) ?
                                                `${formatTime(gridPositionToTime(ghostY))}` :
                                                `${calculateDuration(rectangleState.height)}h`}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {isEditing ? (
                        <textarea
                            className={`UI ${isSmallRectangle && !isNote ? "rectangle-text-area-small" : "rectangle-text-area"} ${isNote ? 'note' : ''}`}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            ref={textareaRef}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            spellCheck="false"
                            autoFocus
                            style={{ fontSize: 'medium', fontWeight: isNote ? '600' : '450' }}
                            onFocus={(e) => {
                                const length = e.target.value.length;
                                e.target.setSelectionRange(length, length);
                            }}
                        />
                    ) : (
                        <div className={`${isSmallRectangle && !isNote ? "rectangle-text-small" : "rectangle-text"} ${isNote ? 'note' : ''}`} style={{ fontSize: 'medium', fontWeight: isNote ? '600' : '450' }}>
                            {text}
                        </div>
                    )}
                    {/* Add the resize hint */}
                    <svg className={`resize-hint ${isDragging ? 'dragging' : 'hidden'} ${isDragging && isResizing ? 'resizing' : ''}`} viewBox="-5 -5 50 30"
                        style={{ pointerEvents: 'none' }} transform="translate(-10, -8) scale(1.3)">
                        <path
                            d="M 41 0 V 3 C 41 12 34 19 24 19 L 0 19"
                            fill="none"
                            stroke="white"
                            strokeWidth="7"
                            strokeLinecap="round"
                            style={{ pointerEvents: 'none' }}
                        />
                    </svg>
                </animated.div>
            </>
        );
    };

    return (
        <div>
            {renderRectangle(true)}
            {/* {renderRectangle(!refresh)} */}
            {!isNote && isDragging && showGhost && !isOverTrashcan && (
                <div className={`ghost size-${size}`}
                    style={{
                        left: `${0}px`,
                        top: `${centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - rectangleState.height,
                            Math.max(0, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) : 0}px`,
                        position: 'absolute',
                        height: rectangleState.height,
                        backgroundColor: color,
                        opacity: 0.5,
                        zIndex: 15
                    }}
                />
            )}
        </div>
    );
});

// Only re-render if the props change
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.rect.id === nextProps.rect.id &&
        prevProps.rect.x === nextProps.rect.x &&
        prevProps.rect.y === nextProps.rect.y &&
        prevProps.rect.height === nextProps.rect.height &&
        prevProps.isDragging === nextProps.isDragging &&
        prevProps.isOverTrashcan === nextProps.isOverTrashcan &&
        prevProps.color === nextProps.color &&
        prevProps.size === nextProps.size &&
        prevProps.icon === nextProps.icon &&
        prevProps.isNote === nextProps.isNote &&
        prevProps.rect.border === nextProps.rect.border
    );
};

export default React.memo(Rectangle, areEqual);