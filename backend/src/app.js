require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Increase timeout for long-running OCR requests (5 minutes)
app.use((req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Healthcare Advanced API is running', status: 'ok' });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth/*',
            ai: '/api/ai/analyze',
            appointments: '/api/appointments'
        }
    });
});

const aiRoutes          = require('./routes/aiRoutes');
const authRoutes        = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const hospitalRoutes    = require('./routes/hospitalRoutes');
const doctorRoutes      = require('./routes/doctorRoutes');
const departmentRoutes  = require('./routes/departmentRoutes');
const medicineRoutes    = require('./routes/medicineRoutes');

app.use('/api/auth',               authRoutes);
app.use('/api/ai',                 aiRoutes);
app.use('/api/appointments',       appointmentRoutes);
app.use('/api/hospitals',          hospitalRoutes);
app.use('/api/doctors',            doctorRoutes);
app.use('/api/departments',        departmentRoutes);
app.use('/api/medicine-suggestion',medicineRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = app;
