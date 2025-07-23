// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import your actual page components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import Analyze from './pages/Analyze';
import FileUpload from './components/FileUpload'; // Corrected import for the file upload component
import UploadHistory from './components/UploadHistory'; // Your UploadHistory component
import AdminDashboard from './pages/AdminDashboard'; // Import the new AdminDashboard component

function App() {
    const { user } = useSelector((state) => state.auth);

    // PrivateRoute component to handle authentication and role-based access
    const PrivateRoute = ({ children, roles }) => {
        if (!user) {
            // If user is not logged in, redirect to login page
            return <Navigate to="/login" />;
        }
        // If roles are specified and the user's role is not included, redirect to dashboard
        if (roles && !roles.includes(user.role)) {
            return <Navigate to="/dashboard" />;
        }
        // If authenticated and authorized, render the children components
        return children;
    };

    return (
        <Router>
            <Header /> {/* Your Header component, likely for navigation */}
            <div className="container mx-auto p-4">
                <Routes>
                    {/* Public routes: Redirect to dashboard if user is already logged in */}
                    <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                    <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

                    {/* Protected routes for authenticated users */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/upload"
                        element={
                            <PrivateRoute>
                                <FileUpload /> {/* Render the correct FileUpload component */}
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/history"
                        element={
                            <PrivateRoute>
                                <UploadHistory />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/analyze/:fileId"
                        element={
                            <PrivateRoute> {/* Analyze page also needs protection */}
                                <Analyze />
                            </PrivateRoute>
                        }
                    />

                    {/* Protected route for Admin Dashboard, requiring 'admin' role */}
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute roles={['admin']}>
                                <AdminDashboard /> {/* Render the actual AdminDashboard component */}
                            </PrivateRoute>
                        }
                    />

                    {/* Default route: Redirect to dashboard if logged in, otherwise to login */}
                    <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
