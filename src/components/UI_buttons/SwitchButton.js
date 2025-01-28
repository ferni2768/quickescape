import React from 'react';

const SwitchButton = ({ group, activeGroup, setActiveGroup }) => {
    const handleSwitch = () => {
        setActiveGroup(group);
    };

    return (
        <button
            className={`UI switch-button ${group === activeGroup ? 'selected' : ''}`}
            onClick={handleSwitch}
            onTouchEnd={handleSwitch}
        >
            {group}
        </button>
    );
};

export default SwitchButton;