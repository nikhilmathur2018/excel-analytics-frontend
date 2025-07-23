// client/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the API_URL based on the environment variable
const API_URL = process.env.REACT_APP_API_URL; // This should be http://localhost:5000

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
    user: user ? user : null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Register User
export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        // CORRECTED LINE: Added '/api' before '/auth/register'
        const response = await axios.post(`${API_URL}/api/auth/register`, userData);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Login User
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
    try {
        // CORRECTED LINE: Added '/api' before '/auth/login'
        const response = await axios.post(`${API_URL}/api/auth/login`, userData);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Logout
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => { state.isLoading = true; })
            .addCase(register.fulfilled, (state, action) => { state.isLoading = false; state.isSuccess = true; state.user = action.payload; })
            .addCase(register.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; state.user = null; })
            .addCase(login.pending, (state) => { state.isLoading = true; })
            .addCase(login.fulfilled, (state, action) => { state.isLoading = false; state.isSuccess = true; state.user = action.payload; })
            .addCase(login.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; state.user = null; })
            .addCase(logout.fulfilled, (state) => { state.user = null; });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;