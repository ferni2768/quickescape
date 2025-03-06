import React, { useMemo } from 'react';
import dayjs from 'dayjs';

const DateLabels = React.memo(({ startDate, endDate, gridSize }) => {
    // Memoize the dates array
    const dates = useMemo(() => {
        const datesArray = [];
        let currentDate = dayjs(startDate);

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            datesArray.push(currentDate);
            currentDate = currentDate.add(1, 'day');
        }

        return datesArray;
    }, [startDate, endDate]);

    // Hour labels to be displayed
    const hourLabels = [
        { hour: 6, label: '6:00' },
        { hour: 12, label: '12:00' },
        { hour: 18, label: '18:00' }
    ];

    return (
        <div className="date-labels">
            {dates.map((date, dateIndex) => (
                <React.Fragment key={dateIndex}>
                    {/* Date label */}
                    <div
                        className="date-label"
                        style={{
                            position: 'absolute',
                            top: `${dateIndex * gridSize * 4 * 24}px`
                        }}
                    >
                        {date.format('D MMM')}
                    </div>

                    {/* Hour labels */}
                    {hourLabels.map((hourLabel, hourIndex) => (
                        <div
                            key={`${dateIndex}-${hourIndex}`}
                            className="hour-label"
                            style={{
                                position: 'absolute',
                                top: `${(dateIndex * gridSize * 4 * 24) + (hourLabel.hour * gridSize * 4)}px`,
                            }}
                        >
                            {hourLabel.label}
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
});

export default DateLabels;