import React, { useEffect, useRef } from 'react';
import { Delete, DeleteOutline } from '@mui/icons-material';

const Trashcan = ({ setIsOverTrashcan }) => {
    const trashcanRef = useRef(null);
    const deleting = useRef(false);

    useEffect(() => {
        if (trashcanRef.current) {
            const handleClassChange = () => {
                deleting.current = trashcanRef.current.classList.contains('deleting');
            };

            const observer = new MutationObserver(handleClassChange);
            observer.observe(trashcanRef.current, { attributes: true, attributeFilter: ['class'] });

            return () => {
                observer.disconnect();
            };
        }
    }, []);

    const handleEnter = () => {
        setIsOverTrashcan(true);
    };

    const handleLeave = () => {
        setIsOverTrashcan(false);
        deleting.current = false;
        trashcanRef.current.classList.remove('deleting');
    };

    const handleTouchMove = (event) => {
        if (trashcanRef.current) {
            const touch = event.touches[0];
            const trashcanRect = trashcanRef.current.getBoundingClientRect();
            const isOver = (
                touch.clientX >= trashcanRect.left &&
                touch.clientX <= trashcanRect.right &&
                touch.clientY >= trashcanRect.top &&
                touch.clientY <= trashcanRect.bottom
            );
            setIsOverTrashcan(isOver);

            if (!isOver) {
                handleLeave();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


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
            {deleting.current ? <DeleteOutline /> : <Delete />}
        </div>
    );
};

export default Trashcan;