// client/src/pages/AdminDashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For success/error messages

    // State for modals
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');


    useEffect(() => {
        // Redirect if not logged in or not an admin
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'admin') {
            navigate('/dashboard'); // Or some unauthorized page
        }
    }, [user, navigate]);

    const fetchUsers = useCallback(async () => {
        if (!user || user.role !== 'admin') return;

        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // CORRECTED LINE: Added '/api/admin' prefix
            const response = await axios.get(`${API_URL}/api/admin/users`, config);
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err.response?.data?.message || err.message);
            setError('Failed to fetch users. Please try again.');
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle delete user button click
    const handleDeleteUserClick = (userId, username) => {
        setSelectedUser({ id: userId, username: username });
        setShowDeleteConfirmModal(true);
    };

    // Handle role change button click
    const handleChangeRoleClick = (userId, username, currentRole) => {
        setSelectedUser({ id: userId, username: username, currentRole: currentRole });
        setNewRole(currentRole === 'admin' ? 'user' : 'admin'); // Toggle role
        setShowRoleConfirmModal(true);
    };


    const confirmDeleteUser = async () => {
        setShowDeleteConfirmModal(false);
        if (!selectedUser) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // CORRECTED LINE: Added '/api/admin' prefix
            await axios.delete(`${API_URL}/api/admin/users/${selectedUser.id}`, config);
            setMessage(`User ${selectedUser.username} deleted successfully.`);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error deleting user:', err.response?.data?.message || err.message);
            setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
        } finally {
            setSelectedUser(null);
        }
    };

    const confirmChangeRole = async () => {
        setShowRoleConfirmModal(false);
        if (!selectedUser || !newRole) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // CORRECTED LINE: Added '/api/admin' prefix
            await axios.put(`${API_URL}/api/admin/users/${selectedUser.id}/role`, { role: newRole }, config);
            setMessage(`User ${selectedUser.username}'s role changed to ${newRole} successfully.`);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error changing user role:', err.response?.data?.message || err.message);
            setError(`Failed to change role: ${err.response?.data?.message || err.message}`);
        } finally {
            setSelectedUser(null);
            setNewRole('');
        }
    };

    const cancelAction = () => {
        setShowDeleteConfirmModal(false);
        setShowRoleConfirmModal(false);
        setSelectedUser(null);
        setNewRole('');
    };


    if (loading) {
        return <div className="text-center py-8 text-lg text-gray-600">Loading users...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-xl text-red-600 font-semibold">{error}</div>;
    }

    // Only render if user is admin
    if (!user || user.role !== 'admin') {
        return <div className="text-center py-8 text-xl text-red-600 font-semibold">Unauthorized Access</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-6">Admin Dashboard</h1>
                <p className="text-xl text-gray-600 mb-8">Manage users and roles in your application.</p>

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <span className="block sm:inline">{message}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((userItem) => (
                                <tr key={userItem._id} className="hover:bg-gray-50">
                                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.username}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">{userItem.email}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">{userItem.role}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm">
                                        <div className="flex space-x-2">
                                            {/* Prevent changing own role or deleting self if you want */}
                                            {userItem._id !== user._id && (
                                                <>
                                                    <button
                                                        onClick={() => handleChangeRoleClick(userItem._id, userItem.username, userItem.role)}
                                                        className={`px-3 py-1 rounded-md text-white transition duration-200
                                                            ${userItem.role === 'admin' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                                                    >
                                                        {userItem.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUserClick(userItem._id, userItem.username)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                        <p className="mb-6">Are you sure you want to delete user "{selectedUser.username}"?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteUser}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={cancelAction}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Role Confirmation Modal */}
            {showRoleConfirmModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-lg font-bold mb-4">Confirm Role Change</h3>
                        <p className="mb-6">Are you sure you want to change "{selectedUser.username}"'s role to "{newRole}"?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmChangeRole}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition duration-200"
                            >
                                Yes, Change Role
                            </button>
                            <button
                                onClick={cancelAction}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;