// src/components/Balance.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Balance = () => {
    const [balance, setBalance] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await api.get('/balance');
                setBalance(response.data);
            } catch (error) {
                setMessage(error.response?.data?.message || 'Failed to fetch balance');
            }
        };
        fetchBalance();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-semibold mb-6 text-center">Your Balance</h2>
                {message && <p className="text-red-500 text-center mb-4">{message}</p>}
                {balance ? (
                    <div>
                        <h3 className="text-xl font-medium mb-4">INR:</h3>
                        <p className="mb-2">
                            Available: <span className="font-bold">{balance.INR.balance.toLocaleString()} INR</span> | 
                            Locked: <span className="font-bold">{balance.INR.locked.toLocaleString()} INR</span>
                        </p>
                        
                        <h3 className="text-xl font-medium mb-4">Stocks:</h3>
                        {Object.keys(balance.stocks).length === 0 ? (
                            <p>No stock holdings.</p>
                        ) : (
                            Object.entries(balance.stocks).map(([stock, types]) => (
                                <div key={stock} className="border p-4 rounded-lg mb-4 shadow-sm">
                                    <h4 className="text-lg font-semibold">{stock}</h4>
                                    <p>
                                        Yes - Quantity: <span className="font-bold">{types.yes.quantity}</span>, 
                                        Locked: <span className="font-bold">{types.yes.locked}</span>
                                    </p>
                                    <p>
                                        No - Quantity: <span className="font-bold">{types.no.quantity}</span>, 
                                        Locked: <span className="font-bold">{types.no.locked}</span>
                                    </p>
                                </div>
                            ))
                        )}
                         <Link to="/dashboard" className="text-blue-500 hover:underline">
                        Back to Dashboard
                    </Link>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">Loading balance...</p>
                )}
            </div>
           
        </div>
    );
};

export default Balance;
