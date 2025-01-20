import React, { useState, useRef, useEffect, useCallback } from 'react';

const Button = ({ id, text, color, size, createRectangle, zoom, mouseFollowerRef, icon, group }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const buttonRef = useRef(null);
    const hasExecutedRef = useRef(false);

    const handleMouseDown = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setStartX(clientX);
        setIsDragging(true);
        hasExecutedRef.current = false;
    };

    const handleMouseMove = useCallback((e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        if (isDragging && !hasExecutedRef.current) {
            const distanceMoved = clientX - startX;
            const distanceToDrag = window.innerWidth * 0.1 + parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;

            const dampingFactor = Math.min(1, 0.5 + Math.pow(distanceMoved / (distanceToDrag * 3), 1.1));
            const adjustedDistance = Math.max(0, distanceMoved * (1 - dampingFactor));

            if (distanceMoved >= distanceToDrag) {
                const { offsetLeft, offsetTop } = mouseFollowerRef.current;
                createRectangle(offsetLeft / zoom, offsetTop / zoom, 80, color, size, icon, group);
                hasExecutedRef.current = true;
                setIsDragging(false);
                resetButtonPosition();
            } else {
                const button = buttonRef.current;
                if (button) {
                    button.style.transform = `translateX(${adjustedDistance}px)`;
                }
            }
        }
    }, [isDragging, startX, mouseFollowerRef, createRectangle, zoom, color, size, icon, group]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            resetButtonPosition();
        }
    }, [isDragging]);

    const resetButtonPosition = () => {
        setIsDragging(false);
        const button = buttonRef.current;
        if (button) {
            button.style.transition = 'transform 0.3s ease-out';
            button.style.transform = 'translateX(0)';
            setTimeout(() => {
                button.style.transition = '';
            }, 300);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleMouseMove);
            document.addEventListener('touchend', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    return (
        <button
            ref={buttonRef}
            id={`button-${id}`}
            className="UI rectangle-button"
            style={{ backgroundColor: color }}
            onMouseDown={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
        >
            {text}
            <div style={{ position: 'relative', top: 0, right: 0, pointerEvents: 'none' }}> {icon} </div>
        </button>
    );
};

export default Button;