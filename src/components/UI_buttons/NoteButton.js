import React, { memo } from 'react';
import Button from './Button';

const NoteButton = memo(({ createRectangle, mouseFollowerRef }) => {
    return (
        <Button
            key={0}
            id={0}
            text={'Note'}
            colorId={'note'}
            size={2}
            createRectangle={createRectangle}
            mouseFollowerRef={mouseFollowerRef}
            iconId={'note'}
            group={0}
            className='note'
        />
    );
});

// Only re-render if the props change
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.id === nextProps.id &&
        prevProps.text === nextProps.text &&
        prevProps.color === nextProps.color &&
        prevProps.size === nextProps.size &&
        prevProps.group === nextProps.group &&
        prevProps.activeGroup === nextProps.activeGroup &&
        prevProps.icon === nextProps.icon
    );
};

export default React.memo(NoteButton, areEqual);