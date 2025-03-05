import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { Delete, DeleteOutline } from '@mui/icons-material';

const Trashcan = React.memo(({ activeRectangle, setOverTrashcanId, clearData }) => {
    const trashcanRef = useRef(null);
    const [deleting, setDeleting] = useState(false);
    const [pressing, setPressing] = useState(false);
    const timerRef = useRef(null);

    // Memoize SVG icons
    const deleteIcon = useMemo(() => <Delete style={{ pointerEvents: 'none' }} />, []);
    const deleteOutlineIcon = useMemo(() => <DeleteOutline style={{ pointerEvents: 'none' }} />, []);

    // Start the long press timer
    const startLongPressTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setPressing(true);

        timerRef.current = setTimeout(() => {
            if (clearData) {
                clearData();
                setDeleting(true);

                setTimeout(() => {
                    setPressing(false);
                    setDeleting(false);
                }, 500);
            }
        }, 3000);
    }, [clearData]);

    // Clear the timer when press is released
    const clearLongPressTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setPressing(false);
    }, []);

    // Handle mouse down event
    const handleMouseDown = useCallback((e) => {
        if (e.button === 0) startLongPressTimer();
    }, [startLongPressTimer]);

    // Handle mouse up event
    const handleMouseUp = useCallback(() => {
        clearLongPressTimer();
    }, [clearLongPressTimer]);

    // Handle touch start event
    const handleTouchStart = useCallback(() => {
        startLongPressTimer();
    }, [startLongPressTimer]);

    // Handle touch end event
    const handleTouchEnd = useCallback(() => {
        clearLongPressTimer();
    }, [clearLongPressTimer]);

    // Handle hover enter
    const handleEnter = useCallback((e) => {
        if (e.touches && e.touches.length > 1) return;
        if (activeRectangle !== null) setOverTrashcanId(activeRectangle);
    }, [activeRectangle, setOverTrashcanId]);

    // Handle hover leave
    const handleLeave = useCallback(() => {
        setOverTrashcanId(null);
        setDeleting(false);
        clearLongPressTimer();
        if (trashcanRef.current) {
            trashcanRef.current.classList.remove('deleting');
        }
    }, [setOverTrashcanId, clearLongPressTimer]);

    // Handle touch movement detection
    const handleTouchMove = useCallback((event) => {
        if (trashcanRef.current && activeRectangle !== null) {
            const touch = event.touches[0];
            const trashcanRect = trashcanRef.current.getBoundingClientRect();
            const isOver = (
                touch.clientX >= trashcanRect.left &&
                touch.clientX <= trashcanRect.right &&
                touch.clientY >= trashcanRect.top &&
                touch.clientY <= trashcanRect.bottom
            );

            if (isOver) {
                setOverTrashcanId(activeRectangle);
            } else {
                handleLeave();
            }
        }
    }, [activeRectangle, setOverTrashcanId, handleLeave]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    // Track class changes for deletion animation
    useEffect(() => {
        if (trashcanRef.current) {
            const observer = new MutationObserver(() => {
                setDeleting(trashcanRef.current.classList.contains('deleting'));
            });
            observer.observe(trashcanRef.current, {
                attributes: true,
                attributeFilter: ['class']
            });
            return () => observer.disconnect();
        }
    }, []);

    // Add touchmove listener
    useEffect(() => {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [handleTouchMove]);


    return (
        <div
            ref={trashcanRef}
            className={`UI trashcan ${pressing ? 'pressing' : ''}`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onTouchStart={(e) => { handleEnter(e); handleTouchStart(); }}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {deleting ? deleteOutlineIcon : deleteIcon}
        </div>
    );
});

export default Trashcan;