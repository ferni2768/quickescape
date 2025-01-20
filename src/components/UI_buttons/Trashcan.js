import React, { useRef } from 'react';

const Trashcan = ({ icon, deactivateRectangle, activeRectangle }) => {
    const trashcanRef = useRef(null);

    const handleDrop = () => {
        if (activeRectangle !== null) {
            deactivateRectangle(activeRectangle);
            trashcanRef.current.classList.remove('deleting');
        }
    };

    return (
        <div
            ref={trashcanRef}
            className="UI trashcan"
            onMouseUp={handleDrop}
            onTouchEnd={handleDrop}
            onMouseEnter={() => { if (activeRectangle !== null) trashcanRef.current.classList.add('deleting'); }}
        >
            {icon}
        </div>
    );
};

export default Trashcan;