import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { RECTANGLE_SIZES } from '../Controller';
import './styles/Rectangle.css';

const Rectangle = React.memo(({ viewportState, zoom, centerSectionRef, rect, adjustedMousePosition, gridSize,
    rectangles, setRectangles, getClientXY, isDragging, color, size, icon, isNote }) => {

    // State object with state variables
    const [rectangleState, setRectangleState] = useState({
        absolutePosition: { x: rect.x, y: rect.y },
        initialDragPosition: { x: rect.x, y: rect.y },
        height: rect.height || 50
    });

    // State variables for dragging and resizing
    const [state, setState] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [showGhost, setShowGhost] = useState(false);
    const rectangleWidth = RECTANGLE_SIZES[size];

    // State variables for rectangle text editing
    const [startTime, setStartTime] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState("");
    const [editDistance, setEditDistance] = useState(0);
    const textareaRef = useRef(null);

    // Spring animation for the rectangle
    const rectangleProps = useSpring({
        x: rectangleState.absolutePosition.x,
        y: rectangleState.absolutePosition.y,
        height: rectangleState.height,
        config: { mass: 1, tension: 170, friction: 26 },
    });

    // State object with mouse position variables
    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
    });

    // Utility to check if two rectangles overlap
    const doesOverlap = useCallback((id, customPos1, customHeight) => {
        if (rectangles[id - 1].x !== centerSectionRef.current.style.x - (RECTANGLE_SIZES[rectangles[id - 1].size] / 2)) return false;

        const thereshold = 5;
        const pos1 = customPos1 !== undefined ? customPos1 : rectangleState.absolutePosition.y;
        const hei = customHeight !== undefined ? customHeight : rectangleState.height;

        const top1 = pos1 + thereshold;
        const bot1 = top1 + hei - thereshold;

        const otherRect = rectangles[id - 1];
        const top2 = otherRect.y + thereshold;
        const bot2 = top2 + otherRect.height - thereshold;

        return (top1 < top2 && bot1 > top2) || (top1 >= top2 && top1 < bot2);
    }, [rectangleState.absolutePosition, rectangleState.height, rectangles, centerSectionRef]);

    // Update rectangle data when dragging or resizing
    useEffect(() => {
        setRectangles((prevRectangles) =>
            prevRectangles.map((r) =>
                r.id === rect.id ? { ...r, x: rectangleState.absolutePosition.x, y: rectangleState.absolutePosition.y, height: rectangleState.height } : r
            )
        );
    }, [rectangleState, rect.id, setRectangles]);

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

        if (state === 0) {
            setState(1);
            event.stopPropagation();

            const { clientX, clientY } = getClientXY(event);
            const currentRectBottom = rectangleState.absolutePosition.y + rectangleState.height;
            setRectangleState((prev) => ({ ...prev, initialDragPosition: { ...rectangleState.absolutePosition } }));

            if (adjustedMousePosition >= currentRectBottom - 15 && adjustedMousePosition <= currentRectBottom) {
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

            const dx = Math.abs(clientX - rectangleState.absolutePosition.x);
            const dy = Math.abs(clientY - rectangleState.absolutePosition.y);
            setEditDistance(Math.sqrt(dx * dx + dy * dy));
        } else if (state === 1) {

            if (event.touches && event.touches.length > 1) {
                setState(0);
                return;
            }

            const { clientX, clientY } = getClientXY(event);
            if (!isResizing) {
                const newMousePosition = { x: clientX, y: clientY };
                setPositionState((prev) => ({
                    ...prev,
                    mousePosition: newMousePosition,
                }));
                const newAbsolutePosition = {
                    x: (newMousePosition.x - positionState.offset.x) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
                    y: (newMousePosition.y - positionState.offset.y) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
                };
                setRectangleState((prev) => ({ ...prev, absolutePosition: newAbsolutePosition }));
            } else {
                const newY = clientY - positionState.offset.y;
                const newHeight = Math.max(20, Math.min(300, Math.round((newY - rectangleState.absolutePosition.y) / gridSize) * gridSize));
                var canResize = true;

                if (rectangleState.absolutePosition.x === centerSectionRef.current.style.x - rectangleWidth / 2 && !isNote) {
                    for (let i = 1; i < rectangles.length + 1; i++) {
                        if ((rectangles[i - 1].id !== rect.id) && doesOverlap(i, undefined, newHeight)) {
                            canResize = false;
                            break;
                        }
                    }
                }
                if (canResize) setRectangleState((prev) => ({ ...prev, height: newHeight }));
            }
        }
    }, [centerSectionRef, viewportState, zoom, positionState, isResizing, isNote, gridSize, rectangles, rectangleState, rectangleWidth, doesOverlap, getClientXY, adjustedMousePosition, getRelativePosition, state, rect.id]);

    // Handle mouse/touch down/up for the rectangle
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseRectangle);
            window.addEventListener('touchmove', handleMouseRectangle, { passive: false });
        } else {
            if (!isResizing && !isNote) {
                var overlapping = false;

                if (showGhost) {
                    for (let i = 1; i < rectangles.length + 1; i++) {
                        if ((rectangles[i - 1].id !== rect.id) && doesOverlap(i, Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize)) {
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
                    setRectangleState((prev) => ({ ...prev, absolutePosition: rectangleState.initialDragPosition }));
                }
            }

            setIsResizing(false);
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
    }, [isDragging, rectangleState.initialDragPosition, rect.id]);

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
            if (isEditing && !event.target.closest(`.rectangle-${rect.id}`)) {
                setIsEditing(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('touchstart', handleClickOutside);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isEditing, rect.id]);

    // Focus on the textarea when editing
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.focus();
            // Move the cursor to the end of the text
            textarea.setSelectionRange(text.length, text.length);
        }
    }, [isEditing, text.length]);

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


    return (
        <div>
            <animated.div
                className={`rectangle rectangle-${rect.id} size-${rect.size} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
                style={{
                    transform: rectangleProps.x.to((x) => {
                        const relativePos = getRelativePosition({
                            x: rectangleProps.x.get(),
                            y: rectangleProps.y.get(),
                        });
                        return `translate3d(${relativePos.x}px, ${relativePos.y}px, 0) rotate(${(x - rectangleState.absolutePosition.x) / 10}deg)`;
                    }),
                    height: rectangleProps.height,
                    position: 'absolute',
                    backgroundColor: color,
                    zIndex: isNote ? '99' : (isDragging ? '100' : '10')
                }}
                onMouseDown={() => { setStartTime(performance.now()); setEditDistance(0); }}
                onTouchStart={() => { setStartTime(performance.now()); setEditDistance(0); }}
                onMouseUp={() => {
                    if (performance.now() - startTime < 300 && editDistance <= 30 / zoom) setIsEditing(true);
                    setStartTime(null);
                    setEditDistance(0);
                }}
                onTouchEnd={() => {
                    if (performance.now() - startTime < 300 && editDistance <= 30 / zoom) setIsEditing(true);
                    setStartTime(null);
                    setEditDistance(0);
                }}
            >
                <div className='rectangle-header'>
                    {icon}
                    {!isNote ? showGhost ?
                        `${formatTime(gridPositionToTime(Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize))}-${formatTime(gridPositionToTime(Math.round(rectangleState.absolutePosition.y / gridSize) * gridSize + rectangleState.height))}` :
                        (rectangleState.absolutePosition.x === centerSectionRef.current.style.x ?
                            `${formatTime(gridPositionToTime(rectangleState.absolutePosition.y))}-${formatTime(gridPositionToTime(rectangleState.absolutePosition.y + rectangleState.height))}` :
                            `${calculateDuration(rectangleState.height)}h`) : null}
                </div>
                {isEditing ? (
                    <textarea
                        className="UI rectangle-text-area"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        ref={textareaRef}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        spellCheck="false"
                        autoFocus
                    />
                ) : (
                    <div className="rectangle-text"> {text} </div>
                )}
            </animated.div>

            {!isNote && isDragging && showGhost && (
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

export default Rectangle;