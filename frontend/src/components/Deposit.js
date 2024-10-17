// src/components/Deposit.js
import React, { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Deposit = () => {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleDeposit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/deposit', { amount: parseFloat(amount) });
            setMessage(`Deposit successful`);
      
            setAmount('');
        } catch (error) {
            setError(error.response?.data?.message || 'Deposit failed');
            setMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6">Deposit INR</h2>
                
                {message && <p className="text-center text-green-500 mb-4">{message}</p>}
                {error && <p className="text-center text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleDeposit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Amount:</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            required 
                            className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount in INR"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Deposit
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/dashboard" className="text-blue-500 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Deposit;
