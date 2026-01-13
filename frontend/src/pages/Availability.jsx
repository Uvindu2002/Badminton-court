import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { bookingAPI } from '../services/api';

export default function Availability() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    const courts = ['Court 1', 'Court 2'];

    // Get today's date string
    const getTodayDate = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Fetch slots for selected date
    const fetchSlots = async (date) => {
        setSlotsLoading(true);
        try {
            const response = await bookingAPI.getByDate(date);
            setSlots(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch slots:', error);
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // Set today as default and fetch slots on mount
    useEffect(() => {
        const today = getTodayDate();
        setSelectedDate(today);
        fetchSlots(today);
    }, []);

    // Fetch slots when selected date changes
    useEffect(() => {
        if (selectedDate) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate]);

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const isDatePast = (day) => {
        if (!day) return false;
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr < getTodayDate();
    };

    const isDateSelected = (day) => {
        if (!day || !selectedDate) return false;
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr === selectedDate;
    };

    const isToday = (day) => {
        if (!day) return false;
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr === getTodayDate();
    };

    const handleDateClick = (day) => {
        if (!day || isDatePast(day)) return;
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const changeMonth = (direction) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    };

    const isSlotInPast = (slotTime) => {
        const today = getTodayDate();
        if (selectedDate !== today) return selectedDate < today;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const slotHour = parseInt(slotTime.split(':')[0]);

        if (slotHour < currentHour) return true;
        if (slotHour === currentHour && currentMinute > 30) return true;
        return false;
    };

    const getSlotForCourtAndTime = (courtId, time) => {
        return slots.find(s => s.courtId === courtId && s.startTime === time);
    };

    const getSlotStatus = (slot) => {
        if (!slot) return 'loading';
        if (slot.isClosed) return 'closed';
        if (isSlotInPast(slot.startTime)) return 'past';
        if (!slot.isAvailable) return 'booked';
        return 'available';
    };

    const getSlotColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'booked':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'closed':
                return 'bg-gray-100 text-gray-600 border-gray-300';
            case 'past':
                return 'bg-gray-200 text-gray-500 border-gray-300 opacity-60';
            default:
                return 'bg-gray-50 text-gray-400 border-gray-200';
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-[#ffd60a] to-yellow-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Court Booking</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Home
                            </Link>
                            <a
                                href="#contact"
                                className="px-4 py-2 bg-[#ffd60a] text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-all shadow-md"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Title */}
            <div className="bg-gradient-to-r from-[#ffd60a] to-yellow-400 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Court Availability</h1>
                    <p className="text-gray-800 mt-2">Select a date to view available time slots</p>
                </div>
            </div>

            {/* Main Content - Split View */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - Calendar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:sticky lg:top-24">
                                {/* Month Navigation */}
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                    >
                                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </h2>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                    >
                                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {getDaysInMonth().map((day, index) => {
                                        const isPast = isDatePast(day);
                                        const isSelected = isDateSelected(day);
                                        const isTodayDate = isToday(day);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleDateClick(day)}
                                                disabled={!day || isPast}
                                                className={`
                                                    aspect-square p-1 md:p-2 rounded-lg text-sm font-medium transition-all relative
                                                    ${!day ? 'invisible' : ''}
                                                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                                                    ${isSelected
                                                        ? 'bg-[#ffd60a] text-gray-900 shadow-md font-bold'
                                                        : day && !isPast
                                                            ? 'bg-white text-gray-900 hover:bg-yellow-50 border border-gray-200 hover:border-[#ffd60a]'
                                                            : ''
                                                    }
                                                `}
                                            >
                                                {day}
                                                {isTodayDate && !isSelected && (
                                                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#ffd60a] rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Today Button */}
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        setCurrentMonth(today);
                                        setSelectedDate(getTodayDate());
                                    }}
                                    className="w-full mt-4 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Go to Today
                                </button>

                                {/* Selected Date Info */}
                                {selectedDate && (
                                    <div className="mt-4 p-3 bg-gradient-to-r from-[#ffd60a]/20 to-yellow-100 rounded-lg border border-[#ffd60a]/30">
                                        <p className="text-xs font-medium text-gray-600">Selected Date</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{formatDisplayDate(selectedDate)}</p>
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                    <p className="text-xs font-semibold text-gray-700">Legend:</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                            <span className="text-gray-600">Available</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                                            <span className="text-gray-600">Booked</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                                            <span className="text-gray-600">Closed</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded opacity-60"></div>
                                            <span className="text-gray-600">Past</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Time Slots */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Time Slots</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
                                        </p>
                                    </div>
                                    {selectedDate && (
                                        <button
                                            onClick={() => fetchSlots(selectedDate)}
                                            disabled={slotsLoading}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                                            title="Refresh"
                                        >
                                            <svg className={`w-5 h-5 text-gray-600 ${slotsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {slotsLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ffd60a]"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-4 md:mx-0">
                                        <table className="w-full min-w-[500px]">
                                            <thead>
                                                <tr className="border-b-2 border-gray-200">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Court 1</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Court 2</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timeSlots.map((time) => (
                                                    <tr key={time} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4 font-medium text-gray-900">
                                                            {time}
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                - {parseInt(time.split(':')[0]) + 1}:00
                                                            </span>
                                                        </td>
                                                        {courts.map((court) => {
                                                            const slot = getSlotForCourtAndTime(court, time);
                                                            const status = getSlotStatus(slot);
                                                            return (
                                                                <td key={court} className="py-2 px-4">
                                                                    <div
                                                                        className={`
                                                                            w-full py-2.5 px-3 rounded-lg border-2 text-sm font-medium text-center
                                                                            ${getSlotColor(status)}
                                                                        `}
                                                                    >
                                                                        {status === 'available' && (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Available
                                                                            </span>
                                                                        )}
                                                                        {status === 'booked' && (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Booked
                                                                            </span>
                                                                        )}
                                                                        {status === 'closed' && (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Closed
                                                                            </span>
                                                                        )}
                                                                        {status === 'past' && (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Past
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div id="contact" className="mt-6 p-4 bg-gradient-to-r from-[#ffd60a]/10 to-yellow-50 rounded-lg border border-[#ffd60a]/20">
                                    <p className="text-sm font-medium text-gray-800">
                                        📞 Want to book a court? Contact us to make a reservation!
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-4">
                                        <a href="tel:+94771234567" className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-900 hover:text-[#ffd60a] transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>+94 77 123 4567</span>
                                        </a>
                                        <a href="https://wa.me/94771234567" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            <span>WhatsApp</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
