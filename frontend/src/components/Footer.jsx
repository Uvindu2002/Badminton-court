import React from 'react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-gray-600">
                            &copy; {currentYear} <span className="font-semibold text-gray-900">Fyrax</span>. All rights reserved.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            Privacy Policy
                        </a>
                        <span className="text-gray-300">|</span>
                        <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
