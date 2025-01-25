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


    return (
        <div
            ref={trashcanRef}
            className="UI trashcan"
            onMouseEnter={() => {
                setIsOverTrashcan(true);
            }}
            onMouseLeave={() => {
                setIsOverTrashcan(false);
                deleting.current = false;
                trashcanRef.current.classList.remove('deleting');
            }}
        >
            {deleting.current ? <DeleteOutline /> : <Delete />}
        </div>
    );
};

export default Trashcan;