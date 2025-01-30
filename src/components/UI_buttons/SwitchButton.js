import React, { useState } from 'react';

const SwitchButton = ({ group, activeGroup, setActiveGroup }) => {
    const [isTouched, setIsTouched] = useState(false);

    const handleSwitch = () => {
        setActiveGroup(group);
    };

    const handleTouchStart = () => {
        setIsTouched(true);
    };

    const handleTouchEnd = () => {
        setIsTouched(false);
        handleSwitch();
    };

    return (
        <button
            className={`UI switch-button ${group === activeGroup ? 'selected' : ''} ${isTouched ? 'hover' : ''}`}
            onClick={handleSwitch}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {group}
        </button>
    );
};

export default SwitchButton;