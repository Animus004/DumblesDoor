
import React, { useState, useMemo } from 'react';

interface BookingCalendarProps {
  onConfirm: (selectedDateTime: Date) => void;
  // NOTE: In a real implementation, you would pass the vet's schedule and existing appointments as props.
  // For this self-contained component, we'll use mock data to demonstrate functionality.
}

// --- Mock Data and Helper Functions ---
const VET_SCHEDULE = {
    start: '09:00',
    end: '18:00',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    slotDuration: 30, // in minutes
};

const MOCK_EXISTING_APPOINTMENTS = [
    '10:30',
    '11:00',
    '15:30',
];

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

/**
 * Generates available time slots for a given schedule, excluding lunch breaks and existing appointments.
 */
const generateTimeSlots = (schedule: typeof VET_SCHEDULE, existingAppointments: string[]): { morning: string[], afternoon: string[], evening: string[] } => {
    const slots = { morning: [] as string[], afternoon: [] as string[], evening: [] as string[] };
    const startTime = timeToMinutes(schedule.start);
    const endTime = timeToMinutes(schedule.end);
    const lunchStartTime = timeToMinutes(schedule.lunchStart);
    const lunchEndTime = timeToMinutes(schedule.lunchEnd);

    for (let currentTime = startTime; currentTime < endTime; currentTime += schedule.slotDuration) {
        const slotEndTime = currentTime + schedule.slotDuration;
        const timeStr = minutesToTime(currentTime);

        // Check for conflicts: lunch break or existing appointments
        const isLunchConflict = currentTime < lunchEndTime && slotEndTime > lunchStartTime;
        const isBooked = existingAppointments.includes(timeStr);

        if (!isLunchConflict && !isBooked) {
            if (currentTime < timeToMinutes('12:00')) {
                slots.morning.push(timeStr);
            } else if (currentTime < timeToMinutes('16:00')) {
                slots.afternoon.push(timeStr);
            } else {
                slots.evening.push(timeStr);
            }
        }
    }
    return slots;
};

/**
 * A calendar component for selecting an appointment date and time.
 */
const BookingCalendar: React.FC<BookingCalendarProps> = ({ onConfirm }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        // Prevent navigating to past dates
        if (!isPastDate(newDate)) {
            setSelectedDate(newDate);
            setSelectedTime(null); // Reset time selection when date changes
        }
    };

    const handleConfirmClick = () => {
        if (!selectedTime) return;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const confirmationDate = new Date(selectedDate);
        confirmationDate.setHours(hours, minutes, 0, 0);
        onConfirm(confirmationDate);
    };

    // Memoize slot generation to avoid recalculating on every render
    const timeSlots = useMemo(() => {
        // In a real app, you'd fetch existing appointments for the `selectedDate`
        return generateTimeSlots(VET_SCHEDULE, MOCK_EXISTING_APPOINTMENTS);
    }, [selectedDate]); // This dependency ensures slots are recalculated when the date changes

    const TimeSlotGroup: React.FC<{ title: string; slots: string[] }> = ({ title, slots }) => {
        if (slots.length === 0) return null;
        return (
            <section aria-labelledby={`${title}-heading`}>
                <h3 id={`${title}-heading`} className="font-semibold text-gray-700 mb-2">{title}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(time => (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            aria-pressed={selectedTime === time}
                            className={`p-2 rounded-lg text-sm font-semibold transition-colors ${
                                selectedTime === time
                                    ? 'bg-teal-500 text-white shadow-md'
                                    : 'bg-white hover:bg-teal-50 border border-gray-200 text-teal-700'
                            }`}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </section>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 flex flex-col font-sans">
            <header className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => handleDateChange(-1)}
                        disabled={isPastDate(selectedDate)}
                        className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-40"
                        aria-label="Previous day"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-bold text-gray-800 text-center">
                        {selectedDate.toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h2>
                    <button
                        onClick={() => handleDateChange(1)}
                        className="p-2 rounded-full hover:bg-gray-200"
                        aria-label="Next day"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </header>
            
            <main className="flex-grow overflow-y-auto space-y-6">
                <TimeSlotGroup title="Morning" slots={timeSlots.morning} />
                <TimeSlotGroup title="Afternoon" slots={timeSlots.afternoon} />
                <TimeSlotGroup title="Evening" slots={timeSlots.evening} />

                {(timeSlots.morning.length + timeSlots.afternoon.length + timeSlots.evening.length) === 0 && (
                    <div className="text-center text-gray-500 py-10">
                        <p className="font-semibold">No available slots for this day.</p>
                        <p className="text-sm">Please try another date.</p>
                    </div>
                )}
            </main>

            <footer className="pt-4 flex-shrink-0">
                <button
                    onClick={handleConfirmClick}
                    disabled={!selectedTime}
                    className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {selectedTime ? `Confirm Appointment for ${selectedTime}` : 'Select a time slot'}
                </button>
            </footer>
        </div>
    );
};

export default BookingCalendar;
