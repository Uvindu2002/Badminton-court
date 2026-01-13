import React, { useState, useEffect } from 'react';
import { courtStatusAPI, pricingAPI } from '../../services/api';
import { getTodayDate } from '../../utils/dateUtils';

export default function Settings() {
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [selectedTime, setSelectedTime] = useState('06:00');
    const [selectedCourt, setSelectedCourt] = useState('Both');
    const [closeType, setCloseType] = useState('slot'); // 'slot' or 'day'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [closedSlots, setClosedSlots] = useState([]);
    const [showClosedSlots, setShowClosedSlots] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // Pricing state
    const [currentPrice, setCurrentPrice] = useState(1500);
    const [newPrice, setNewPrice] = useState('');
    const [priceEffectiveDate, setPriceEffectiveDate] = useState(getTodayDate());
    const [priceReason, setPriceReason] = useState('');
    const [pricingHistory, setPricingHistory] = useState([]);
    const [showPricingHistory, setShowPricingHistory] = useState(false);

    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00',
    ];

    const courts = ['Court 1', 'Court 2', 'Both'];

    // Fetch closed slots for selected date
    const fetchClosedSlots = async (date) => {
        try {
            console.log('Fetching closed slots for date:', date); // Debug log
            const response = await courtStatusAPI.getByDate(date);
            console.log('Closed slots response:', response.data); // Debug log
            setClosedSlots(response.data.data || []);
            setSelectedSlots([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Failed to fetch closed slots:', error);
            console.error('Error details:', error.response?.data); // Debug log
            setClosedSlots([]);
        }
    };

    // Fetch current pricing
    const fetchCurrentPricing = async () => {
        try {
            const response = await pricingAPI.getCurrent();
            setCurrentPrice(response.data.data.pricePerCourtPerHour);
        } catch (error) {
            console.error('Failed to fetch pricing:', error);
        }
    };

    // Fetch pricing history
    const fetchPricingHistory = async () => {
        try {
            const response = await pricingAPI.getHistory(20);
            setPricingHistory(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pricing history:', error);
        }
    };

    useEffect(() => {
        fetchCurrentPricing();
    }, []);

    useEffect(() => {
        if (showClosedSlots) {
            fetchClosedSlots(selectedDate);
        }
    }, [selectedDate, showClosedSlots]);

    useEffect(() => {
        if (showPricingHistory) {
            fetchPricingHistory();
        }
    }, [showPricingHistory]);

    const handleReopenSlot = async (statusId) => {
        if (!window.confirm('Are you sure you want to reopen this slot?')) return;

        try {
            await courtStatusAPI.reopen(statusId);
            setMessage({ 
                type: 'success', 
                text: 'Slot reopened successfully!' 
            });
            fetchClosedSlots(selectedDate);
            
            // Auto-hide message after 3 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to reopen slot' 
            });
        }
    };

    const handleBulkReopen = async () => {
        if (selectedSlots.length === 0) {
            setMessage({ 
                type: 'error', 
                text: 'Please select at least one slot to reopen' 
            });
            return;
        }

        if (!window.confirm(`Are you sure you want to reopen ${selectedSlots.length} slot(s)?`)) return;

        try {
            await Promise.all(selectedSlots.map(id => courtStatusAPI.reopen(id)));
            setMessage({ 
                type: 'success', 
                text: `${selectedSlots.length} slot(s) reopened successfully!` 
            });
            fetchClosedSlots(selectedDate);
            
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to reopen slots' 
            });
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedSlots([]);
        } else {
            setSelectedSlots(closedSlots.map(slot => slot._id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectSlot = (slotId) => {
        if (selectedSlots.includes(slotId)) {
            setSelectedSlots(selectedSlots.filter(id => id !== slotId));
            setSelectAll(false);
        } else {
            const newSelected = [...selectedSlots, slotId];
            setSelectedSlots(newSelected);
            if (newSelected.length === closedSlots.length) {
                setSelectAll(true);
            }
        }
    };

    const handleUpdatePricing = async () => {
        if (!newPrice || !priceEffectiveDate) {
            setMessage({ 
                type: 'error', 
                text: 'Please enter price and effective date' 
            });
            return;
        }

        if (parseFloat(newPrice) <= 0) {
            setMessage({ 
                type: 'error', 
                text: 'Price must be greater than 0' 
            });
            return;
        }

        setLoading(true);
        try {
            await pricingAPI.update({
                pricePerCourtPerHour: parseFloat(newPrice),
                effectiveDate: priceEffectiveDate,
                reason: priceReason,
            });

            setMessage({ 
                type: 'success', 
                text: 'Pricing updated successfully!' 
            });

            // Refresh current price and clear form
            fetchCurrentPricing();
            setNewPrice('');
            setPriceReason('');
            setPriceEffectiveDate(getTodayDate());

            // Refresh history if showing
            if (showPricingHistory) {
                fetchPricingHistory();
            }

            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to update pricing' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSlots = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = {
                date: selectedDate,
            };

            if (closeType === 'slot') {
                data.startTime = selectedTime;
                data.courtId = selectedCourt;
                await courtStatusAPI.closeSlot(data);
            } else if (closeType === 'fullday') {
                data.courtId = selectedCourt;
                await courtStatusAPI.closeDay(data);
            } else {
                data.courtId = 'Both';
                await courtStatusAPI.closeDay(data);
            }
            
            setMessage({ 
                type: 'success', 
                text: closeType === 'slot' 
                    ? 'Slot closed successfully!' 
                    : closeType === 'fullday'
                    ? `All slots closed for ${selectedCourt}!`
                    : 'Entire day closed for all courts!'
            });

            // Refresh closed slots list if it's open
            if (showClosedSlots) {
                fetchClosedSlots(selectedDate);
            }
            
            // Auto-hide message after 3 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to close slots' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage court availability and system settings</p>
                </div>
            </header>

            <div className="px-8 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Close Slots Card */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center mb-6">
                            <div className="bg-red-100 p-3 rounded-lg mr-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Close Courts</h2>
                                <p className="text-sm text-gray-500">Temporarily close courts for maintenance or other reasons</p>
                            </div>
                        </div>

                        {/* Success/Error Message */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg ${
                                message.type === 'success' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                                <div className="flex items-center">
                                    {message.type === 'success' ? (
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>{message.text}</span>
                                </div>
                            </div>
                        )}

                        {/* Close Type Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Close Type
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCloseType('slot')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        closeType === 'slot'
                                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                                            : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="font-semibold">Specific Slot</p>
                                        <p className="text-xs text-gray-500 mt-1">Close specific time & court</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCloseType('fullday')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        closeType === 'fullday'
                                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                                            : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="font-semibold">Full Day</p>
                                        <p className="text-xs text-gray-500 mt-1">Close all slots for selected court(s)</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCloseType('day')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        closeType === 'day'
                                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                                            : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="font-semibold">Entire Day</p>
                                        <p className="text-xs text-gray-500 mt-1">Close all courts for the day</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Time Slot (only for specific slot) */}
                            {closeType === 'slot' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Slot <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {timeSlots.map((time) => (
                                            <option key={time} value={time}>
                                                {time} - {parseInt(time.split(':')[0]) + 1}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Court Selection (for specific slot and full day) */}
                        {(closeType === 'slot' || closeType === 'fullday') && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Court to Close <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {courts.map((court) => (
                                        <button
                                            key={court}
                                            type="button"
                                            onClick={() => setSelectedCourt(court)}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                selectedCourt === court
                                                    ? 'border-red-600 bg-red-50 text-red-600'
                                                    : 'border-gray-300 hover:border-red-300'
                                            }`}
                                        >
                                            <div className="text-center">
                                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <p className="font-semibold">{court}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-900">
                                ⚠️ You are about to close:
                            </p>
                            <p className="text-sm text-yellow-800 mt-1">
                                {closeType === 'day' 
                                    ? `All courts for the entire day on ${selectedDate}`
                                    : closeType === 'fullday'
                                    ? `${selectedCourt} - All time slots (6:00 AM - 11:00 PM) on ${selectedDate}`
                                    : `${selectedCourt} at ${selectedTime} on ${selectedDate}`
                                }
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleCloseSlots}
                            disabled={loading}
                            className="w-full mt-6 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Closing...
                                </span>
                            ) : (
                                'Close Slots'
                            )}
                        </button>
                    </div>

                    {/* View Closed Slots Section */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">View Closed Slots</h2>
                                    <p className="text-sm text-gray-500">See and reopen closed court slots</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowClosedSlots(!showClosedSlots);
                                    if (!showClosedSlots) {
                                        fetchClosedSlots(selectedDate);
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {showClosedSlots ? 'Hide' : 'Show'} Closed Slots
                            </button>
                        </div>

                        {showClosedSlots && (
                            <>
                                {/* Date selector for viewing closed slots */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Date to View
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {closedSlots.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-4 text-gray-500">No closed slots for this date</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Bulk Actions Bar */}
                                        <div className="mb-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onChange={handleSelectAll}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                                        Select All ({closedSlots.length})
                                                    </span>
                                                </label>
                                                {selectedSlots.length > 0 && (
                                                    <span className="text-sm text-gray-600">
                                                        {selectedSlots.length} selected
                                                    </span>
                                                )}
                                            </div>
                                            {selectedSlots.length > 0 && (
                                                <button
                                                    onClick={handleBulkReopen}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Reopen Selected ({selectedSlots.length})
                                                </button>
                                            )}
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <span className="sr-only">Select</span>
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Time
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Court
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {closedSlots.map((slot) => (
                                                        <tr key={slot._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSlots.includes(slot._id)}
                                                                    onChange={() => handleSelectSlot(slot._id)}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {slot.startTime}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {slot.courtId}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                Closed
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleReopenSlot(slot._id)}
                                                                className="text-green-600 hover:text-green-900 font-semibold transition-colors"
                                                            >
                                                                Reopen
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Pricing Management Card */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center mb-6">
                            <div className="bg-purple-100 p-3 rounded-lg mr-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Pricing Management</h2>
                                <p className="text-sm text-gray-500">Update court pricing (affects bookings created after change)</p>
                            </div>
                        </div>

                        {/* Current Price Display */}
                        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Current Price</p>
                                    <p className="text-4xl font-bold text-purple-900 mt-1">{currentPrice} LKR</p>
                                    <p className="text-xs text-purple-700 mt-1">per court per hour</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPricingHistory(!showPricingHistory);
                                    }}
                                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors border border-purple-300"
                                >
                                    {showPricingHistory ? 'Hide' : 'Show'} History
                                </button>
                            </div>
                        </div>

                        {/* Update Pricing Form */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Price (LKR) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="e.g., 1500"
                                        min="0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Effective From <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={priceEffectiveDate}
                                        onChange={(e) => setPriceEffectiveDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Change (Optional)
                                </label>
                                <textarea
                                    value={priceReason}
                                    onChange={(e) => setPriceReason(e.target.value)}
                                    placeholder="e.g., Seasonal price adjustment, Market rate change"
                                    rows="2"
                                    maxLength="500"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <p className="text-sm font-medium text-yellow-900">
                                    ⚠️ Important:
                                </p>
                                <p className="text-sm text-yellow-800 mt-1">
                                    • Price changes affect only NEW bookings created after the effective date
                                </p>
                                <p className="text-sm text-yellow-800">
                                    • Existing bookings keep their original price
                                </p>
                            </div>

                            <button
                                onClick={handleUpdatePricing}
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Updating...' : 'Update Pricing'}
                            </button>
                        </div>

                        {/* Pricing History */}
                        {showPricingHistory && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing History</h3>
                                {pricingHistory.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No pricing history available</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Effective Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Price (LKR)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Reason
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Changed On
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {pricingHistory.map((price) => (
                                                    <tr key={price._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {price.effectiveDate}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {price.pricePerCourtPerHour} LKR
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {price.reason || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(price.createdAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pricing Info Card */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center mb-4">
                            <div className="bg-green-100 p-3 rounded-lg mr-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Pricing Information</h2>
                                <p className="text-sm text-gray-500">Current court pricing</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-600 font-medium">Single Court</p>
                                <p className="text-3xl font-bold text-blue-900 mt-2">{currentPrice.toLocaleString()} LKR</p>
                                <p className="text-xs text-blue-700 mt-1">per hour</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-600 font-medium">Both Courts</p>
                                <p className="text-3xl font-bold text-purple-900 mt-2">{(currentPrice * 2).toLocaleString()} LKR</p>
                                <p className="text-xs text-purple-700 mt-1">per hour (2 courts)</p>
                            </div>
                        </div>
                    </div>

                    {/* System Info Card */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">System Information</h2>
                                <p className="text-sm text-gray-500">Court and system details</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Total Courts</span>
                                <span className="font-semibold text-gray-900">2 Courts</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Operating Hours</span>
                                <span className="font-semibold text-gray-900">6:00 AM - 11:00 PM</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Slot Duration</span>
                                <span className="font-semibold text-gray-900">1 Hour</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Daily Slots</span>
                                <span className="font-semibold text-gray-900">17 Slots per Court</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600">System Version</span>
                                <span className="font-semibold text-gray-900">v1.0.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
