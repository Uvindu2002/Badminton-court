# Badminton Court Booking - Frontend Documentation

## 🎯 What Was Built

A complete **Admin Dashboard** for the Badminton Court Booking System with:

### ✅ Features Implemented

#### 📊 **4 Statistics Cards**
1. **Total Bookings** - Shows count of all booked courts for selected date
2. **Best Customer** - Displays customer with most bookings and their count
3. **Total Earnings** - Calculates total revenue in LKR (1500 per court/hour)
4. **Total Cancelled** - Shows number of closed/cancelled slots

#### 🔍 **Filtering System**
- **Default Filter**: Automatically shows today's bookings
- **Date Filter**: Select any date to view bookings
- **Name Filter**: Search bookings by customer name (real-time)
- **Phone Filter**: Search by phone number (real-time)
- **Quick Actions**: "Today", "Tomorrow", and "Clear Filters" buttons

#### 📋 **Bookings Table**
Displays all bookings with:
- Time slot
- Court ID (Court 1 or Court 2)
- Customer name
- Phone number
- Price (1500 LKR per court)
- Status (Booked/Closed/Maintenance) with color badges
- Delete action button

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── admin/
│   │       └── AdminDashboard.jsx  ✅ Main dashboard component
│   ├── services/
│   │   └── api.js                   ✅ API service with axios
│   ├── utils/
│   │   └── dateUtils.js             ✅ Date formatting utilities
│   ├── App.jsx                      ✅ Router setup
│   ├── App.css                      ✅ Custom styles
│   ├── index.css                    ✅ Tailwind CSS
│   └── main.jsx                     ✅ React entry point
├── .env                             ✅ Environment variables
├── package.json                     ✅ Dependencies
└── vite.config.js                   ✅ Vite configuration
```

## 🚀 Running the Application

### Prerequisites
- Node.js installed
- Backend server running on http://localhost:5000

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Frontend runs on: **http://localhost:5173**

### Build for Production
```bash
npm run build
```

## 🔑 Key Technologies Used

- **React 19.2.0** - UI framework
- **React Router DOM** - Navigation/routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS v4** - Styling
- **Vite 7** - Build tool

## 📡 API Integration

The dashboard connects to backend endpoints:

```javascript
// Base URL
http://localhost:5000/api

// Endpoints used
GET  /bookings?date=YYYY-MM-DD  - Fetch bookings by date
DELETE /bookings/:id             - Delete booking
```

## 🎨 Design Features

- **Responsive Design** - Works on mobile, tablet, desktop
- **Modern UI** - Clean, professional interface
- **Color-coded Status** - Visual feedback for booking states
- **Loading States** - Spinner while fetching data
- **Error Handling** - User-friendly error messages
- **Hover Effects** - Interactive table rows
- **Custom Scrollbar** - Sleek scrollbar design

## 📊 Statistics Calculation Logic

### Total Bookings
```javascript
Counts all bookings with status === 'Booked'
```

### Best Customer
```javascript
1. Groups bookings by customer name
2. Counts bookings per customer
3. Returns customer with highest count
```

### Total Earnings
```javascript
Sum of all booking.price where status === 'Booked'
(Each court = 1500 LKR per hour)
```

### Total Cancelled
```javascript
Counts all bookings with status === 'Closed'
```

## 🔄 Filter Behavior

1. **Date Changes** → Fetches new data from API
2. **Name/Phone Filters** → Client-side filtering (instant)
3. All filters work together (AND logic)

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add booking creation form
- [ ] Add booking edit functionality
- [ ] Add authentication/login page
- [ ] Add date range selection
- [ ] Export bookings to Excel/PDF
- [ ] Add booking status update
- [ ] Add charts/graphs for analytics
- [ ] Add email notifications
- [ ] Add payment tracking

## 📝 Notes

- Dashboard currently has no authentication (add later)
- Filters are case-insensitive
- Phone filter accepts partial matches
- Delete action requires confirmation
- Grouped bookings (Both Courts) delete together

## 🐛 Troubleshooting

**Issue**: "Failed to fetch bookings"
- ✅ Check backend is running on port 5000
- ✅ Verify MONGO_URI in backend .env
- ✅ Check browser console for errors

**Issue**: No bookings showing
- ✅ Verify date has bookings in database
- ✅ Check filters aren't too restrictive
- ✅ Try "Clear Filters" button

**Issue**: CORS errors
- ✅ Ensure backend CORS is configured for http://localhost:5173
- ✅ Check frontend .env has correct API URL
