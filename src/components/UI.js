import React, { useState, useMemo, useCallback } from 'react';
import Button from './UI_buttons/Button';
import SwitchButton from './UI_buttons/SwitchButton';
import Trashcan from './UI_buttons/Trashcan';
import BigTextEditor from './UI_buttons/BigTextEditor';
import DateRangePicker from './UI_buttons/DateRangePicker';
import NoteButton from './UI_buttons/NoteButton';
import {
    LocationOn, Flight, DirectionsCar, DirectionsBus, Train, LocalDining, AccountBalance, ShoppingBag, Nightlife, Hotel, AccessTimeFilled,
    Lock, LockOpen, Visibility, VisibilityOff
} from '@mui/icons-material';
import './styles/Buttons.css';

const UI = React.memo(({ createRectangle, zoom, mouseFollowerRef, locked, setLocked, visible, setVisible, startDate, endDate, setStartDate, setEndDate,
    isOpen, setIsOpen, activeRectangle, setOverTrashcanId, buttonContainerRef }) => {

    const [activeGroup, setActiveGroup] = useState(2);
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
    }, [visible, setVisible]);

    // Memoize buttonGroups
    const buttonGroups = useMemo(() => ({
        1: [
            { id: 1, text: 'Plane', color: '#1D333A', size: 1, icon: <Flight />, group: 1 },
            { id: 2, text: 'Train', color: '#1D333A', size: 1, icon: <Train />, group: 1 },
            { id: 3, text: 'Bus', color: '#1D333A', size: 1, icon: <DirectionsBus />, group: 1 },
            { id: 4, text: 'Car', color: '#1D333A', size: 1, icon: <DirectionsCar />, group: 1 },
        ],
        2: [
            { id: 5, text: 'Tour', color: '#DD3131', size: 2, icon: <LocationOn />, group: 2 },
            { id: 6, text: 'Culture', color: '#814822', size: 2, icon: <AccountBalance />, group: 2 },
            { id: 7, text: 'Shop', color: '#69BC29', size: 2, icon: <ShoppingBag />, group: 2 },
            { id: 8, text: 'Party', color: '#3892C7', size: 2, icon: <Nightlife />, group: 2 }
        ],
        3: [
            { id: 9, text: 'Hotel', color: '#A84355 ', size: 4, icon: <Hotel />, group: 3 },
            { id: 10, text: 'Eat', color: '#FF8C00 ', size: 3, icon: <LocalDining />, group: 3 },
            { id: 11, text: 'Free', color: '#98A6AB', size: 4, icon: <AccessTimeFilled />, group: 3 },
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
                    <div className="UI rectangle-button-container" ref={buttonContainerRef}>
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
        prevProps.visible === nextProps.visible &&
        prevProps.setVisible === nextProps.setVisible &&
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