import React, { useState, useEffect, useMemo } from 'react';
import { bookingAPI } from '../../services/api';
import { getTodayDate, formatDisplayDate } from '../../utils/dateUtils';

export default function AdminDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');

    // Fetch bookings
    const fetchBookings = async (date) => {
        setLoading(true);
        setError('');
        try {
            const response = await bookingAPI.getByDate(date);
            // Filter only actual bookings (exclude available slots and closed status)
            const actualBookings = response.data.data
                .filter(slot => slot.booking !== null && slot.booking.status !== 'Closed' && slot.booking.customerName !== 'CLOSED')
                .map(slot => slot.booking);
            setBookings(actualBookings);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(selectedDate);
    }, [selectedDate]);

    // Group bookings by groupId (for multi-hour bookings)
    const groupedBookings = useMemo(() => {
        const groups = {};
        
        bookings.forEach(booking => {
            const key = booking.groupId || booking._id;
            
            if (!groups[key]) {
                groups[key] = {
                    ...booking,
                    slots: [booking],
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    totalPrice: booking.price || 0,
                };
            } else {
                groups[key].slots.push(booking);
                groups[key].totalPrice += booking.price || 0;
                
                // Update start and end times to cover all slots
                if (booking.startTime < groups[key].startTime) {
                    groups[key].startTime = booking.startTime;
                }
                if (booking.endTime > groups[key].endTime) {
                    groups[key].endTime = booking.endTime;
                }
            }
        });
        
        return Object.values(groups);
    }, [bookings]);

    // Filtered bookings based on search (exclude closed slots)
    const filteredBookings = useMemo(() => {
        return groupedBookings.filter(booking => {
            const matchesName = booking.customerName.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesPhone = booking.mobileNumber.includes(phoneFilter);
            const notClosed = booking.status !== 'Closed' && booking.customerName !== 'CLOSED';
            return matchesName && matchesPhone && notClosed;
        });
    }, [groupedBookings, nameFilter, phoneFilter]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalBookings = filteredBookings.filter(b => 
            b.status === 'Pending' || b.status === 'Completed' || b.status === 'Booked'
        ).length;
        const totalEarnings = filteredBookings
            .filter(b => b.status === 'Completed' || b.status === 'Booked')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const totalCancelled = filteredBookings.filter(b => b.status === 'Cancelled' || b.status === 'Closed').length;

        // Find best customer (most bookings)
        const customerCounts = {};
        filteredBookings.forEach(booking => {
            if ((booking.status === 'Completed' || booking.status === 'Booked' || booking.status === 'Pending') && booking.customerName !== 'CLOSED') {
                customerCounts[booking.customerName] = (customerCounts[booking.customerName] || 0) + 1;
            }
        });

        const bestCustomer = Object.entries(customerCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            totalBookings,
            totalEarnings,
            totalCancelled,
            bestCustomer: bestCustomer ? { name: bestCustomer[0], count: bestCustomer[1] } : null,
        };
    }, [filteredBookings]);

    const handleDeleteBooking = async (booking) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;

        try {
            // If booking has multiple slots (groupId), delete all of them
            if (booking.groupId && booking.slots.length > 1) {
                // Delete all slots in the group
                await Promise.all(booking.slots.map(slot => bookingAPI.delete(slot._id)));
            } else {
                // Delete single booking
                await bookingAPI.delete(booking._id);
            }
            
            fetchBookings(selectedDate);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete booking');
        }
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            await bookingAPI.update(bookingId, { status: newStatus });
            fetchBookings(selectedDate);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Booked':
                return 'bg-blue-100 text-blue-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            case 'Closed':
                return 'bg-gray-100 text-gray-800';
            case 'Maintenance':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">Overview of your badminton court bookings</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-xs md:text-sm text-gray-500">Selected Date</p>
                            <p className="text-base md:text-lg font-semibold text-gray-900">{formatDisplayDate(selectedDate)}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
                    {/* Total Bookings */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Total Bookings</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{stats.totalBookings}</p>
                            </div>
                            <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Best Customer */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600">Best Customer</p>
                                <p className="text-base md:text-xl font-bold text-gray-900 mt-1 md:mt-2 truncate">
                                    {stats.bestCustomer ? stats.bestCustomer.name : 'N/A'}
                                </p>
                                <p className="text-xs md:text-sm text-gray-500">
                                    {stats.bestCustomer ? `${stats.bestCustomer.count} bookings` : 'No bookings yet'}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Earnings */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                                    {stats.totalEarnings.toLocaleString()} <span className="text-base md:text-lg">LKR</span>
                                </p>
                            </div>
                            <div className="bg-green-100 p-2 md:p-3 rounded-full">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Cancelled */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Total Cancelled</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{stats.totalCancelled}</p>
                            </div>
                            <div className="bg-red-100 p-2 md:p-3 rounded-full">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Filters</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Name Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Phone Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                placeholder="Search by phone..."
                                value={phoneFilter}
                                onChange={(e) => setPhoneFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Quick Date Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => setSelectedDate(getTodayDate())}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                setSelectedDate(tomorrow.toISOString().split('T')[0]);
                            }}
                            className="px-3 md:px-4 py-2 bg-gray-600 text-white text-sm md:text-base rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Tomorrow
                        </button>
                        <button
                            onClick={() => {
                                setNameFilter('');
                                setPhoneFilter('');
                            }}
                            className="px-3 md:px-4 py-2 bg-red-600 text-white text-sm md:text-base rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                            All Bookings ({filteredBookings.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="px-4 md:px-6 py-12 text-center">
                            <p className="text-red-600 text-sm md:text-base">{error}</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="px-4 md:px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mt-4 text-gray-500 text-sm md:text-base">No bookings found for this date</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Court
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
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
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {booking.startTime}
                                                {booking.slots && booking.slots.length > 1 && (
                                                    <span className="text-gray-500"> - {booking.endTime}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {booking.courtId}
                                                {booking.slots && booking.slots.length > 1 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {booking.slots.length} hour{booking.slots.length > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {booking.customerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {booking.mobileNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {booking.totalPrice?.toLocaleString() || 0} LKR
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative inline-block min-w-[140px]">
                                                    <select
                                                        value={booking.status}
                                                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                            backgroundPosition: 'right 0.5rem center',
                                                            backgroundRepeat: 'no-repeat',
                                                            backgroundSize: '1.25rem 1.25rem',
                                                        }}
                                                        className={`w-full appearance-none px-4 py-2.5 pr-10 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm ${
                                                            booking.status === 'Pending' 
                                                                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 hover:from-yellow-100 hover:to-yellow-200 focus:ring-yellow-400 border-2 border-yellow-300' 
                                                                : booking.status === 'Completed' 
                                                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 hover:from-green-100 hover:to-green-200 focus:ring-green-400 border-2 border-green-300'
                                                                : booking.status === 'Cancelled'
                                                                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 hover:from-red-100 hover:to-red-200 focus:ring-red-400 border-2 border-red-300'
                                                                : booking.status === 'Booked'
                                                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 hover:from-blue-100 hover:to-blue-200 focus:ring-blue-400 border-2 border-blue-300'
                                                                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-gray-100 hover:to-gray-200 focus:ring-gray-400 border-2 border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteBooking(booking)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
