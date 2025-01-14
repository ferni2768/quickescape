import React from 'react';
import '../App.css';

const SwitchButton = ({ group, setActiveGroup }) => {
    const handleSwitch = () => {
        setActiveGroup(group);
    };

    return (
        <button
            className="UI switch-button"
            onClick={handleSwitch}
        >
            {group}
        </button>
    );
};

export default SwitchButton;