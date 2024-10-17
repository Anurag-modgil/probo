// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Deposit from './components/Deposit';
import AddTradingCase from './components/AddTradingCase';
import PlaceOrder from './components/PlaceOrder';
import Orderbook from './components/Orderbook';
import Balance from './components/Balance';
import Prices from './components/Prices';
import { AuthProvider, AuthContext } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <AuthProvider>
            
            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/deposit" element={
                        <PrivateRoute>
                            <Deposit />
                        </PrivateRoute>
                    } />
                    <Route path="/add-trading-case" element={
                        <PrivateRoute>
                            <AddTradingCase />
                        </PrivateRoute>
                    } />
                    <Route path="/place-order" element={
                        <PrivateRoute>
                            <PlaceOrder />
                        </PrivateRoute>
                    } />
                    <Route path="/orderbook" element={
                        <PrivateRoute>
                            <Orderbook />
                        </PrivateRoute>
                    } />
                    <Route path="/balance" element={
                        <PrivateRoute>
                            <Balance />
                        </PrivateRoute>
                    } />
                    <Route path="/prices" element={
                        <PrivateRoute>
                            <Prices />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<h2>404 - Not Found</h2>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
