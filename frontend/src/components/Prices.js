
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Prices = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssetsAndPrices = async () => {
            try {
                const assetsResponse = await api.get('/prices');
                const assetsData = assetsResponse.data;

                // Fetch prices for each asset
                const assetsWithPrices = await Promise.all(assetsData.map(async (asset) => {
                    try {
                        const priceResponse = await api.get(`/prices/${asset.stockSymbol}`);
                        return {
                            ...asset,
                            yesPrice: priceResponse.data.yesPrice,
                            noPrice: priceResponse.data.noPrice
                        };
                    } catch (priceError) {
                        console.error(`Failed to fetch prices for ${asset.stockSymbol}:`, priceError);
                        return {
                            ...asset,
                            yesPrice: null,
                            noPrice: null
                        };
                    }
                }));

                setAssets(assetsWithPrices);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch assets');
                setLoading(false);
            }
        };

        fetchAssetsAndPrices();
    }, []);

    const formatPrice = (price) => {
        return price !== null ? `₹${price.toLocaleString()}` : 'N/A';
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="container mx-auto">
                <h2 className="text-3xl font-semibold text-center mb-8">All Stock Prices</h2>

                {loading && (
                    <p className="text-center text-gray-500">Loading assets...</p>
                )}

                {error && (
                    <p className="text-center text-red-500 mb-4">{error}</p>
                )}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow-lg">
                            <thead>
                                <tr>
                                    <th className="py-3 px-6 bg-blue-500 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Stock Symbol
                                    </th>
                                    <th className="py-3 px-6 bg-blue-500 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="py-3 px-6 bg-blue-500 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Yes Price
                                    </th>
                                    <th className="py-3 px-6 bg-blue-500 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        No Price
                                    </th>
                                    <th className="py-3 px-6 bg-blue-500 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        K Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.stockSymbol} className="border-b">
                                        <td className="py-4 px-6">{asset.stockSymbol}</td>
                                        <td className="py-4 px-6">{asset.description}</td>
                                        <td className="py-4 px-6">{formatPrice(asset.yesPrice)}</td>
                                        <td className="py-4 px-6">{formatPrice(asset.noPrice)}</td>
                                        <td className="py-4 px-6">{formatPrice(asset.K)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prices;
