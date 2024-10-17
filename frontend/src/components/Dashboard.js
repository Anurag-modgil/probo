import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState({});
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [wsStatus, setWsStatus] = useState('Connecting...');
    const [webSocket, setWebSocket] = useState(null);
    const [orderbookUpdate, setOrderbookUpdate] = useState(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await api.get('/trades');
                setAssets(response.data);
            } catch (err) {
                console.error('Error fetching assets:', err);
                setError(err.response?.data?.message || 'Failed to fetch assets');
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();

        const connectWebSocket = () => {
            const WEBSOCKET_URL = 'ws://localhost:3002';
            const ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = () => {
                console.log('WebSocket connection established');
                setWsStatus('Connected');
            };

            ws.onmessage = (event) => {
                console.log("Received WebSocket message:", event.data);
                try {
                    const parsedMessage = JSON.parse(event.data);

                    if (parsedMessage) {
                        if (parsedMessage.event === 'orderbook_update') {
                            console.log('Orderbook update received:', parsedMessage);
                            setOrderbookUpdate(parsedMessage.message);
                        } else {
                            console.warn('Unknown message type:', parsedMessage);
                        }
                    } else {
                        console.error("Parsed message is undefined:", event.data);
                    }
                } catch (e) {
                    console.error("Error processing WebSocket message:", e, event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setError('WebSocket connection error');
                setWsStatus('Error');
            };

            ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                setWsStatus('Disconnected');
                if (event.code !== 1000) {
                    setTimeout(connectWebSocket, 5000);
                }
            };

            setWebSocket(ws);
        };

        connectWebSocket();

        return () => {
            if (webSocket) {
                webSocket.close(1000, 'Component unmounted');
            }
        };
    }, []);

    const handleTrade = async (stockSymbol, decision) => {
        try {
            const response = await api.post('/trade', { stockSymbol, decision });
            console.log(response.data.message);
        } catch (err) {
            console.error('Error executing trade:', err);
            setError(err.response?.data?.message || 'Failed to execute trade');
        }
    };

    return (
        <div>
            {/* Navigation Bar */}
            <nav style={{ backgroundColor: '#007BFF', color: '#fff', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Welcome, {user.username}</h2>
                    <div>
                        <Link to="/deposit" style={{ color: '#fff', marginRight: '15px' }}>Deposit INR</Link>
                        <Link to="/balance" style={{ color: '#fff', marginRight: '15px' }}>View Balance</Link>
                        <Link to="/place-order" style={{ color: '#fff', marginRight: '15px' }}>Place Order</Link>
                        <Link to="/orderbook" style={{ color: '#fff', marginRight: '15px' }}>View Orderbook</Link>
                        <Link to="/prices" style={{ color: '#fff', marginRight: '15px' }}>View Prices</Link>
                        {user.username === 'admin' && (
                            <Link to="/add-trading-case" style={{ color: '#fff', marginRight: '15px' }}>Add Trading Case</Link>
                        )}
                        <button onClick={logout} style={{ backgroundColor: '#DC3545', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
            {/* Main Content */}
            <div style={{ padding: '20px' }}>
                <h3>WebSocket Status: {wsStatus}</h3>

                <h3>Available Assets to Trade</h3>
                {loading && <p>Loading assets...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && (
                    <div>
                        {assets.length > 0 ? (
                            assets.map((asset) => (
                                <div key={asset.stockSymbol} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                                    <h4>{asset.stockSymbol}</h4>
                                    <p>Description: {asset.description}</p>
                                    <p>Price: ₹{asset.K}</p>
                                    <button onClick={() => handleTrade(asset.stockSymbol, 'yes')} style={{ marginRight: '10px' }}>
                                        Yes
                                    </button>
                                    <button onClick={() => handleTrade(asset.stockSymbol, 'no')}>
                                        No
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No assets available for trading.</p>
                        )}
                    </div>
                )}

                <h3>Buy/Sell Orders</h3>
                {ordersLoading ? (
                    <p>Loading orders...</p>
                ) : Object.keys(orders).length > 0 ? (
                    Object.entries(orders).map(([stockSymbol, orderTypes]) => (
                        <div key={stockSymbol} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                            <h4>Orderbook for {stockSymbol}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                {/* Yes Orders */}
                                <div style={{ width: '48%' }}>
                                    <h5>Yes Orders</h5>
                                    {orderTypes.yes && Object.keys(orderTypes.yes).length > 0 ? (
                                        Object.entries(orderTypes.yes).map(([price, details]) => (
                                            <div key={price} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                                                <p>Price: ₹{price}</p>
                                                <p>Total Quantity: {details.total}</p>
                                                <p>Orders:</p>
                                                <ul>
                                                    {Object.entries(details.orders).map(([userId, qty]) => (
                                                        <li key={userId}>{userId}: {qty}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No Yes Orders.</p>
                                    )}
                                </div>
                                {/* No Orders */}
                                <div style={{ width: '48%' }}>
                                    <h5>No Orders</h5>
                                    {orderTypes.no && Object.keys(orderTypes.no).length > 0 ? (
                                        Object.entries(orderTypes.no).map(([price, details]) => (
                                            <div key={price} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                                                <p>Price: ₹{price}</p>
                                                <p>Total Quantity: {details.total}</p>
                                                <p>Orders:</p>
                                                <ul>
                                                    {Object.entries(details.orders).map(([userId, qty]) => (
                                                        <li key={userId}>{userId}: {qty}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No No Orders.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No orders available.</p>
                )}

                <h3>Orderbook Updates</h3>
                <div>{orderbookUpdate}</div>
                {orderbookUpdate ? (
                    <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                        <h4>Update for {orderbookUpdate.stockSymbol}</h4>
                        <p>Price: ₹{orderbookUpdate.price}</p>
                        <p>Quantity: {orderbookUpdate.quantity}</p>
                        <p>Type: {orderbookUpdate.type}</p>
                        <p>Action: {orderbookUpdate.action}</p>
                    </div>
                ) : (
                    <p>No orderbook update received yet.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
