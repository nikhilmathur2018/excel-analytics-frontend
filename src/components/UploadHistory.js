import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // Assuming Link is used for navigation to analyze page

// 1. Define API_URL using the environment variable
const API_URL = process.env.REACT_APP_API_URL;

function UploadHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFiles, setExpandedFiles] = useState({});
    const [showFileConfirmModal, setShowFileConfirmModal] = useState(false);
    const [showSheetConfirmModal, setShowSheetConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { user } = useSelector((state) => state.auth);

    const fetchHistory = useCallback(async () => {
        try {
            if (!user || !user.token) {
                setError('User not authenticated. Please log in.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            // Ensure the API_URL is correctly prefixed with /api
            const response = await axios.get(`${API_URL}/api/upload/history`, config);
            console.log("Fetched history:", response.data);
            setHistory(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching history:", err.response ? err.response.data : err.message);
            setError('Failed to fetch upload history. Please try again.');
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setLoading(false);
            setHistory([]);
            setError(null);
        }
    }, [user, fetchHistory]);

    const handleToggleExpand = (fileId) => {
        setExpandedFiles(prev => ({
            ...prev,
            [fileId]: !prev[fileId]
        }));
    };

    const handleDeleteClick = (type, fileId, name, sheetName = null) => {
        setItemToDelete({ type, id: fileId, name, sheetName });
        if (type === 'file') {
            setShowFileConfirmModal(true);
        } else if (type === 'sheet') {
            const file = history.find(f => f._id === fileId);
            if (file && file.sheetNames.length === 1) {
                // If it's the last sheet, treat as file deletion
                setItemToDelete({ type: 'file', id: fileId, name: file.originalFileName }); // Use originalFileName
                setShowFileConfirmModal(true);
            } else {
                setShowSheetConfirmModal(true);
            }
        }
    };

    const confirmSheetDelete = async () => {
        setShowSheetConfirmModal(false);
        if (!itemToDelete || itemToDelete.type !== 'sheet') return;

        try {
            if (!user || !user.token) {
                setError('Authentication required to delete sheet.');
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            // Ensure the API_URL is correctly prefixed with /api
            await axios.put(`${API_URL}/api/upload/${itemToDelete.id}/sheet/${itemToDelete.sheetName}`, {}, config);

            await fetchHistory();
            setItemToDelete(null);
            setError(null);
            console.log(`Sheet "${itemToDelete.sheetName}" deleted successfully from file ${itemToDelete.name}.`);
        } catch (err) {
            console.error("Error deleting sheet:", err.response ? err.response.data : err.message);
            setError(`Failed to delete sheet: ${err.response?.data?.message || err.message}`);
        }
    };

    const confirmFileDelete = async () => {
        setShowFileConfirmModal(false);
        if (!itemToDelete || itemToDelete.type !== 'file') return;

        try {
            if (!user || !user.token) {
                setError('Authentication required to delete file.');
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            // Ensure the API_URL is correctly prefixed with /api
            await axios.delete(`${API_URL}/api/upload/${itemToDelete.id}`, config);

            await fetchHistory();
            setItemToDelete(null);
            setError(null);
            console.log(`File ${itemToDelete.name} deleted successfully.`);
        } catch (err) {
            console.error("Error deleting file:", err.response ? err.response.data : err.message);
            setError(`Failed to delete file: ${err.response?.data?.message || err.message}`);
        }
    };

    const cancelDeletion = () => {
        setShowFileConfirmModal(false);
        setShowSheetConfirmModal(false);
        setItemToDelete(null);
    };

    if (loading) return <div className="text-center py-4 text-gray-600">Loading upload history...</div>;
    if (error) return <div className="text-red-500 text-center py-4 font-semibold">{error}</div>;

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-800 border-b pb-3">Your Upload History</h2>
            {history.length === 0 ? (
                <p className="text-gray-600 italic">No Excel files uploaded yet. Upload one to get started!</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {history.map((file) => (
                        <li key={file._id} className="py-3 px-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center flex-grow">
                                    <button
                                        onClick={() => handleToggleExpand(file._id)}
                                        className="mr-2 p-1 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition duration-200"
                                        title={expandedFiles[file._id] ? "Collapse sheets" : "Expand sheets"}
                                    >
                                        {expandedFiles[file._id] ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 011.414 0L10 10.586l3.293-3.293a1 1 011.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    <Link
                                        to={`/analyze/${file._id}`}
                                        className="text-blue-700 hover:text-blue-900 hover:underline text-lg font-medium flex-grow"
                                    >
                                        {/* CORRECTED LINE: Changed file.originalName to file.originalFileName */}
                                        {file.originalFileName} (Uploaded on: {/* CORRECTED LINE: Changed file.uploadDate to file.createdAt */}
                                        {new Date(file.createdAt).toLocaleDateString()})
                                    </Link>
                                </div>
                                <button
                                    onClick={() => handleDeleteClick('file', file._id, file.originalFileName)} // Use originalFileName here too
                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 text-sm font-medium ml-4"
                                >
                                    Delete File
                                </button>
                            </div>

                            {expandedFiles[file._id] && file.sheetNames && file.sheetNames.length > 0 && (
                                <ul className="ml-8 mt-2 border-l-2 border-gray-200 pl-4 space-y-1">
                                    {file.sheetNames.map((sheetName) => (
                                        <li key={`${file._id}-${sheetName}`} className="flex justify-between items-center py-1">
                                            <span className="text-gray-700 text-base flex-grow">Sheet: {sheetName}</span>
                                            <button
                                                onClick={() => handleDeleteClick('sheet', file._id, file.originalFileName, sheetName)} // Use originalFileName here too
                                                className="px-2 py-1 bg-red-400 text-white rounded-md hover:bg-red-500 transition duration-200 text-xs font-medium ml-2"
                                                title={`Delete sheet "${sheetName}"`}
                                            >
                                                Delete Sheet
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {expandedFiles[file._id] && (!file.sheetNames || file.sheetNames.length === 0) && (
                                <p className="ml-8 mt-2 text-gray-500 italic text-sm">No sheets found for this file.</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {showSheetConfirmModal && itemToDelete && itemToDelete.type === 'sheet' && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-lg font-bold mb-4">Confirm Sheet Deletion</h3>
                        <p className="mb-6">Are you sure you want to delete sheet "{itemToDelete.sheetName}" from "{itemToDelete.name}"?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmSheetDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                            >
                                Yes, Delete Sheet
                            </button>
                            <button
                                onClick={cancelDeletion}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFileConfirmModal && itemToDelete && itemToDelete.type === 'file' && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-lg font-bold mb-4">Confirm File Deletion</h3>
                        <p className="mb-6">
                            Are you sure you want to delete the entire file "{itemToDelete.name}"?
                            {itemToDelete.sheetName && <span className="block mt-2 text-sm text-gray-600">(This was the last sheet: "{itemToDelete.sheetName}")</span>}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmFileDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                            >
                                Yes, Delete File
                            </button>
                            <button
                                onClick={cancelDeletion}
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

export default UploadHistory;