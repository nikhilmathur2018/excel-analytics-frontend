import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Import the new components
import FileUpload from '../components/FileUpload';
import UploadHistory from '../components/UploadHistory'; // Corrected import path

// Register Chart.js components (important for charts to work)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        // Redirect to login if user is not authenticated
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]); // Dependencies for the effect

    // Render nothing or a loading spinner if user is not yet loaded
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4 animate-fadeInDown">
                    Welcome, <span className="text-purple-600">{user.username}!</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 animate-fadeInUp">
                    Your central hub for Excel data analysis and visualization.
                </p>

                {/* File Upload Section - Directly integrated here */}
                <div className="mb-8">
                    <FileUpload />
                </div>

                {/* Upload History Section */}
                <div className="mt-8">
                    <UploadHistory />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* The "Upload Excel File" card was removed as the FileUpload component
                        is directly integrated above. */}

                    {/* Feature Card: Analysis History */}
                    <div
                        onClick={() => navigate('/history')}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer transform hover:scale-105"
                    >
                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">Analysis History</h2>
                        <p className="text-green-100">Review your past uploads and generated reports.</p>
                    </div>

                    {/* Feature Card: Admin Panel (Conditional) */}
                    {user.role === 'admin' && (
                        <div
                            onClick={() => navigate('/admin')}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer transform hover:scale-105"
                        >
                            <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
                            <p className="text-red-100">Manage users and system settings.</p>
                        </div>
                    )}
                </div>

                {/* Optional: Add a section for recent activity or quick insights */}
                <div className="mt-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Quick Insights & Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Your Latest Upload</h3>
                            <p className="text-gray-600">No recent uploads found. Upload your first file to see insights here!</p>
                            {/* The "Upload Now" button has been removed as it was redundant. */}
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Next Steps</h3>
                            <ul className="list-disc list-inside text-gray-600">
                                <li>Explore different chart types for your data.</li>
                                <li>Utilize AI summaries for quick insights.</li>
                                <li>Download your generated charts in various formats.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
