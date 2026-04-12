const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./services/loggerService');
const { connectRedis } = require('./config/redisClient');

// Initialize Performance Cache
connectRedis();

const app = express();

// Increase timeout for long-running OCR requests (5 minutes)
app.use((req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
});

// --- ENTERPRISE SECURITY & HARDENING ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// --- CENTRALIZED LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MediCare Plus API Docs'
}));

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
const analyticsRoutes   = require('./routes/analyticsRoutes');
const auditRoutes       = require('./routes/auditRoutes');
const orderRoutes       = require('./routes/orderRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const patientRoutes         = require('./routes/patientRoutes');
const adminRoutes           = require('./routes/adminRoutes');
const authenticate      = require('./middleware/authenticate');
const appointmentController = require('./controllers/appointmentController');

app.use('/api/auth',               authRoutes);
app.use('/api/admin',              adminRoutes);
app.use('/api/ai',                 aiRoutes);
app.use('/api/appointments',       appointmentRoutes);
app.use('/api/hospitals',          hospitalRoutes);
app.use('/api/doctors',            doctorRoutes);
app.use('/api/departments',        departmentRoutes);
app.use('/api/medicine-suggestion',medicineRoutes);
app.use('/api/analytics',          analyticsRoutes);
app.use('/api/audit',              auditRoutes);
app.use('/api/orders',             orderRoutes);
app.use('/api/medical-records',    medicalRecordRoutes);
app.use('/api/patients',           patientRoutes);
const passportRoutes          = require('./routes/passportRoutes');

app.use('/api/passport',           passportRoutes);


// Aliases for assignment-style endpoints (same logic, same auth + validation)
const validate = require('./middleware/validate');
const { book } = require('./validators/appointmentValidator');
app.post('/book-appointment', authenticate, book, validate, appointmentController.bookAppointment);
app.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

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
    logger.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = app;
