import React from 'react';

const Trashcan = ({ icon, deactivateRectangle, activeRectangle }) => {

    const handleDrop = () => {
        if (activeRectangle !== null) {
            deactivateRectangle(activeRectangle);
        }
    };

    return (
        <div
            className="UI trashcan"
            onMouseUp={handleDrop}
            onTouchEnd={handleDrop}
        >
            {icon}
        </div>
    );
};

export default Trashcan;