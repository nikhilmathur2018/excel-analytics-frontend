import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function FileUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('Please select an Excel file to upload.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('excelFile', selectedFile);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // FIX: Removed 'const response =' as it was unused
            await axios.post('/api/upload', formData, config);
            setMessage('File uploaded and parsed successfully!');
            setLoading(false);
            navigate('/dashboard'); // Or a specific analysis page
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error uploading file.');
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Upload Excel File</h2>
            <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
                {loading ? 'Uploading...' : 'Upload & Parse'}
            </button>
            {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
        </div>
    );
}

export default FileUpload;