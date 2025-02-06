import React, { useState, useCallback } from 'react';

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
            {group}
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