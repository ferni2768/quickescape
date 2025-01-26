import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate, isOpen, setIsOpen, twoLines }) => {
    const [animationClass, setAnimationClass] = useState('fadeIn');
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

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

    // Set min and max dates
    const minDate = dayjs().toDate();
    const maxDate = startDate ? dayjs(startDate).add(1, 'month').toDate() : null;

    return (
        <div className={`UI date-range ${twoLines ? 'two-lines' : ''}`}>
            <div
                className={`UI date-range-label ${isOpen ? 'opened' : 'closed'}`}
                style={{ position: 'absolute', top: 0, left: 0, color: 'black', cursor: 'pointer', width: '100%' }}
                onClick={clickIn}
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