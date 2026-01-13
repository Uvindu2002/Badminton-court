import React, { useState, useEffect, useMemo } from 'react';
import { bookingAPI } from '../../services/api';
import { getTodayDate, formatDisplayDate } from '../../utils/dateUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedBookings, setSelectedBookings] = useState([]);
    
    // Filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [courtFilter, setCourtFilter] = useState('All');

    // Fetch all bookings
    const fetchAllBookings = async () => {
        setLoading(true);
        setError('');
        try {
            // If date range is specified, fetch for that range
            if (dateFrom && dateTo) {
                const allBookings = [];
                const startDate = new Date(dateFrom);
                const endDate = new Date(dateTo);
                
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const response = await bookingAPI.getByDate(dateStr);
                    const actualBookings = response.data.data
                        .filter(slot => slot.booking !== null && slot.booking.customerName !== 'CLOSED')
                        .map(slot => ({...slot.booking, bookingDate: dateStr}));
                    allBookings.push(...actualBookings);
                }
                setBookings(allBookings);
            } else {
                // Fetch bookings from last 30 days to next 60 days by default
                const allBookings = [];
                const today = new Date();
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 30); // 30 days ago
                const endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 60); // 60 days ahead
                
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    try {
                        const response = await bookingAPI.getByDate(dateStr);
                        const actualBookings = response.data.data
                            .filter(slot => slot.booking !== null && slot.booking.customerName !== 'CLOSED')
                            .map(slot => ({...slot.booking, bookingDate: dateStr}));
                        allBookings.push(...actualBookings);
                    } catch (err) {
                        // Continue if a particular date fails
                        console.log(`Failed to fetch bookings for ${dateStr}`);
                    }
                }
                setBookings(allBookings);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

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

    // Apply filters
    const filteredBookings = useMemo(() => {
        return groupedBookings.filter(booking => {
            const matchesName = booking.customerName.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesPhone = booking.mobileNumber.includes(phoneFilter);
            const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
            const matchesCourt = courtFilter === 'All' || 
                (courtFilter === 'Both' && booking.courtType === 'Both Courts') ||
                (courtFilter === 'Single' && booking.courtType !== 'Both Courts');
            
            return matchesName && matchesPhone && matchesStatus && matchesCourt;
        });
    }, [groupedBookings, nameFilter, phoneFilter, statusFilter, courtFilter]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalBookings = filteredBookings.filter(b => 
            b.status === 'Pending' || b.status === 'Completed' || b.status === 'Booked'
        ).length;
        const totalEarnings = filteredBookings
            .filter(b => b.status === 'Completed' || b.status === 'Booked')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const bothCourtsCount = filteredBookings.filter(b => b.courtType === 'Both Courts').length;
        const singleCourtCount = filteredBookings.filter(b => b.courtType !== 'Both Courts').length;

        return {
            totalBookings,
            totalEarnings,
            bothCourtsCount,
            singleCourtCount,
        };
    }, [filteredBookings]);

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Badminton Court Booking Report', 105, 20, { align: 'center' });
            
            // Horizontal line under header
            doc.setDrawColor(37, 99, 235);
            doc.setLineWidth(0.5);
            doc.line(14, 25, 196, 25);
            
            // Report details
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
            if (dateFrom && dateTo) {
                doc.text(`Period: ${formatDisplayDate(dateFrom)} to ${formatDisplayDate(dateTo)}`, 14, 37);
            }
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            
            // Table data
            const tableData = filteredBookings.map(booking => [
                booking.bookingDate || '-',
                booking.customerName,
                booking.mobileNumber,
                booking.courtType,
                `${booking.startTime} - ${booking.endTime}`,
                booking.status,
                `LKR ${booking.totalPrice.toLocaleString()}`,
            ]);
            
            // Add table using autoTable
            autoTable(doc, {
                startY: dateFrom && dateTo ? 42 : 37,
                head: [['Date', 'Customer Name', 'Phone Number', 'Court Type', 'Time Slot', 'Status', 'Price']],
                body: tableData,
                theme: 'striped',
                headStyles: { 
                    fillColor: [37, 99, 235], 
                    textColor: 255, 
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center'
                },
                styles: { 
                    fontSize: 8, 
                    cellPadding: 4,
                    halign: 'left'
                },
                columnStyles: {
                    0: { cellWidth: 24, halign: 'center' },
                    1: { cellWidth: 32 },
                    2: { cellWidth: 28, halign: 'center' },
                    3: { cellWidth: 28, halign: 'center' },
                    4: { cellWidth: 32, halign: 'center' },
                    5: { cellWidth: 22, halign: 'center' },
                    6: { cellWidth: 26, halign: 'right' },
                },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });
            
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    105,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
            
            // Save PDF
            const fileName = `booking-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const handleApplyFilter = () => {
        fetchAllBookings();
    };

    const handleResetFilter = () => {
        setDateFrom('');
        setDateTo('');
        setNameFilter('');
        setPhoneFilter('');
        setStatusFilter('All');
        setCourtFilter('All');
        setSelectedBookings([]);
        fetchAllBookings();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBookings(filteredBookings.map(b => b._id));
        } else {
            setSelectedBookings([]);
        }
    };

    const handleSelectBooking = (bookingId) => {
        if (selectedBookings.includes(bookingId)) {
            setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
        } else {
            setSelectedBookings([...selectedBookings, bookingId]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBookings.length === 0) {
            alert('Please select bookings to delete');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)?`)) {
            return;
        }

        try {
            await bookingAPI.bulkDelete(selectedBookings);
            setSelectedBookings([]);
            fetchAllBookings();
            alert('Bookings deleted successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete bookings');
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
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Booking Reports</h1>
                        <p className="text-sm md:text-base text-gray-600 mt-1">View and export booking data</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:space-x-3">
                        {selectedBookings.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg text-sm md:text-base"
                            >
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="font-semibold">Delete ({selectedBookings.length})</span>
                            </button>
                        )}
                        <button
                            onClick={exportToPDF}
                            disabled={filteredBookings.length === 0}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-sm md:text-base"
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-semibold">Export PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6 mb-6 md:mb-8">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Filters</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            min={dateFrom}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search by name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="text"
                            value={phoneFilter}
                            onChange={(e) => setPhoneFilter(e.target.value)}
                            placeholder="Search by phone"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Court Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Court Type</label>
                        <select
                            value={courtFilter}
                            onChange={(e) => setCourtFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="All">All Courts</option>
                            <option value="Both">Both Courts</option>
                            <option value="Single">Single Court</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleApplyFilter}
                        className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm md:text-base"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleResetFilter}
                        className="bg-gray-200 text-gray-700 px-4 md:px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm md:text-base"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs md:text-sm font-medium">Total Bookings</p>
                            <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.totalBookings}</p>
                        </div>
                        <div className="bg-blue-400 bg-opacity-30 p-2 md:p-3 rounded-lg">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs md:text-sm font-medium">Total Earnings</p>
                            <p className="text-xl md:text-3xl font-bold mt-1 md:mt-2">LKR {stats.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-400 bg-opacity-30 p-2 md:p-3 rounded-lg">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs md:text-sm font-medium">Both Courts</p>
                            <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.bothCourtsCount}</p>
                        </div>
                        <div className="bg-purple-400 bg-opacity-30 p-2 md:p-3 rounded-lg">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs md:text-sm font-medium">Single Court</p>
                            <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.singleCourtCount}</p>
                        </div>
                        <div className="bg-orange-400 bg-opacity-30 p-2 md:p-3 rounded-lg">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded-lg mb-4 md:mb-6 text-sm md:text-base">
                    {error}
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-md overflow-hidden">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">All Bookings ({filteredBookings.length})</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-500 text-base md:text-lg">No bookings found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking, index) => (
                                    <tr key={booking._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedBookings.includes(booking._id)}
                                                onChange={() => handleSelectBooking(booking._id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDisplayDate(booking.bookingDate || booking.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {booking.mobileNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                booking.courtType === 'Both Courts' 
                                                    ? 'bg-purple-100 text-purple-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {booking.courtType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {booking.startTime} - {booking.endTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            LKR {booking.totalPrice.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
