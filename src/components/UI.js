import React, { useState, useMemo, useCallback } from 'react';
import Button from './UI_buttons/Button';
import SwitchButton from './UI_buttons/SwitchButton';
import Trashcan from './UI_buttons/Trashcan';
import BigTextEditor from './UI_buttons/BigTextEditor';
import DateRangePicker from './UI_buttons/DateRangePicker';
import NoteButton from './UI_buttons/NoteButton';
import { Home, Star, Favorite, Lock, LockOpen, Visibility, VisibilityOff } from '@mui/icons-material';
import './styles/Buttons.css';

const UI = React.memo(({ createRectangle, zoom, mouseFollowerRef, locked, setLocked, startDate, endDate, setStartDate, setEndDate,
    isOpen, setIsOpen, activeRectangle, setOverTrashcanId }) => {

    const [activeGroup, setActiveGroup] = useState(1);
    const [visible, setVisible] = useState(true);
    const [twoLines, setTwoLines] = useState(false);
    const [isLockTouched, setIsLockTouched] = useState(false);
    const [isViewTouched, setIsViewTouched] = useState(false);

    // Memoize SVG icons
    const lockIcon = useMemo(() => locked ? <Lock style={{ pointerEvents: 'none' }} /> : <LockOpen style={{ pointerEvents: 'none' }} />, [locked]);
    const visibilityIcon = useMemo(() => visible ? <Visibility style={{ pointerEvents: 'none' }} /> : <VisibilityOff style={{ pointerEvents: 'none' }} />, [visible]);

    // Memoize event handlers
    const handleLockTouchStart = useCallback(() => {
        setIsLockTouched(true);
    }, []);

    const handleLockTouchEnd = useCallback(() => {
        setIsLockTouched(false);
        setLocked(!locked);
    }, [locked, setLocked]);

    const handleViewTouchStart = useCallback(() => {
        setIsViewTouched(true);
    }, []);

    const handleViewTouchEnd = useCallback(() => {
        setIsViewTouched(false);
        setVisible(!visible);
    }, [visible]);

    // Memoize buttonGroups
    const buttonGroups = useMemo(() => ({
        1: [
            { id: 1, text: '1', color: '#4CAF50', size: 1, icon: <Home />, group: 1 },
            { id: 2, text: '2', color: '#2196F3', size: 2, icon: <Star />, group: 1 },
            { id: 3, text: '3', color: '#f44336', size: 1, icon: <Favorite />, group: 1 },
            { id: 4, text: '4', color: '#FF5722', size: 2, icon: <Favorite />, group: 1 },
        ],
        2: [
            { id: 5, text: '5', color: '#9C27B0', size: 1, icon: <Home />, group: 2 },
            { id: 6, text: '6', color: '#3F51B5', size: 2, icon: <Star />, group: 2 },
            { id: 7, text: '7', color: '#00BCD4', size: 1, icon: <Favorite />, group: 2 },
            { id: 8, text: '8', color: '#8BC34A', size: 2, icon: <Favorite />, group: 2 },
        ],
        3: [
            { id: 9, text: '9', color: '#FFC107', size: 1, icon: <Home />, group: 3 },
            { id: 10, text: '10', color: '#FFEB3B', size: 2, icon: <Star />, group: 3 },
            { id: 11, text: '11', color: '#FF9800', size: 1, icon: <Favorite />, group: 3 },
        ],
    }), []);


    return (
        <div>
            <div>
                <div className={`UI top-left-container ${visible ? 'in' : 'out'}`}>
                    <BigTextEditor className="UI" setTwoLines={setTwoLines} />
                    <DateRangePicker className="UI" startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} isOpen={isOpen} setIsOpen={setIsOpen} twoLines={twoLines} />
                </div>

                <div className={`middle-left-container ${visible ? 'in' : 'out'}`}>
                    <div className="UI rectangle-button-container">
                        {Object.entries(buttonGroups).map(([groupId, buttons]) => (
                            <div key={groupId} className="rectangle-buttons-group">
                                {buttons.map(button => (
                                    <Button
                                        key={button.id}
                                        id={button.id}
                                        text={button.text}
                                        color={button.color}
                                        size={button.size}
                                        createRectangle={createRectangle}
                                        zoom={zoom}
                                        mouseFollowerRef={mouseFollowerRef}
                                        icon={button.icon}
                                        group={button.group}
                                        activeGroup={activeGroup}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="UI note-button">
                        <NoteButton
                            createRectangle={createRectangle}
                            zoom={zoom}
                            mouseFollowerRef={mouseFollowerRef}
                        />
                    </div>

                    <div className="UI switch-buttons-container">
                        {[1, 2, 3].map(group => (
                            <SwitchButton
                                key={group}
                                group={group}
                                activeGroup={activeGroup}
                                setActiveGroup={setActiveGroup}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="UI bottom-left-container">
                <button
                    className={`UI lock-button ${locked ? '' : 'unlocked'} ${isLockTouched ? 'hover' : ''}`}
                    onClick={() => setLocked(!locked)}
                    onTouchStart={handleLockTouchStart}
                    onTouchEnd={handleLockTouchEnd}
                >
                    {lockIcon}
                </button>

                <button
                    className={`UI view-button ${visible ? '' : 'hidden'} ${isViewTouched ? 'hover' : ''}`}
                    onClick={() => setVisible(!visible)}
                    onTouchStart={handleViewTouchStart}
                    onTouchEnd={handleViewTouchEnd}
                >
                    {visibilityIcon}
                </button>
            </div>

            <div className="UI bottom-right-container">
                <Trashcan className="UI trashcan" activeRectangle={activeRectangle} setOverTrashcanId={setOverTrashcanId} />
            </div>
        </div>
    );
});

const areEqual = (prevProps, nextProps) => {
    const isStartDateEqual = prevProps.startDate?.getTime() === nextProps.startDate?.getTime();
    const isEndDateEqual = prevProps.endDate?.getTime() === nextProps.endDate?.getTime();

    return (
        prevProps.createRectangle === nextProps.createRectangle &&
        prevProps.zoom === nextProps.zoom &&
        prevProps.mouseFollowerRef === nextProps.mouseFollowerRef &&
        prevProps.locked === nextProps.locked &&
        prevProps.setLocked === nextProps.setLocked &&
        isStartDateEqual &&
        isEndDateEqual &&
        prevProps.setStartDate === nextProps.setStartDate &&
        prevProps.setEndDate === nextProps.setEndDate &&
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.setIsOpen === nextProps.setIsOpen &&
        prevProps.activeRectangle === nextProps.activeRectangle &&
        prevProps.setOverTrashcanId === nextProps.setOverTrashcanId
    );
};

export default React.memo(UI, areEqual);