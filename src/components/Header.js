// client/src/components/Header.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';

function Header() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    return (
        <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center">
                    {/* Your Logo/App Name */}
                    <Link to={user ? "/dashboard" : "/"} className="text-2xl font-bold flex items-center">
                        <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Excel Analytics
                    </Link>
                </div>
                <nav>
                    <ul className="flex space-x-6">
                        {user ? (
                            <>
                                <li>
                                    <Link to="/upload" className="hover:text-purple-200 transition duration-300">Upload File</Link>
                                </li>
                                <li>
                                    <Link to="/history" className="hover:text-purple-200 transition duration-300">History</Link>
                                </li>
                                {user.role === 'admin' && ( // Admin link, only visible to admins
                                    <li>
                                        <Link to="/admin" className="hover:text-purple-200 transition duration-300">Admin Panel</Link>
                                    </li>
                                )}
                                <li>
                                    <button
                                        onClick={onLogout}
                                        className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md transition duration-300 flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1"></path></svg>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link to="/login" className="hover:text-purple-200 transition duration-300">Login</Link>
                                </li>
                                <li>
                                    <Link to="/register" className="hover:text-purple-200 transition duration-300">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;