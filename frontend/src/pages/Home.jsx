import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Home() {
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
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/availability"
                                className="px-6 py-2.5 bg-[#ffd60a] text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>View Availability</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

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
                                Check real-time court availability and book your preferred time slot.
                                The modern way to reserve your badminton court.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/availability"
                                    className="px-8 py-4 bg-[#ffd60a] text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <span>Check Availability</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </Link>
                                <a
                                    href="#contact"
                                    className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-200 hover:border-[#ffd60a] transition-all text-center"
                                >
                                    Contact Us
                                </a>
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
                                            <div className="text-2xl font-bold text-[#ffd60a]">2</div>
                                            <div className="text-xs text-gray-600">Courts</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-2xl font-bold text-[#ffd60a]">17</div>
                                            <div className="text-xs text-gray-600">Slots/Day</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-2xl font-bold text-[#ffd60a]">6-11</div>
                                            <div className="text-xs text-gray-600">AM to PM</div>
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
                            Why Choose Our Court?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Premium badminton facilities with easy booking
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
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Availability</h3>
                            <p className="text-gray-600">
                                Check court availability instantly. See what slots are open before you call.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Hours</h3>
                            <p className="text-gray-600">
                                Open from 6 AM to 11 PM. Book hourly slots that fit your schedule.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#ffd60a]">
                            <div className="w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-[#ffd60a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Facilities</h3>
                            <p className="text-gray-600">
                                Professional-grade courts with quality flooring and equipment.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Our Facilities
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Take a look at our professional badminton courts and amenities
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Gallery Image 1 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <img
                                src="/images/gallery1.png"
                                alt="Professional Badminton Court"
                                className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-lg font-bold">Court 1</h3>
                                    <p className="text-sm text-gray-200">Professional wooden flooring</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Image 2 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                            <img
                                src="/images/gallery2.png"
                                alt="Reception & Lobby"
                                className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-lg font-bold">Reception Area</h3>
                                    <p className="text-sm text-gray-200">Modern waiting lounge</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Image 3 */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 md:col-span-2 lg:col-span-1">
                            <img
                                src="/images/gallery3.png"
                                alt="Court in Action"
                                className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-lg font-bold">Game Time</h3>
                                    <p className="text-sm text-gray-200">Professional-grade facilities</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gallery CTA */}
                    <div className="text-center mt-10">
                        <Link
                            to="/availability"
                            className="inline-flex items-center space-x-2 px-8 py-3 bg-[#ffd60a] text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl"
                        >
                            <span>Book Your Court Now</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section id="location" className="py-16 md:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Find Us
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Visit our conveniently located badminton facility
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Map Embed */}
                        <div className="rounded-2xl overflow-hidden shadow-xl h-80 lg:h-96">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253482.02028987045!2d79.7861641!3d6.9218386!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Court Location"
                            ></iframe>
                        </div>

                        {/* Location Details */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-[#ffd60a] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Address</h3>
                                        <p className="text-gray-600 mt-1">
                                            123 Sports Avenue,<br />
                                            Colombo 07,<br />
                                            Sri Lanka
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Operating Hours</h3>
                                        <p className="text-gray-600 mt-1">
                                            Monday - Sunday<br />
                                            6:00 AM - 11:00 PM
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Parking Available</h3>
                                        <p className="text-gray-600 mt-1">
                                            Free parking for all customers
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href="https://www.google.com/maps/dir//Colombo,+Sri+Lanka"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all w-full justify-center mt-4"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <span>Get Directions</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Get In Touch
                        </h2>
                        <p className="text-lg text-gray-600">
                            Contact us to book your court or ask any questions
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Phone */}
                        <a
                            href="tel:+94771234567"
                            className="bg-gradient-to-br from-[#ffd60a]/10 to-yellow-50 rounded-2xl shadow-lg p-8 border border-[#ffd60a]/20 hover:shadow-xl transition-all hover:scale-105 group"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#ffd60a] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
                                <p className="text-2xl font-bold text-[#ffd60a]">+94 77 123 4567</p>
                                <p className="text-sm text-gray-500 mt-2">Available 6 AM - 11 PM</p>
                            </div>
                        </a>

                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/94771234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8 border border-green-200 hover:shadow-xl transition-all hover:scale-105 group"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
                                <p className="text-2xl font-bold text-green-600">+94 77 123 4567</p>
                                <p className="text-sm text-gray-500 mt-2">Quick response guaranteed</p>
                            </div>
                        </a>

                        {/* Email */}
                        <a
                            href="mailto:info@courtbooking.lk"
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 border border-blue-200 hover:shadow-xl transition-all hover:scale-105 group"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                                <p className="text-xl font-bold text-blue-600">info@courtbooking.lk</p>
                                <p className="text-sm text-gray-500 mt-2">We reply within 24 hours</p>
                            </div>
                        </a>
                    </div>

                    {/* CTA Banner */}
                    <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to Book Your Court?
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Check real-time availability and secure your preferred time slot today!
                        </p>
                        <Link
                            to="/availability"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-[#ffd60a] text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>View Court Availability</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}

