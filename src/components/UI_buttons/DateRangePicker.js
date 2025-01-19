import React from 'react';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

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
        <div className="UI date-range">
            <div
                style={{ position: 'absolute', top: 0, left: 0, color: 'black', cursor: 'pointer', width: '100%', visibility: `${isOpen ? 'hidden' : 'visible'}` }}
                onClick={() => setIsOpen(true)}
            >
                {`${startDate ? dayjs(startDate).format('DD MMM') : ''} - ${endDate ? dayjs(endDate).format('DD MMM') : ''}`}
            </div>

            <div className="UI">
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
                        calendarStartDay={1}
                    />
                )}
            </div>
        </div>
    );
};

export default DateRangePicker;