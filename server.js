// websocket-server.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const PORT = process.env.WS_PORT || 3005; // Choose a port (e.g., 3001)
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    // IMPORTANT: Restrict this in production to your frontend URL!
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket"] // Match client transport
});

// Middleware to parse JSON bodies for the internal HTTP endpoint
app.use(express.json());

// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
  console.log(`[WS Server] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WS Server] Client disconnected: ${socket.id}`);
  });
  // You could add listeners here for messages FROM clients if needed
});

// --- Internal HTTP Endpoint for API Route to Trigger Broadcast ---
app.post('/api/internal/broadcast-scan', (req, res) => {
  try {
    const scanData = req.body;
    if (!scanData || !scanData.personnelData) { // Check for expected data
      console.error("[WS Server] Invalid data received for broadcast:", scanData);
      return res.status(400).json({ message: 'Invalid scan data received' });
    }

    console.log(`[WS Server] Received scan via HTTP, broadcasting 'scanUpdate' for user: ${scanData.personnelData.name}`);

    // *** Use io.emit() to broadcast to ALL connected clients ***
    io.emit('scanUpdate', scanData);

    res.status(200).json({ success: true, message: 'Scan broadcasted successfully' });
  } catch (error) {
    console.error("[WS Server] Error handling internal broadcast request:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Start the HTTP and WebSocket Server ---
httpServer.listen(PORT, () => {
  console.log(`[WS Server] Running on http://localhost:${PORT}`);
  console.log(`[WS Server] Internal broadcast endpoint: POST /api/internal/broadcast-scan`);
});