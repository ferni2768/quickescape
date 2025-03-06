import React, { useState, useCallback } from 'react';
import FlightIcon from '@mui/icons-material/Flight';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import Home from '@mui/icons-material/Home';

const iconMap = {
    1: <FlightIcon style={{ pointerEvents: 'none' }} />,
    2: <DirectionsWalkIcon style={{ pointerEvents: 'none' }} />,
    3: <Home style={{ pointerEvents: 'none' }} />
};

const SwitchButton = React.memo(({ group, activeGroup, setActiveGroup }) => {
    const [isTouched, setIsTouched] = useState(false);

    // Memoize event handlers
    const handleSwitch = useCallback(() => {
        setActiveGroup(group);
    }, [group, setActiveGroup]);

    const handleTouchStart = useCallback(() => {
        setIsTouched(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsTouched(false);
        handleSwitch();
    }, [handleSwitch]);


    return (
        <button
            className={`UI switch-button ${group === activeGroup ? 'selected' : ''} ${isTouched ? 'hover' : ''}`}
            onClick={handleSwitch}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {iconMap[group] || '❓'}
        </button>
    );
});

// Only re-render if the props change
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.group === nextProps.group &&
        prevProps.activeGroup === nextProps.activeGroup &&
        prevProps.setActiveGroup === nextProps.setActiveGroup
    );
};

export default React.memo(SwitchButton, areEqual);