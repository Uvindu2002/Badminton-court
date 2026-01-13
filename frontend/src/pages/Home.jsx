import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { bookingAPI } from '../services/api';

export default function Home() {
    const navigate = useNavigate();
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [hoveredDate, setHoveredDate] = useState(null);
    const [hoveredSlots, setHoveredSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    useEffect(() => {
        if (showCalendar) {
            fetchBookings();

            // Auto-refresh every 5 minutes when calendar is open
            const interval = setInterval(() => {
                fetchBookings();
            }, 300000); // 5 minutes

            // Cleanup interval when calendar closes or month changes
            return () => clearInterval(interval);
        }
    }, [showCalendar, currentMonth]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            console.log('Fetching bookings for month:', currentMonth.toLocaleDateString());

            // Fetch all dates in the month
            const allBookings = [];
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                try {
                    const response = await bookingAPI.getByDate(dateStr);
                    console.log(`Response for ${dateStr}:`, response);
                    console.log(`Data structure:`, response.data);

                    if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        // Log the structure of the first item
                        if (response.data.data.length > 0) {
                            console.log(`Sample slot from ${dateStr}:`, response.data.data[0]);
                        }
                        allBookings.push(...response.data.data);
                    }
                } catch (error) {
                    console.error(`Error fetching bookings for ${dateStr}:`, error);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log('Total bookings fetched:', allBookings.length);
            console.log('All bookings array:', allBookings);
            setBookings(allBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

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
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return dateStr < todayStr;
    };

    const isSlotInPast = (dateStr, slotTime) => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // If date is in the past, slot is in the past
        if (dateStr < todayStr) return true;

        // If date is today, check the time
        if (dateStr === todayStr) {
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();
            const slotHour = parseInt(slotTime.split(':')[0]);

            // If slot hour has already passed, it's in the past
            if (slotHour < currentHour) return true;

            // If it's the current hour but we're past 30 minutes, consider it past
            if (slotHour === currentHour && currentMinute > 30) return true;
        }

        return false;
    };

    const getDateSlots = (day) => {
        if (!day) return [];

        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateBookings = bookings.filter(b => b.date === dateStr);

        console.log(`Getting slots for ${dateStr}, found ${dateBookings.length} bookings`);

        return timeSlots.map(time => {
            // Find slots for both courts at this time
            const court1Slot = dateBookings.find(b => b.startTime === time && b.courtId === 'Court 1');
            const court2Slot = dateBookings.find(b => b.startTime === time && b.courtId === 'Court 2');

            const isPast = isSlotInPast(dateStr, time);

            // Determine status based on isAvailable field OR booking object presence
            // isAvailable === false means booked, having a booking object also means booked
            const court1Status = isPast ? 'past' :
                court1Slot?.isClosed ? 'closed' :
                    (court1Slot?.isAvailable === false || court1Slot?.booking) ? 'booked' : 'available';

            const court2Status = isPast ? 'past' :
                court2Slot?.isClosed ? 'closed' :
                    (court2Slot?.isAvailable === false || court2Slot?.booking) ? 'booked' : 'available';

            return {
                time,
                isPast,
                court1: {
                    status: court1Status,
                    customerName: court1Slot?.booking?.customerName || null,
                    isClosed: court1Slot?.isClosed || false
                },
                court2: {
                    status: court2Status,
                    customerName: court2Slot?.booking?.customerName || null,
                    isClosed: court2Slot?.isClosed || false
                }
            };
        });
    };

    const handleDateHover = (day) => {
        if (!day) return;
        setHoveredDate(day);
        setHoveredSlots(getDateSlots(day));
    };

    const getDateStatus = (day) => {
        if (!day) return null;

        // Check if date is in the past
        if (isDatePast(day)) return 'past';

        const slots = getDateSlots(day);

        let totalSlots = 0;
        let bookedSlots = 0;
        let pastSlots = 0;

        slots.forEach(slot => {
            // Count both courts
            if (!slot.court1.isClosed) {
                totalSlots++;
                if (slot.court1.status === 'booked') bookedSlots++;
                if (slot.court1.status === 'past') pastSlots++;
            }
            if (!slot.court2.isClosed) {
                totalSlots++;
                if (slot.court2.status === 'booked') bookedSlots++;
                if (slot.court2.status === 'past') pastSlots++;
            }
        });

        // Exclude past slots from calculation
        const availableSlots = totalSlots - pastSlots;
        const bookedAvailableSlots = bookedSlots;

        if (availableSlots === 0) return 'past';
        if (bookedAvailableSlots === 0) return 'available';
        if (bookedAvailableSlots === availableSlots) return 'full';
        return 'partial';
    };

    const changeMonth = (direction) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header/Navigation */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-[#ffd60a] to-yellow-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">Court Booking</span>
                        </div>
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="px-6 py-2.5 bg-[#ffd60a] text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>View Bookings</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Calendar Modal */}
            {showCalendar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="sticky top-0 bg-gradient-to-r from-[#ffd60a]/90 to-yellow-400/90 backdrop-blur-xl border-b border-yellow-500/20 px-6 py-5 flex justify-between items-center rounded-t-3xl">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Court Availability</h2>
                                <button
                                    onClick={fetchBookings}
                                    disabled={loading}
                                    className="p-2 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
                                    title="Refresh bookings"
                                >
                                    <svg className={`w-5 h-5 text-gray-900 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="text-gray-900 hover:bg-white/30 p-2 rounded-lg transition-all backdrop-blur-sm"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd60a] mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading bookings...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-gradient-to-br from-white/50 to-gray-50/50 backdrop-blur-sm">
                                {/* Month Navigation */}
                                <div className="flex justify-between items-center mb-6">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-3 hover:bg-[#ffd60a]/20 rounded-xl transition-all backdrop-blur-sm border border-gray-200/50 hover:border-[#ffd60a]/50"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h3 className="text-xl font-bold text-gray-900 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-3 hover:bg-[#ffd60a]/20 rounded-xl transition-all backdrop-blur-sm border border-gray-200/50 hover:border-[#ffd60a]/50"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center font-semibold text-gray-700 py-2 bg-white/40 backdrop-blur-sm rounded-lg">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {getDaysInMonth().map((day, index) => {
                                        const status = getDateStatus(day);
                                        const isPast = isDatePast(day);
                                        return (
                                            <div
                                                key={index}
                                                className="relative group"
                                                onMouseEnter={() => !isPast && handleDateHover(day)}
                                                onMouseLeave={() => setHoveredDate(null)}
                                            >
                                                {day ? (
                                                    <div
                                                        className={`
                                                        aspect-square p-2 rounded-xl border-2 transition-all backdrop-blur-sm
                                                        ${isPast || status === 'past' ? 'border-gray-300 bg-gray-200/60 text-gray-500 cursor-not-allowed opacity-60' : 'cursor-pointer shadow-sm hover:shadow-md'}
                                                        ${!isPast && status === 'available' ? 'border-green-300 bg-green-50/80 hover:bg-green-100/90 hover:scale-105' : ''}
                                                        ${!isPast && status === 'partial' ? 'border-yellow-300 bg-yellow-50/80 hover:bg-yellow-100/90 hover:scale-105' : ''}
                                                        ${!isPast && status === 'full' ? 'border-red-300 bg-red-50/80 hover:bg-red-100/90 hover:scale-105' : ''}
                                                    `}
                                                    >
                                                        <div className="text-center font-semibold">{day}</div>
                                                        <div className="text-xs text-center mt-1">
                                                            {(isPast || status === 'past') && <span className="text-gray-500">Past</span>}
                                                            {!isPast && status === 'available' && <span className="text-green-600">Available</span>}
                                                            {!isPast && status === 'partial' && <span className="text-yellow-600">Partial</span>}
                                                            {!isPast && status === 'full' && <span className="text-red-600">Full</span>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="aspect-square p-2"></div>
                                                )}

                                                {/* Tooltip on Hover */}
                                                {day && hoveredDate === day && (
                                                    <div className="absolute left-full ml-2 top-0 z-10 bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl p-4 w-80 max-h-96 overflow-y-auto">
                                                        <div className="font-bold text-gray-900 mb-3 sticky top-0 bg-gradient-to-r from-[#ffd60a]/20 to-yellow-400/20 backdrop-blur-sm pb-2 px-2 rounded-lg -mx-2">
                                                            {currentMonth.toLocaleDateString('en-US', { month: 'short' })} {day}, {currentMonth.getFullYear()}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {hoveredSlots.map((slot, idx) => (
                                                                <div key={idx} className="border-b border-white/20 pb-2 mb-2 last:border-0 backdrop-blur-sm">
                                                                    <div className="font-semibold text-sm text-gray-700 mb-1">{slot.time} - {parseInt(slot.time.split(':')[0]) + 1}:00</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {/* Court 1 */}
                                                                        <div className={`p-2 rounded-xl text-xs backdrop-blur-sm shadow-lg transition-all hover:scale-105 ${slot.court1.isClosed
                                                                            ? 'bg-gray-400/20 border-2 border-gray-400/50 shadow-gray-500/20'
                                                                            : slot.court1.status === 'past'
                                                                                ? 'bg-gray-400/20 border-2 border-gray-400/50 shadow-gray-500/10'
                                                                                : slot.court1.status === 'booked'
                                                                                    ? 'bg-red-500/20 border-2 border-red-400/50 shadow-red-500/20'
                                                                                    : 'bg-green-500/20 border-2 border-green-400/50 shadow-green-500/20'
                                                                            }`}>
                                                                            <div className="font-semibold mb-1">Court 1</div>
                                                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${slot.court1.isClosed
                                                                                ? 'bg-gray-600/30 text-gray-700'
                                                                                : slot.court1.status === 'past'
                                                                                    ? 'bg-gray-600/30 text-gray-600'
                                                                                    : slot.court1.status === 'booked'
                                                                                        ? 'bg-red-600/30 text-red-700'
                                                                                        : 'bg-green-600/30 text-green-700'
                                                                                }`}>
                                                                                {slot.court1.isClosed ? 'Closed' : slot.court1.status === 'past' ? 'Past' : slot.court1.status === 'booked' ? 'Booked' : 'Available'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Court 2 */}
                                                                        <div className={`p-2 rounded-xl text-xs backdrop-blur-sm shadow-lg transition-all hover:scale-105 ${slot.court2.isClosed
                                                                            ? 'bg-gray-400/20 border-2 border-gray-400/50 shadow-gray-500/20'
                                                                            : slot.court2.status === 'past'
                                                                                ? 'bg-gray-400/20 border-2 border-gray-400/50 shadow-gray-500/10'
                                                                                : slot.court2.status === 'booked'
                                                                                    ? 'bg-red-500/20 border-2 border-red-400/50 shadow-red-500/20'
                                                                                    : 'bg-green-500/20 border-2 border-green-400/50 shadow-green-500/20'
                                                                            }`}>
                                                                            <div className="font-semibold mb-1">Court 2</div>
                                                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${slot.court2.isClosed
                                                                                ? 'bg-gray-600/30 text-gray-700'
                                                                                : slot.court2.status === 'past'
                                                                                    ? 'bg-gray-600/30 text-gray-600'
                                                                                    : slot.court2.status === 'booked'
                                                                                        ? 'bg-red-600/30 text-red-700'
                                                                                        : 'bg-green-600/30 text-green-700'
                                                                                }`}>
                                                                                {slot.court2.isClosed ? 'Closed' : slot.court2.status === 'past' ? 'Past' : slot.court2.status === 'booked' ? 'Booked' : 'Available'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="mt-6 flex justify-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-green-200 border-2 border-green-300 rounded"></div>
                                        <span className="text-sm text-gray-600">All Available</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-300 rounded"></div>
                                        <span className="text-sm text-gray-600">Partially Booked</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-200 border-2 border-red-300 rounded"></div>
                                        <span className="text-sm text-gray-600">Fully Booked</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
                                        <span className="text-sm text-gray-600">Past Date</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="flex-1 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <div className="inline-flex items-center space-x-2 bg-yellow-50 border border-[#ffd60a] rounded-full px-4 py-2 mb-6">
                                <span className="w-2 h-2 bg-[#ffd60a] rounded-full animate-pulse"></span>
                                <span className="text-sm font-medium text-gray-700">Your Court, Your Time</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Book Your Badminton Court in
                                <span className="text-[#ffd60a]"> Seconds</span>
                            </h1>

                            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                                Streamline your court management, track bookings, and handle reservations efficiently.
                                The modern way to manage your badminton court bookings.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setShowCalendar(true)}
                                    className="px-8 py-4 bg-[#ffd60a] text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <span>View Bookings</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-200 hover:border-[#ffd60a] transition-all"
                                >
                                    Contact Us
                                </button>
                            </div>
                        </div>

                        {/* Right Visual */}
                        <div className="relative">
                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl p-8 border border-gray-200">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ffd60a] rounded-full opacity-20 blur-2xl"></div>
                                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-2xl"></div>

                                <div className="relative space-y-4">
                                    {/* Sample Booking Card */}
                                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#ffd60a]">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-500">Today's Booking</span>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Confirmed</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-gray-900 font-semibold">Court 1</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-gray-600">07:00 - 08:00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-2xl font-bold text-[#ffd60a]">24/7</div>
                                            <div className="text-xs text-gray-600">Access</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-2xl font-bold text-[#ffd60a]">100%</div>
                                            <div className="text-xs text-gray-600">Secure</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-2xl font-bold text-[#ffd60a]">Fast</div>
                                            <div className="text-xs text-gray-600">Booking</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Manage Your Court
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed to make court booking simple and efficient
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Booking</h3>
                            <p className="text-gray-600">
                                Quick and intuitive booking system. Reserve your court in just a few clicks.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Reports & Analytics</h3>
                            <p className="text-gray-600">
                                Track bookings, earnings, and customer data with comprehensive reports.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Reliable</h3>
                            <p className="text-gray-600">
                                Your data is protected with industry-standard security measures.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Updates</h3>
                            <p className="text-gray-600">
                                Get instant updates on bookings and court availability in real-time.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Payment Tracking</h3>
                            <p className="text-gray-600">
                                Keep track of all payments and earnings with detailed financial records.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Friendly</h3>
                            <p className="text-gray-600">
                                Fully responsive design works perfectly on all devices and screen sizes.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Our Facilities
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Take a look at our world-class badminton courts and facilities
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Gallery Item 1 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-lg font-semibold">Court 1</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Main Court</h3>
                                    <p className="text-sm text-gray-200">Professional grade badminton court with premium flooring</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Item 2 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-green-400 to-green-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-lg font-semibold">Court 2</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Secondary Court</h3>
                                    <p className="text-sm text-gray-200">Spacious court with excellent lighting and ventilation</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Item 3 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-purple-400 to-purple-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <p className="text-lg font-semibold">Facilities</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Modern Facilities</h3>
                                    <p className="text-sm text-gray-200">Clean changing rooms and comfortable waiting area</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Item 4 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-orange-400 to-orange-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <p className="text-lg font-semibold">Lighting</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Professional Lighting</h3>
                                    <p className="text-sm text-gray-200">LED lighting system for optimal visibility</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Item 5 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-pink-400 to-pink-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-lg font-semibold">Community</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Players Community</h3>
                                    <p className="text-sm text-gray-200">Join our vibrant badminton community</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Item 6 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-yellow-400 to-yellow-600 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <p className="text-lg font-semibold">Equipment</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Quality Equipment</h3>
                                    <p className="text-sm text-gray-200">Premium rackets and shuttlecocks available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-gradient-to-br from-[#ffd60a] to-yellow-400">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Ready to Streamline Your Court Management?
                    </h2>
                    <p className="text-lg text-gray-800 mb-8">
                        Join hundreds of court managers who trust our platform for their booking needs.
                    </p>
                    <button
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl inline-flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Contact Us</span>
                    </button>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Get in Touch
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Have questions? We'd love to hear from you. Visit us or reach out through any of the channels below.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>

                                <div className="space-y-6">
                                    {/* Phone */}
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-[#ffd60a] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                                            <p className="text-gray-600">+94 77 123 4567</p>
                                            <p className="text-gray-600">+94 11 234 5678</p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-[#ffd60a] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                                            <p className="text-gray-600">info@courtbooking.com</p>
                                            <p className="text-gray-600">support@courtbooking.com</p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-[#ffd60a] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Location</h4>
                                            <p className="text-gray-600">123 Sports Complex Avenue</p>
                                            <p className="text-gray-600">Colombo 07, Sri Lanka</p>
                                        </div>
                                    </div>

                                    {/* Operating Hours */}
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-[#ffd60a] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Operating Hours</h4>
                                            <p className="text-gray-600">Monday - Sunday</p>
                                            <p className="text-gray-600">6:00 AM - 11:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Google Map */}
                        <div className="h-full min-h-[500px]">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg h-full border border-gray-200">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.798467128415!2d79.86119631477274!3d6.914611995005645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2596d3b6b8c33%3A0x3c6ec2d1c0a3e4b0!2sColombo%2007%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1234567890123!5m2!1sen!2slk"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: '500px' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Court Location Map"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}
