import React, { useState, useRef, useEffect, useCallback } from 'react';

const Button = ({ id, text, color, size, createRectangle, zoom, mouseFollowerRef, icon, group, activeGroup }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const buttonRef = useRef(null);
    const hasExecutedRef = useRef(false);
    const startRef = useRef(0);

    const resetButtonPosition = () => {
        const button = buttonRef.current;
        if (button) {
            button.style.transform = 'translateX(-3ch)';
            button.classList.remove('rectangle-button-in', 'rectangle-button-out', 'no-animation');
            button.classList.add('no-animation');
        }
        setIsDragging(false);
    };

    const handleMouseDown = (e) => {
        if (group !== activeGroup && group !== 0) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setStartX(clientX);
        setIsDragging(true);
        hasExecutedRef.current = false;
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || hasExecutedRef.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const distanceMoved = clientX - startX;
        const distanceToDrag = window.innerWidth * 0.1 + parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;

        if (distanceMoved >= distanceToDrag) {
            const { offsetLeft, offsetTop } = mouseFollowerRef.current;
            createRectangle(offsetLeft / zoom, offsetTop / zoom, 80, color, size, icon, group);
            hasExecutedRef.current = true;
            resetButtonPosition();
        } else {
            const dampingFactor = Math.min(1, 0.5 + Math.pow(distanceMoved / (distanceToDrag * 3), 0.9));
            const adjustedDistance = Math.max(0, distanceMoved * (1 - dampingFactor));
            const button = buttonRef.current;
            if (button) {
                button.style.transform = `translateX(calc(${adjustedDistance}px - 2ch))`;
            }
        }
    }, [isDragging, startX, mouseFollowerRef, createRectangle, zoom, color, size, icon, group]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) resetButtonPosition();
    }, [isDragging]);

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

    useEffect(() => {
        const moveListener = (e) => handleMouseMove(e);
        const upListener = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', moveListener);
            document.addEventListener('mouseup', upListener);
            document.addEventListener('touchmove', moveListener);
            document.addEventListener('touchend', upListener);
        } else {
            document.removeEventListener('mousemove', moveListener);
            document.removeEventListener('mouseup', upListener);
            document.removeEventListener('touchmove', moveListener);
            document.removeEventListener('touchend', upListener);
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
            style={{ display: group !== activeGroup && group !== 0 && startRef.current < 2 ? 'none' : '', backgroundColor: color, zIndex: group === activeGroup || group === 0 ? 100 : 90 }}
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => { handleMouseDown(e); buttonRef.current.style.transform = 'translateX(-2ch)'; }}
            onMouseEnter={() => { buttonRef.current.style.transform = 'translateX(-2ch)'; }}
            onMouseLeave={() => { buttonRef.current.style.transform = 'translateX(-3ch)'; }}
            onTouchEnd={() => { buttonRef.current.style.transform = 'translateX(-3ch)'; }}
            onAnimationEnd={() => {
                if (group === activeGroup || group === 0) {
                    buttonRef.current.classList.add('no-animation');
                    buttonRef.current.style.transform = 'translateX(-3ch)';
                }
            }}
        >
            {text}
            <div style={{ pointerEvents: 'none' }}>{icon}</div>
        </button>
    );
};

export default Button;
