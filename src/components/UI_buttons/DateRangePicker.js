import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

const DateRangePicker = memo(({ startDate, endDate, setStartDate, setEndDate, isOpen, setIsOpen, twoLines }) => {
    const [animationClass, setAnimationClass] = useState('fadeIn');
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const datePickerRef = useRef(null);

    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

    const clickIn = useCallback(() => {
        setAnimationClass('fadeIn');
        setIsOpen(true);
    }, [setIsOpen]);

    // Handle click outside the date picker
    const clickOut = useCallback(() => {
        setAnimationClass('fadeOut');
        setTimeout(() => {
            if (tempStartDate !== null && tempEndDate !== null) {
                setStartDate(tempStartDate);
                setEndDate(tempEndDate);
            } else {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
            }
            setIsOpen(false);
        }, 200);
    }, [tempStartDate, tempEndDate, setStartDate, setEndDate, startDate, endDate, setIsOpen]);

    // Handle date change
    const handleDateChange = useCallback((dates) => {
        const [start, end] = dates;

        if (end) {
            const oneMonthAfterStart = dayjs(start).add(1, 'month');
            const isEndBeyondMonth = dayjs(end).isAfter(oneMonthAfterStart);

            if (isEndBeyondMonth) {
                setTempStartDate(end);
                setTempEndDate(null);
            } else {
                setTempStartDate(start);
                setTempEndDate(end);
            }
        } else {
            setTempStartDate(start);
            setTempEndDate(end);
        }
    }, []);

    // Simulate click on touch devices
    const handleTouchToClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];
        const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

        touchedElement?.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: touch.clientX,
                clientY: touch.clientY,
            })
        );

        // Close the date picker if touch is outside the picker
        if (datePickerRef.current && !datePickerRef.current.contains(touchedElement))
            clickOut();
    }, [clickOut]);

    // Add event listener for touchstart
    useEffect(() => {
        if (isOpen) window.addEventListener('touchstart', handleTouchToClick, { passive: false });
        else window.removeEventListener('touchstart', handleTouchToClick);

        return () => {
            window.removeEventListener('touchstart', handleTouchToClick);
        };
    }, [isOpen, handleTouchToClick]);


    return (
        <>
            <div className={`UI date-range ${twoLines ? 'two-lines' : ''}`} ref={datePickerRef}>
                <div
                    className={`UI date-range-label ${isOpen ? 'opened' : 'closed'}`}
                    style={{ position: 'absolute', top: 0, left: 0, color: 'black', cursor: 'pointer', width: '100%' }}
                    onClick={clickIn}
                    onTouchStart={clickIn}
                >
                    {`${startDate ? dayjs(startDate).format('DD MMM') : ''} - ${endDate ? dayjs(endDate).format('DD MMM') : ''}`}
                </div>

                <div className={`UI ${animationClass}`}>
                    {isOpen &&
                        <DatePicker
                            selected={tempStartDate}
                            onChange={handleDateChange}
                            startDate={tempStartDate}
                            endDate={tempEndDate}
                            selectsRange
                            inline
                            disabledKeyboardNavigation
                            onClickOutside={clickOut}
                            calendarStartDay={1}
                            openToDate={startDate || tempStartDate || dayjs().toDate()}
                        />
                    }
                </div>
            </div>

            <div className={`date-picker-overlay ${isOpen ? 'visible' : ''}`} />
        </>
    );
});

export default DateRangePicker;