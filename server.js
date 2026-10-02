const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const apiRoutes = require('./backend/src/routes/api');
const { setupWebSocketServer } = require('./backend/src/websocket/ws_server');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads & Frontend Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend/src')));

// API Routes
app.use('/api', apiRoutes);

// SPA Fallback for Web Interface
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'frontend/src/index.html'));
});

const server = http.createServer(app);

// Attach WebSocket LAN Messenger Server
setupWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🟢 WiFi Messenger Local Engine running on port ${PORT}`);
    console.log(`📱 Developer Label: Developed by JoshWebs`);
    console.log(`🌐 Local LAN & Offline Messaging Server Ready`);
    console.log(`====================================================`);
});
