import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate, isOpen, setIsOpen }) => {

    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    // Set min and max dates
    const minDate = dayjs().toDate();
    const maxDate = startDate ? dayjs(startDate).add(1, 'month').toDate() : null;

    return (
        <div className="date-range">
            <div
                style={{ position: 'absolute', top: 0, left: 0, color: 'black', cursor: 'pointer', width: '100%' }}
                onClick={() => setIsOpen(true)}
            >
                {`${startDate ? dayjs(startDate).format('DD MMM') : ''} - ${endDate ? dayjs(endDate).format('DD MMM') : ''}`}
            </div>
            {isOpen && (
                <DatePicker
                    selected={startDate}
                    onChange={handleDateChange}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    inline
                    onClickOutside={() => setIsOpen(false)}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            )}
        </div>
    );
};

export default DateRangePicker;