// client/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux'; // Assuming Redux Toolkit is used for auth state
import { useNavigate } from 'react-router-dom'; // For redirection
import { createPortal } from 'react-dom'; // For custom modal

// 1. Define API_URL using the environment variable
const API_URL = process.env.REACT_APP_API_URL;

// Custom Modal Component (replaces window.confirm)
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <p className="text-lg font-semibold mb-4">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>,
        document.body // Portal to the body
    );
};


function AdminDashboard() {
    // Access user state from Redux (assuming state.auth.user holds user info and token)
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Effect to check admin role and fetch users
    useEffect(() => {
        // Redirect if user is not logged in or not an admin
        if (!user || user.role !== 'admin') {
            navigate('/dashboard'); // Or '/login' if they are not logged in at all
            return; // Stop execution if not authorized
        }

        const fetchUsers = async () => {
            try {
                setLoading(true); // Set loading true before fetch
                setError(null); // Clear previous errors
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`, // Include JWT token
                    },
                };
                // FIX: Use API_URL for fetching users
                const response = await axios.get(`${API_URL}api/admin/users`, config);
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to fetch users. Please try again.');
            } finally {
                setLoading(false); // Set loading false after fetch (success or error)
            }
        };

        // Only fetch users if user is authenticated and is an admin
        if (user && user.role === 'admin') {
            fetchUsers();
        }
    }, [user, navigate]); // Dependencies: re-run if user or navigate changes

    // Handle user deletion (uses custom modal instead of window.confirm)
    const handleDeleteUser = (userId) => {
        setUserToDelete(userId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setShowDeleteModal(false); // Close the modal
        if (!userToDelete) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // FIX: Use API_URL for deleting a user
            await axios.delete(`${API_URL}api/admin/users/${userToDelete}`, config);
            // Filter out the deleted user from the state to update UI
            setUsers(users.filter((u) => u._id !== userToDelete));
            setUserToDelete(null); // Clear user to delete
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };


    // Handle updating user role
    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // FIX: Use API_URL for updating user role
            await axios.put(`${API_URL}api/admin/users/${userId}/role`, { role: newRole }, config);
            // Update the user's role in the local state to reflect changes immediately
            setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
        } catch (err) {
            console.error('Error updating user role:', err);
            setError('Failed to update user role. Please try again.');
        }
    };

    // Conditional rendering for loading, error, and main content
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Loading admin data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-red-600 text-lg p-4 bg-red-100 rounded-md shadow-sm">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Admin Dashboard</h1>

                <h2 className="text-2xl font-bold text-gray-700 mb-4">Manage Users</h2>

                {users.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No users found in the system.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Username</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{u.username}</td>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="relative inline-block text-left">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm appearance-none bg-white border"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    {/* Chevron icon for dropdown */}
                                                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteUser(u._id)}
                                                className="bg-red-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
                                            >
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
            {showDeleteModal && (
                <ConfirmationModal
                    message="Are you sure you want to delete this user? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
}

export default AdminDashboard;