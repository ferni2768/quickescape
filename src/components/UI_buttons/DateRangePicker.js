import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate, isOpen, setIsOpen, twoLines }) => {
    const [animationClass, setAnimationClass] = useState('fadeIn');
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const datePickerRef = useRef(null);

    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setTempStartDate(start);
        setTempEndDate(end);
    };

    const clickOut = () => {
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
    };

    const clickIn = () => {
        setAnimationClass('fadeIn');
        setIsOpen(true);
    };

    // Simulate click on touch devices
    const handleTouchToClick = (e) => {
        if (!isOpen) return;

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
    };

    useEffect(() => {
        if (isOpen) window.addEventListener('touchstart', handleTouchToClick);
        else window.removeEventListener('touchstart', handleTouchToClick);

        return () => {
            window.removeEventListener('touchstart', handleTouchToClick);
        };
    }, [isOpen]);

    // Set min and max dates
    const minDate = dayjs().toDate();
    const maxDate = startDate ? dayjs(startDate).add(1, 'month').toDate() : null;


    return (
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
                        onClickOutside={clickOut}
                        minDate={minDate}
                        maxDate={maxDate}
                        calendarStartDay={1}
                    />
                }
            </div>
        </div>
    );
};

export default DateRangePicker;