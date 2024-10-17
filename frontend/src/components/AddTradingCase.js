import React, { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddTradingCase = () => {
    const [stockSymbol, setStockSymbol] = useState('');
    const [description, setDescription] = useState('');
    const [K, setK] = useState('');
    const [message, setMessage] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Restrict access to admin users
    if (user.username !== 'admin') {
        return <p>Access denied. Admins only.</p>;
    }
    
    const handleAddCase = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/admin/add-trading-case', { 
                stockSymbol,
                description,
                K: parseFloat(K) // Ensure price is a number
            });
            setMessage(response.data.message);
            // Clear inputs after successful submission
            setStockSymbol('');
            setDescription('');
            setK('');
            navigate('/dashboard');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to add trading case');
        }
    };

    return (
        <div>
            <h2>Add Trading Case</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleAddCase}>
                <div>
                    <label>Stock Symbol:</label>
                    <input 
                        type="text" 
                        value={stockSymbol} 
                        onChange={(e) => setStockSymbol(e.target.value.toUpperCase())} 
                        required 
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Price:</label>
                    <input 
                        type="number" 
                        value={K} 
                        onChange={(e) => setK(e.target.value)} 
                        // required 
                        // step="0.01" // Allow decimal values
                    />
                </div>
                <button type="submit">Add Trading Case</button>
            </form>
        </div>
    );
};

export default AddTradingCase;
