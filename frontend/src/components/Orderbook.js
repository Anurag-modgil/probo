import React, { useState } from 'react';
import api from '../services/api';

const Orderbook = () => {
    const [stockSymbol, setStockSymbol] = useState('');
    const [orderbook, setOrderbook] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state

    const handleViewOrderbook = async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading
        try {
            const response = await api.get(`/orderbook/${stockSymbol}`);
            setOrderbook(response.data);
            setMessage('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to fetch orderbook');
            setOrderbook(null);
        } finally {
            setLoading(false); // End loading
        }
    };

    console.log(orderbook)
    // Helper function to compute total quantity
    const computeTotal = (ordersArray) => {
        return ordersArray.reduce((sum, order) => sum + order.quantity, 0);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">View Orderbook</h2>
                <form onSubmit={handleViewOrderbook} className="mb-6">
                    <div className="mb-4">
                        <label className="block mb-2 font-medium">Stock Symbol:</label>
                        <input 
                            type="text" 
                            value={stockSymbol} 
                            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())} 
                            required 
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? 'Loading...' : 'View Orderbook'}
                    </button>
                </form>
                {message && <p className="text-red-500 text-center mb-4">{message}</p>}
                {orderbook && (
                    <div className="space-y-8">
                        {/* Yes Orders */}
                        <div>
                            <h3 className="text-xl font-medium mb-4">Yes Orders</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Buy Orders */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Buy Orders</h4>
                                    {orderbook.yes && orderbook.yes.buy && Object.keys(orderbook.yes.buy).length > 0 ? (
                                        Object.entries(orderbook.yes.buy).map(([price, orders], index) => (
                                            <div key={`yes-buy-${price}-${index}`} className="border rounded-lg p-4 mb-2 bg-green-50">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-semibold">Price: {price}</span>
                                                    <span>Total Quantity: <span className="font-bold">{computeTotal(orders)}</span></span>
                                                </div>
                                                <ul className="ml-4">
                                                    {orders.map((order, orderIndex) => (
                                                        <li key={`yes-buy-${price}-${order.userId}-${orderIndex}`} className="flex justify-between">
                                                            <span>{order.userId} ({order.action} {order.type})</span>: <span className="font-bold">{order.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No Buy Orders Available</p>
                                    )}
                                </div>
                                {/* Sell Orders */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Sell Orders</h4>
                                    {orderbook.yes && orderbook.yes.sell && Object.keys(orderbook.yes.sell).length > 0 ? (
    Object.entries(orderbook.yes.sell).map(([price, orders], index) => (
        <div key={`yes-sell-${price}-${index}`} className="border rounded-lg p-4 mb-2 bg-red-50">
            <div className="flex justify-between mb-2">
                <span className="font-semibold">Price: {price}</span>
                <span>Total Quantity: <span className="font-bold">{computeTotal(orders)}</span></span>
            </div>
            <ul className="ml-4">
                {orders.map((order, orderIndex) => (
                    <li key={`yes-sell-${price}-${order.userId}-${orderIndex}`} className="flex justify-between">
                        <span>{order.userId} ({order.action} {order.type})</span>: <span className="font-bold">{order.quantity}</span>
                    </li>
                ))}
            </ul>
        </div>
    ))
) : (
    <p className="text-gray-500">No Sell Orders Available</p>
)}

                                </div>
                            </div>
                        </div>

                        {/* No Orders */}
                        <div>
                            <h3 className="text-xl font-medium mb-4">No Orders</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Buy Orders */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Buy Orders</h4>
                                    {orderbook.no && orderbook.no.buy && Object.keys(orderbook.no.buy).length > 0 ? (
                                        Object.entries(orderbook.no.buy).map(([price, orders], index) => (
                                            <div key={`no-buy-${price}-${index}`} className="border rounded-lg p-4 mb-2 bg-green-50">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-semibold">Price: {price}</span>
                                                    <span>Total Quantity: <span className="font-bold">{computeTotal(orders)}</span></span>
                                                </div>
                                                <ul className="ml-4">
                                                    {orders.map((order, orderIndex) => (
                                                        <li key={`no-buy-${price}-${order.userId}-${orderIndex}`} className="flex justify-between">
                                                            <span>{order.userId} ({order.action} {order.type})</span>: <span className="font-bold">{order.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No Buy Orders Available</p>
                                    )}
                                </div>
                                {/* Sell Orders */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Sell Orders</h4>
                                    {orderbook.no && orderbook.no.sell && Object.keys(orderbook.no.sell).length > 0 ? (
                                        Object.entries(orderbook.no.sell).map(([price, orders], index) => (
                                            <div key={`no-sell-${price}-${index}`} className="border rounded-lg p-4 mb-2 bg-red-50">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-semibold">Price: {price}</span>
                                                    <span>Total Quantity: <span className="font-bold">{computeTotal(orders)}</span></span>
                                                </div>
                                                <ul className="ml-4">
                                                    {orders.map((order, orderIndex) => (
                                                        <li key={`no-sell-${price}-${order.userId}-${orderIndex}`} className="flex justify-between">
                                                            <span>{order.userId} ({order.action} {order.type})</span>: <span className="font-bold">{order.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No Sell Orders Available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orderbook;
