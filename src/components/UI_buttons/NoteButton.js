import React, { memo } from 'react';
import Button from './Button';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';

const NoteButton = memo(({ createRectangle, zoom, mouseFollowerRef }) => {
    return (
        <Button
            key={0}
            id={0}
            text={'Note'}
            color={'#F3BD1B'}
            size={2}
            createRectangle={createRectangle}
            zoom={zoom}
            mouseFollowerRef={mouseFollowerRef}
            icon={<StickyNote2Icon />}
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
        prevProps.zoom === nextProps.zoom &&
        prevProps.group === nextProps.group &&
        prevProps.activeGroup === nextProps.activeGroup &&
        prevProps.icon === nextProps.icon
    );
};

export default React.memo(NoteButton, areEqual);