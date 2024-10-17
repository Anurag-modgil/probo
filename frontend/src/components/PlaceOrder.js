// src/components/PlaceOrder.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PlaceOrder = () => {
    const [action, setAction] = useState('buy');
    const [type, setType] = useState('yes');
    const [stockSymbol, setStockSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [tradingCases, setTradingCases] = useState([]);

    useEffect(() => {
        // Fetch available trading cases
        const fetchTradingCases = async () => {
            try {
                const response = await api.get('/trades');
                // Assuming /prices returns all trading cases
                // Modify backend if necessary to support fetching all trading cases
                setTradingCases(response.data);
            } catch (error) {
                console.error('Failed to fetch trading cases');
            }
        };
        fetchTradingCases();
    }, []);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        // Parse inputs
        const parsedQuantity = parseInt(quantity);
        const parsedPrice = parseFloat(price);
    
        // Validate inputs before sending the request
        if (isNaN(parsedQuantity) || parsedQuantity <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
            setMessage('Invalid quantity or price');
            setLoading(false);
            return;
        }
    
        try {
            const response = await api.post(`/order/${action}/${type}`, {
                stockSymbol,
                quantity: parsedQuantity,
                price: parsedPrice
            });
            setMessage(`Order placed successfully.`);
            if (response.data.matchResult) {
                setMessage(prev => `${prev} Trade executed immediately.`);
            }
            setQuantity('');
            setPrice('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };
    


    return (
        <div>
            <h2>Place Order</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handlePlaceOrder}>
                <div>
                    <label>Action:</label>
                    <select value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>
                <div>
                    <label>Type:</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
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
                    <label>Quantity:</label>
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Price:</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Place Order</button>
            </form>
        </div>
    );
};

export default PlaceOrder;
