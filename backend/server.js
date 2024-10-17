const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Redis = require('ioredis');

const redisPub = new Redis(); // Redis instance for publishing



const app = express();
const port = 3000;





// Middleware configurations
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

app.use(bodyParser.json());


const users = {}; // { username: { username, password } }
const INR_BALANCES = {}; // { username: { balance, locked } }
const ORDERBOOK = {}; // { stockSymbol: { yes: { buy: Map, sell: Map }, no: { buy: Map, sell: Map } } }
const STOCK_BALANCES = {}; // { username: { stockSymbol: { yes: { quantity, locked }, no: { quantity, locked } } } }
const TRADING_CASES = {}; // { stockSymbol: { description, K } }

const JWT_SECRET = 'ello';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

function initialiseUserBalance(userId) {
    if (!INR_BALANCES[userId]) {
        INR_BALANCES[userId] = { balance: 0, locked: 0 };
    }
}

function ensureUserStockBalance(userId, stockSymbol) {
    if (!STOCK_BALANCES[userId]) {
        STOCK_BALANCES[userId] = {};
    }
    if (!STOCK_BALANCES[userId][stockSymbol]) {
        STOCK_BALANCES[userId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 }
        };
    }
}

async function createAdminUser() {
    const adminUsername = 'admin';
    const adminPassword = 'admin';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    users[adminUsername] = { username: adminUsername, password: hashedPassword };
    initialiseUserBalance(adminUsername);
}
createAdminUser();





app.post('/register', async (req, res) => {
    const { username, password } = req.body;
   
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { username, password: hashedPassword };
    initialiseUserBalance(username);
    res.status(201).json({ message: 'User created successfully' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users[username];
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
});

app.post('/deposit', authenticateToken, (req, res) => {
    const { amount } = req.body;
    const userId = req.user.username;
    if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    initialiseUserBalance(userId);
    INR_BALANCES[userId].balance += amount;
    res.json({ message: 'Deposit successful' });
});

app.post('/admin/add-trading-case', authenticateToken, (req, res) => {
    const { stockSymbol, description, K } = req.body;
    const userId = req.user.username;

    TRADING_CASES[stockSymbol] = { description, K };
    ORDERBOOK[stockSymbol] = {
        yes: { buy: new Map(), sell: new Map() },
        no: { buy: new Map(), sell: new Map() }
    };
    res.status(201).json({ message: 'Stock symbol added successfully' });
});

app.get('/trades', authenticateToken, (req, res) => {
    const assetsDetailed = []; 

    for (const stockSymbol in TRADING_CASES) {
        assetsDetailed.push({
            stockSymbol,
            description: TRADING_CASES[stockSymbol].description,
            K: TRADING_CASES[stockSymbol].K
        });
    }
    
    res.json(assetsDetailed);
});

function executeTrade(buyerId, sellerId, stockSymbol, type, quantity, buyPrice, sellPrice) {
    const buyerCost = quantity * buyPrice;
    const sellerProceeds = quantity * sellPrice;

    INR_BALANCES[buyerId].locked -= buyerCost;
    
    ensureUserStockBalance(buyerId, stockSymbol);
    STOCK_BALANCES[buyerId][stockSymbol][type].quantity += quantity;

    ensureUserStockBalance(sellerId, stockSymbol);
    STOCK_BALANCES[sellerId][stockSymbol][type].locked -= quantity;
    STOCK_BALANCES[sellerId][stockSymbol][type].quantity -= quantity;
    INR_BALANCES[sellerId].balance += sellerProceeds;

    const update = {
        event: 'price_update',
        stockSymbol,
        type,
        price: sellPrice,
        quantity
    };

    redisPub.publish('orderbook_updates', JSON.stringify(update));


    

    console.log(`Trade Executed:
        Buyer: ${buyerId}
        Seller: ${sellerId}
        Stock: ${stockSymbol}
        Type: ${type}
        Quantity: ${quantity}
        Buyer Paid: ${buyerCost}
        Seller Received: ${sellerProceeds}`);
}

function matchAndExecuteOrders(stockSymbol, type, action, price, quantity, userId) {
    const oppositeAction = action === 'buy' ? 'sell' : 'buy';
    const oppositeType = type;
    const oppositePrice = price;
    const ordersToMatch = ORDERBOOK[stockSymbol][oppositeType][oppositeAction].get(oppositePrice) || [];
    let remainingQuantity = quantity;
    const matchResults = [];

    for (const oppositeOrder of ordersToMatch) {
        if (remainingQuantity <= 0) break;
        const matchQuantity = Math.min(remainingQuantity, oppositeOrder.quantity);
        executeTrade(
            action === 'buy' ? userId : oppositeOrder.userId,
            action === 'buy' ? oppositeOrder.userId : userId,
            stockSymbol,
            type,
            matchQuantity,
            action === 'buy' ? price : oppositePrice,
            action === 'buy' ? oppositePrice : price
        );
        matchResults.push({
            quantity: matchQuantity,
            price: action === 'buy' ? price : oppositePrice
        });
        remainingQuantity -= matchQuantity;
        oppositeOrder.quantity -= matchQuantity;
    }

    ORDERBOOK[stockSymbol][oppositeType][oppositeAction].set(
        oppositePrice,
        ordersToMatch.filter(order => order.quantity > 0)
    );

    return matchResults;
}

function addOrderToOrderbook(stockSymbol, type, action, price, order) {
    if (!ORDERBOOK[stockSymbol][type][action].has(price)) {
        ORDERBOOK[stockSymbol][type][action].set(price, []);
    }
    ORDERBOOK[stockSymbol][type][action].get(price).push(order);
    const update = {
        event: 'orderbook_update',
        stockSymbol,
        type,
        action,
        price,
        quantity: order.quantity
    };
    redisPub.publish('orderbook_updates', JSON.stringify(update));
}

app.post('/order/:action/:type', authenticateToken, (req, res) => {
    const { action, type } = req.params;
    const { stockSymbol, quantity, price } = req.body;
    const userId = req.user.username;

    if (typeof quantity !== 'number' || quantity <= 0 || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Invalid quantity or price' });
    }

    ensureUserStockBalance(userId, stockSymbol);
    if (action === 'buy') {
        INR_BALANCES[userId].locked += quantity * price;
        addOrderToOrderbook(stockSymbol, type, action, price, { userId, quantity });
        const matchedOrders = matchAndExecuteOrders(stockSymbol, type, action, price, quantity, userId);
        res.json({ message: 'Buy order added', matchedOrders });
    } else if (action === 'sell') {
        const availableQuantity = STOCK_BALANCES[userId][stockSymbol][type].quantity;
        if (availableQuantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock quantity' });
        }
        STOCK_BALANCES[userId][stockSymbol][type].locked += quantity;
        addOrderToOrderbook(stockSymbol, type, action, price, { userId, quantity });
        const matchedOrders = matchAndExecuteOrders(stockSymbol, type, action, price, quantity, userId);
        res.json({ message: 'Sell order added', matchedOrders });
    } else {
        res.status(400).json({ message: 'Invalid action' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
