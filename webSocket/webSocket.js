const WebSocket = require('ws');
const Redis = require('ioredis');

// Create Redis subscriber instance
const redisSub = new Redis();

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3002 });

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send a welcome message when a new client connects
    ws.send(JSON.stringify({ message: 'Connected to WebSocket server' }));

    ws.onmessage = function (event) {
      const message = event.data;
      try {
          const parsedMessage = JSON.parse(message);
  
          if (parsedMessage && typeof parsedMessage.message === 'object' )
          {
            
          }
      } catch (e) {
          console.error("Error processing WebSocket message:", e, message);
      }
  };
  

    // Handle client disconnects
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Subscribe to the Redis channel for orderbook updates
redisSub.subscribe('orderbook_updates', (err, count) => {
    if (err) {
        console.error('Failed to subscribe to Redis channel:', err);
    } else {
        console.log(`Subscribed to ${count} Redis channels. Waiting for updates...`);
    }
});


redisSub.on('message', (channel, message) => {
  if (channel === 'orderbook_updates') {
      console.log('Received orderbook update:', message);

      // Parse the incoming message from Redis
      let parsedMessage;
      try {
          parsedMessage = JSON.parse(message);
      } catch (e) {
          console.error("Failed to parse Redis message:", message);
          return;
      }

      // Send the update to all connected WebSocket clients
      wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage)); // Send as a valid JSON string
          }
      });
  }
});

console.log('WebSocket server is running on ws://localhost:3002');
