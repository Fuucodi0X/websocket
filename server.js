// websocket-server.js
import 'dotenv/config'
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const PORT = process.env.PORT; // Choose a port (e.g., 3001)
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

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

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
    // Get the nfc_id and device_id from request body
    const {nfc_id, device_id} = req.body;

    if (!nfc_id || !device_id) { // Check for expected data
      console.error("[WS Server] Invalid data received for broadcast:", nfc_id, device_id);
      return res.status(400).json({ message: 'Invalid scan data received' });
    }

    console.log(`[WS Server] Received scan via HTTP, broadcasting nfc_id: ${nfc_id} from device_id: ${device_id}`);

    // *** Use io.emit() to broadcast to ALL connected clients ***
    if(device_id == "device_a" || "SM-N950U" || "SM-N986N") {
      io.emit('admin_card_registration', nfc_id)
    } else if (device_id == "device_b") {
      io.emit('admin_card_link', nfc_id)
    } else if (device_id == "device_c") {
      io.emit('library', nfc_id)
    }

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