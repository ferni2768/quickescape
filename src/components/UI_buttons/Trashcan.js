import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { Delete, DeleteOutline } from '@mui/icons-material';

const Trashcan = React.memo(({ activeRectangle, setOverTrashcanId }) => {
    const trashcanRef = useRef(null);
    const [deleting, setDeleting] = useState(false);

    // Memoize SVG icons
    const deleteIcon = useMemo(() => <Delete style={{ pointerEvents: 'none' }} />, []);
    const deleteOutlineIcon = useMemo(() => <DeleteOutline style={{ pointerEvents: 'none' }} />, []);

    // Handle hover enter
    const handleEnter = useCallback(() => {
        if (activeRectangle !== null) setOverTrashcanId(activeRectangle);
    }, [activeRectangle, setOverTrashcanId]);

    // Handle hover leave
    const handleLeave = useCallback(() => {
        setOverTrashcanId(null);
        setDeleting(false);
        if (trashcanRef.current) {
            trashcanRef.current.classList.remove('deleting');
        }
    }, [setOverTrashcanId]);

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
            className="UI trashcan"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onTouchStart={handleEnter}
            onTouchEnd={handleLeave}
            onTouchCancel={handleLeave}
        >
            {deleting ? deleteOutlineIcon : deleteIcon}
        </div>
    );
});

export default Trashcan;