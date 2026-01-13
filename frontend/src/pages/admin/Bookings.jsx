import React, { useState, useEffect } from 'react';
import { bookingAPI, pricingAPI } from '../../services/api';
import { getTodayDate, formatDisplayDate } from '../../utils/dateUtils';

export default function Bookings() {
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formData, setFormData] = useState({
        customerName: '',
        mobileNumber: '',
        courtSelection: '', // 'Court 1', 'Court 2', or 'Both'
        duration: 1, // Number of hours
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentPrice, setCurrentPrice] = useState(1500);

    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00',
    ];

    const courts = ['Court 1', 'Court 2'];

    // Fetch slots for selected date
    const fetchSlots = async (date) => {
        setLoading(true);
        try {
            const response = await bookingAPI.getByDate(date);
            console.log('Fetched slots:', response.data.data); // Debug log
            setSlots(response.data.data);
        } catch (error) {
            console.error('Failed to fetch slots:', error);
            console.error('Error details:', error.response?.data);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch current pricing
    const fetchCurrentPricing = async () => {
        try {
            const response = await pricingAPI.getCurrent();
            setCurrentPrice(response.data.data.pricePerCourtPerHour);
        } catch (error) {
            console.error('Failed to fetch pricing:', error);
            setCurrentPrice(1500); // Fallback to default
        }
    };

    useEffect(() => {
        fetchSlots(selectedDate);
        fetchCurrentPricing();
    }, [selectedDate]);

    // Generate calendar for current month
    const generateCalendar = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const calendar = [];
        let week = new Array(7).fill(null);
        
        // Fill in the days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
            week[dayOfWeek] = day;
            
            if (dayOfWeek === 6 || day === daysInMonth) {
                calendar.push([...week]);
                week = new Array(7).fill(null);
            }
        }
        
        return { year, month, calendar };
    };

    const { year, month, calendar } = generateCalendar();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const handleDateClick = (day) => {
        if (day) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setSelectedDate(dateStr);
        }
    };

    const isDateSelected = (day) => {
        if (!day) return false;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr === selectedDate;
    };

    const isDatePast = (day) => {
        if (!day) return false;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr < getTodayDate();
    };

    const handleSlotClick = (slot) => {
        console.log('Slot clicked:', slot); // Debug log
        console.log('Is available:', slot?.isAvailable); // Debug log
        
        if (!slot) {
            console.log('No slot data');
            return;
        }
        
        if (slot.isAvailable) {
            // Set the slot with courtId already from the slot object
            const slotToBook = {
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                courtId: slot.courtId
            };
            console.log('Opening modal with slot:', slotToBook); // Debug log
            setSelectedSlot(slotToBook);
            setFormData(prev => ({ ...prev, courtSelection: slot.courtId, duration: 1 }));
            setShowModal(true);
            setMessage({ type: '', text: '' });
        } else {
            console.log('Slot not available, status:', slot.booking?.status); // Debug log
        }
    };

    // Calculate price based on court selection and duration
    const calculatePrice = () => {
        const basePrice = currentPrice; // LKR per court per hour
        let courtCount = 1;
        
        if (formData.courtSelection === 'Both') {
            courtCount = 2;
        }
        
        return basePrice * courtCount * formData.duration;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Check if all slots for the duration are available
    const checkSlotAvailability = (courtId, startTime, duration) => {
        const startHour = parseInt(startTime.split(':')[0]);
        
        for (let i = 0; i < duration; i++) {
            const checkHour = startHour + i;
            const checkTime = `${checkHour.toString().padStart(2, '0')}:00`;
            
            const slot = slots.find(s => s.courtId === courtId && s.startTime === checkTime);
            
            if (!slot || !slot.isAvailable) {
                return { available: false, blockedTime: checkTime };
            }
        }
        
        return { available: true };
    };

    // Get list of time slots that will be occupied
    const getOccupiedSlots = () => {
        if (!selectedSlot || !formData.duration) return [];
        
        const startHour = parseInt(selectedSlot.startTime.split(':')[0]);
        const slots = [];
        
        for (let i = 0; i < formData.duration; i++) {
            const hour = startHour + i;
            slots.push(`${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`);
        }
        
        return slots;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Validate slot availability for duration
            let courtsToCheck = [formData.courtSelection];
            if (formData.courtSelection === 'Both') {
                courtsToCheck = ['Court 1', 'Court 2'];
            }

            // Check availability for all courts
            for (const court of courtsToCheck) {
                const availability = checkSlotAvailability(court, selectedSlot.startTime, formData.duration);
                
                if (!availability.available) {
                    setMessage({ 
                        type: 'error', 
                        text: `${court} is not available at ${availability.blockedTime}. Please select a different time or shorter duration.` 
                    });
                    setLoading(false);
                    return;
                }
            }

            // Calculate end time based on start time and duration
            const startHour = parseInt(selectedSlot.startTime.split(':')[0]);
            const endHour = startHour + formData.duration;
            const endTime = `${endHour.toString().padStart(2, '0')}:00`;

            const bookingData = {
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: endTime,
                courtId: formData.courtSelection,
                customerName: formData.customerName,
                mobileNumber: formData.mobileNumber,
            };

            await bookingAPI.create(bookingData);
            
            setMessage({ 
                type: 'success', 
                text: 'Booking created successfully!' 
            });
            
            // Reset and refresh
            setTimeout(() => {
                setShowModal(false);
                setFormData({ customerName: '', mobileNumber: '', courtSelection: '', duration: 1 });
                setSelectedSlot(null);
                fetchSlots(selectedDate);
            }, 1500);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to create booking' 
            });
        } finally {
            setLoading(false);
        }
    };

    const getSlotForCourtAndTime = (courtId, time) => {
        return slots.find(s => s.courtId === courtId && s.startTime === time);
    };

    const isSlotInPast = (slotTime) => {
        // Only check for today's date
        const today = getTodayDate();
        if (selectedDate !== today) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const slotHour = parseInt(slotTime.split(':')[0]);
        
        // If slot hour has already passed, it's in the past
        if (slotHour < currentHour) return true;
        
        // If it's the current hour but we're past 30 minutes, consider it past
        if (slotHour === currentHour && currentMinute > 30) return true;
        
        return false;
    };

    const getSlotStatus = (slot) => {
        if (!slot) return 'loading';
        if (slot.isClosed) return 'closed';
        
        // Check if slot is in the past
        if (isSlotInPast(slot.startTime)) return 'past';
        
        if (!slot.isAvailable) return 'booked';
        return 'available';
    };

    const getSlotColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
            case 'booked':
                return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed';
            case 'closed':
                return 'bg-gray-100 text-gray-600 border-gray-300 cursor-not-allowed';
            case 'past':
                return 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60';
            default:
                return 'bg-gray-50 text-gray-400 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Book a Court</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Select a date and available time slot to create a booking</p>
                </div>
            </header>

            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left Side - Calendar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:sticky lg:top-6">
                            <div className="mb-4">
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">{monthNames[month]} {year}</h2>
                                <p className="text-xs md:text-sm text-gray-500">Select a date</p>
                            </div>

                            {/* Calendar Grid */}
                            <div className="calendar">
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendar.map((week, weekIndex) => (
                                        week.map((day, dayIndex) => (
                                            <button
                                                key={`${weekIndex}-${dayIndex}`}
                                                onClick={() => handleDateClick(day)}
                                                disabled={!day || isDatePast(day)}
                                                className={`
                                                    aspect-square p-1 md:p-2 rounded-lg text-xs md:text-sm font-medium transition-all
                                                    ${!day ? 'invisible' : ''}
                                                    ${isDatePast(day) ? 'text-gray-300 cursor-not-allowed' : ''}
                                                    ${isDateSelected(day) 
                                                        ? 'bg-blue-600 text-white shadow-md' 
                                                        : day && !isDatePast(day)
                                                        ? 'bg-gray-50 text-gray-900 hover:bg-blue-100 border border-gray-200'
                                                        : ''
                                                    }
                                                `}
                                            >
                                                {day}
                                            </button>
                                        ))
                                    ))}
                                </div>
                            </div>

                            {/* Selected Date Info */}
                            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs md:text-sm font-medium text-blue-900">Selected Date</p>
                                <p className="text-base md:text-lg font-bold text-blue-600 mt-1">{formatDisplayDate(selectedDate)}</p>
                            </div>

                            {/* Legend */}
                            <div className="mt-4 md:mt-6 space-y-2">
                                <p className="text-xs md:text-sm font-semibold text-gray-700">Legend:</p>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 md:w-4 md:h-4 bg-green-100 border border-green-300 rounded"></div>
                                    <span className="text-xs text-gray-600">Available</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 md:w-4 md:h-4 bg-red-100 border border-red-300 rounded"></div>
                                    <span className="text-xs text-gray-600">Booked</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-100 border border-gray-300 rounded"></div>
                                    <span className="text-xs text-gray-600">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Available Slots */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                            <div className="mb-4 md:mb-6">
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Available Time Slots</h2>
                                <p className="text-xs md:text-sm text-gray-500">Click on an available slot to book</p>
                                {/* Debug info */}
                                <div className="mt-2 text-xs text-gray-400">
                                    Modal: {showModal ? 'Open' : 'Closed'} | Selected: {selectedSlot ? 'Yes' : 'No'}
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12 md:py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-4 md:mx-0">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700 text-sm md:text-base">Time</th>
                                                <th className="text-center py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700 text-sm md:text-base">Court 1</th>
                                                <th className="text-center py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700 text-sm md:text-base">Court 2</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timeSlots.map((time) => (
                                                <tr key={time} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-gray-900 text-sm md:text-base">
                                                        {time}
                                                        <span className="text-xs text-gray-500 ml-1 md:ml-2">
                                                            - {parseInt(time.split(':')[0]) + 1}:00
                                                        </span>
                                                    </td>
                                                    {courts.map((court) => {
                                                        const slot = getSlotForCourtAndTime(court, time);
                                                        const status = getSlotStatus(slot);
                                                        return (
                                                            <td key={court} className="py-2 px-4">
                                                                <button
                                                                    onClick={() => handleSlotClick(slot)}
                                                                    disabled={status !== 'available'}
                                                                    className={`
                                                                        w-full py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all
                                                                        ${getSlotColor(status)}
                                                                    `}
                                                                >
                                                                    {status === 'available' && (
                                                                        <span className="flex items-center justify-center">
                                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
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
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showModal && selectedSlot && (
                <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg md:rounded-xl shadow-2xl w-full max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-blue-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg md:text-xl font-bold">Create Booking</h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedSlot(null);
                                        setFormData({ customerName: '', mobileNumber: '', courtSelection: '', duration: 1 });
                                        setMessage({ type: '', text: '' });
                                    }}
                                    className="text-white hover:text-gray-200"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4">
                            {/* Success/Error Message */}
                            {message.text && (
                                <div className={`mb-3 p-2 rounded-lg ${
                                    message.type === 'success' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                    <div className="flex items-center text-sm">
                                        {message.type === 'success' ? (
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <span>{message.text}</span>
                                    </div>
                                </div>
                            )}

                            {/* Booking Details */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">Booking Details</p>
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Date:</span> {formatDisplayDate(selectedSlot.date)}</p>
                                    <p><span className="font-medium">Start Time:</span> {selectedSlot.startTime}</p>
                                    {formData.duration > 0 && (
                                        <p><span className="font-medium">End Time:</span> {parseInt(selectedSlot.startTime.split(':')[0]) + formData.duration}:00</p>
                                    )}
                                </div>
                                
                                {/* Show occupied time slots */}
                                {formData.duration > 1 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-600 mb-1">Time Slots to be Occupied:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {getOccupiedSlots().map((slot, index) => (
                                                <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Court Selection */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Court <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, courtSelection: 'Court 1' }))}
                                        className={`p-2 rounded-lg border-2 transition-all ${
                                            formData.courtSelection === 'Court 1'
                                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm">Court 1</p>
                                        <p className="text-xs mt-1">{currentPrice}/hr</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, courtSelection: 'Court 2' }))}
                                        className={`p-2 rounded-lg border-2 transition-all ${
                                            formData.courtSelection === 'Court 2'
                                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm">Court 2</p>
                                        <p className="text-xs mt-1">{currentPrice}/hr</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, courtSelection: 'Both' }))}
                                        className={`p-2 rounded-lg border-2 transition-all ${
                                            formData.courtSelection === 'Both'
                                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm">Both</p>
                                        <p className="text-xs mt-1">{currentPrice * 2}/hr</p>
                                    </button>
                                </div>
                            </div>

                            {/* Duration Selection */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration (Hours) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(hours => (
                                        <option key={hours} value={hours}>
                                            {hours} {hours === 1 ? 'Hour' : 'Hours'} ({hours * currentPrice} LKR per court)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-3">
                                    {/* Customer Name and Mobile Number */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Customer Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="customerName"
                                                value={formData.customerName}
                                                onChange={handleInputChange}
                                                placeholder="Enter customer name"
                                                maxLength={100}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                placeholder="0771234567"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Must be 10 digits</p>
                                        </div>
                                    </div>

                                    {/* Price Display */}
                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Court(s):</span>
                                                <span className="font-semibold">
                                                    {formData.courtSelection || 'Not selected'}
                                                    {formData.courtSelection === 'Both' && ' (×2)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Duration:</span>
                                                <span className="font-semibold">{formData.duration} {formData.duration === 1 ? 'hour' : 'hours'}</span>
                                            </div>
                                            <div className="border-t border-blue-200 pt-2 mt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Total Price</span>
                                                    <span className="text-xl font-bold text-blue-600">
                                                        {formData.courtSelection ? calculatePrice().toLocaleString() : '0'} LKR
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex space-x-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={loading || !formData.courtSelection}
                                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? 'Creating...' : 'Confirm Booking'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setSelectedSlot(null);
                                                setFormData({ customerName: '', mobileNumber: '', courtSelection: '', duration: 1 });
                                                setMessage({ type: '', text: '' });
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
