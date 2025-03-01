import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ICON_MAP, COLOR_MAP } from '../../Controller';

const Button = React.memo(({ id, text, colorId, size, createRectangle, zoom, mouseFollowerRef, iconId, group, activeGroup }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [shouldRender, setShouldRender] = useState(false);
    const buttonRef = useRef(null);
    const hasExecutedRef = useRef(false);
    const startRef = useRef(0);
    const icon = ICON_MAP[iconId];

    const resetButtonPosition = () => {
        const button = buttonRef.current;
        if (button) {
            button.style.transform = 'translateX(-6ch)';
            button.classList.remove('rectangle-button-in', 'rectangle-button-out', 'no-animation');
            button.classList.add('no-animation');
        }
        setIsDragging(false);
    };

    useEffect(() => {
        if (group === activeGroup) {
            setShouldRender(true);
        } else if (shouldRender) {
            const button = buttonRef.current;
            const handleAnimationEnd = () => {
                if (!button.classList.contains('rectangle-button-in'))
                    setShouldRender(false);
            };

            button.addEventListener('animationend', handleAnimationEnd);
            return () => button.removeEventListener('animationend', handleAnimationEnd);
        }
    }, [group, activeGroup, shouldRender]);

    useEffect(() => {
        const button = buttonRef.current;
        if (!button) return;

        const handleAnimationEnd = () => {
            if (!button.classList.contains('rectangle-button-in'))
                setShouldRender(false);
        };

        if (group === activeGroup)
            setShouldRender(true);
        else if (shouldRender)
            button.addEventListener('animationend', handleAnimationEnd);

        return () => {
            button.removeEventListener('animationend', handleAnimationEnd);
        };
    }, [group, activeGroup, shouldRender]);

    const handleMouseDown = (e) => {
        if (group !== activeGroup && group !== 0) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setStartX(clientX);
        setIsDragging(true);
        hasExecutedRef.current = false;
    };

    const handleMouseUp = useCallback(() => {
        if (isDragging) resetButtonPosition();
    }, [isDragging]);

    const handleMouseMove = useCallback((e) => {
        if (e.touches && e.touches.length > 1) { handleMouseUp(); return; }
        if (!isDragging || hasExecutedRef.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const distanceMoved = clientX - startX;
        const distanceToDrag = window.innerWidth * 0.1 + parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;

        if (distanceMoved >= distanceToDrag) {
            const { offsetLeft, offsetTop } = mouseFollowerRef.current;
            createRectangle(offsetLeft / zoom, offsetTop / zoom, 80, colorId, size, iconId, group);
            hasExecutedRef.current = true;
            resetButtonPosition();
        } else {
            const dampingFactor = Math.min(0.8, 0.5 + Math.pow(distanceMoved / (distanceToDrag * 3), 0.9));
            const adjustedDistance = Math.max(0, Math.min(distanceMoved, distanceMoved * (1 - dampingFactor)));
            const button = buttonRef.current;
            if (button) button.style.transform = `translateX(calc(${adjustedDistance}px - 5ch))`;
        }
    }, [isDragging, startX, mouseFollowerRef, createRectangle, zoom, colorId, size, iconId, group, handleMouseUp]);

    // Animate the button when the active group changes
    useEffect(() => {
        if (startRef.current < 2) {
            startRef.current++;
            buttonRef.current.style.animationDuration = "0s";
        } else { buttonRef.current.style.animationDuration = "0.5s"; }

        const button = buttonRef.current;
        if (group === activeGroup) {
            if (button) {
                button.classList.add('rectangle-button-in');
                button.classList.remove('rectangle-button-out', 'no-animation');
            }
        } else {
            if (button) {
                button.classList.add('rectangle-button-out');
                button.classList.remove('rectangle-button-in', 'no-animation');
            }
        }
    }, [activeGroup, group]);

    // Add event listeners for mouse and touch events
    useEffect(() => {
        const moveListener = (e) => handleMouseMove(e);
        const upListener = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', moveListener);
            document.addEventListener('mouseup', upListener);
            document.addEventListener('touchmove', moveListener, { passive: false });
            document.addEventListener('touchend', upListener, { passive: false });
        } else {
            document.removeEventListener('mousemove', moveListener);
            document.removeEventListener('mouseup', upListener);
            document.removeEventListener('touchmove', moveListener, { passive: false });
            document.removeEventListener('touchend', upListener, { passive: false });
        }

        return () => {
            document.removeEventListener('mousemove', moveListener);
            document.removeEventListener('mouseup', upListener);
            document.removeEventListener('touchmove', moveListener);
            document.removeEventListener('touchend', upListener);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    return (
        <button
            ref={buttonRef}
            id={`button-${id}`}
            className={`UI rectangle-button no-animation`}
            style={{
                display: (!shouldRender && group !== 0) || (group !== activeGroup && group !== 0 && startRef.current < 2) ? 'none' : '',
                backgroundColor: COLOR_MAP[colorId],
                zIndex: group === activeGroup || group === 0 ? 100 : 90,
                width: group === 0 ? '15ch' : '16ch'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => { handleMouseDown(e); buttonRef.current.style.transform = 'translateX(-5ch)'; }}
            onMouseEnter={() => { buttonRef.current.style.transform = 'translateX(-5ch)'; }}
            onMouseLeave={() => { buttonRef.current.style.transform = 'translateX(-6ch)'; }}
            onTouchEnd={() => { buttonRef.current.style.transform = 'translateX(-6ch)'; }}
            onAnimationEnd={() => {
                if (group === activeGroup || group === 0) {
                    buttonRef.current.classList.add('no-animation');
                    buttonRef.current.style.transform = 'translateX(-6ch)';
                }
            }}
        >
            {text}
            <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'bottom' }}>{icon}</div>
        </button>
    );
});

// Only re-render if the props change
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.id === nextProps.id &&
        prevProps.text === nextProps.text &&
        prevProps.color === nextProps.color &&
        prevProps.colorId === nextProps.colorId &&
        prevProps.size === nextProps.size &&
        prevProps.zoom === nextProps.zoom &&
        prevProps.iconId === nextProps.iconId &&
        prevProps.group === nextProps.group &&
        prevProps.activeGroup === nextProps.activeGroup
    );
};

export default React.memo(Button, areEqual);