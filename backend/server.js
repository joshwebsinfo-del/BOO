const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const resourcesRoutes = require('./routes/resources');
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');
const notificationsRoutes = require('./routes/notifications');

const { errorHandler } = require('./middleware/error');

const app = express();
const port = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Production-ready and open for Expo mobile connections
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Base health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Kwekwe Poly Backend running smoothly' });
});

// Centralized error handling
app.use(errorHandler);

// Listen
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Standalone EduMentor backend listening on port ${port}`);
});
