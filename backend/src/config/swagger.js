const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MediCare Plus API',
            version: '1.0.0',
            description: 'Complete REST API for the MediCare Plus Healthcare Platform — AI-powered diagnostics, appointment management, medical records, and more.',
            contact: {
                name: 'MediCare Plus Team'
            }
        },
        servers: [
            { url: 'http://localhost:5001', description: 'Development Server' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication & user management' },
            { name: 'AI Analysis', description: 'AI-powered medical report analysis (Gemini)' },
            { name: 'Appointments', description: 'Appointment booking, scheduling & management' },
            { name: 'Medical Records', description: 'Patient medical records & prescriptions' },
            { name: 'Health Passport', description: 'Smart Health Passport generation & verification' },
            { name: 'Hospitals', description: 'Hospital discovery & listing' },
            { name: 'Doctors', description: 'Doctor profiles & availability' },
            { name: 'Medicine', description: 'AI medicine suggestions' },
            { name: 'Analytics', description: 'Doctor performance analytics' },
            { name: 'Orders', description: 'Medicine orders & pharmacy' },
            { name: 'Audit', description: 'Audit logs & activity tracking' }
        ],
        paths: {
            // ─── AUTH ───
            '/api/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a new user',
                    security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            required: ['name', 'email', 'password', 'role'],
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                email: { type: 'string', example: 'john@example.com' },
                                password: { type: 'string', example: 'securePass123' },
                                role: { type: 'string', enum: ['patient', 'doctor', 'admin'], example: 'patient' },
                                phone: { type: 'string', example: '9876543210' }
                            }
                        }}}
                    },
                    responses: {
                        201: { description: 'User registered, OTP sent to email' },
                        400: { description: 'Validation error or user exists' }
                    }
                }
            },
            '/api/auth/verify-otp': {
                post: {
                    tags: ['Auth'],
                    summary: 'Verify OTP for email confirmation',
                    security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                otp: { type: 'string' }
                            }
                        }}}
                    },
                    responses: { 200: { description: 'OTP verified, tokens returned' } }
                }
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login with email and password',
                    security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                password: { type: 'string' }
                            }
                        }}}
                    },
                    responses: { 200: { description: 'Login successful, tokens returned' } }
                }
            },
            '/api/auth/refresh-token': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            properties: { refreshToken: { type: 'string' } }
                        }}}
                    },
                    responses: { 200: { description: 'New access token' } }
                }
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user profile',
                    responses: { 200: { description: 'User profile data' } }
                }
            },

            // ─── AI ANALYSIS ───
            '/api/ai/analyze': {
                post: {
                    tags: ['AI Analysis'],
                    summary: 'Analyze a medical report using Gemini AI',
                    description: 'Upload a medical report (PDF/image) for AI-powered analysis. Returns disease detection, key findings, confidence score, and recommendations.',
                    requestBody: {
                        required: true,
                        content: { 'multipart/form-data': { schema: {
                            type: 'object',
                            properties: {
                                report: { type: 'string', format: 'binary', description: 'Medical report file (PDF, JPG, PNG)' }
                            }
                        }}}
                    },
                    responses: {
                        200: { description: 'AI analysis results with disease, findings, and recommendations' },
                        500: { description: 'AI engine error' }
                    }
                }
            },

            // ─── APPOINTMENTS ───
            '/api/appointments/book': {
                post: {
                    tags: ['Appointments'],
                    summary: 'Book a new appointment',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            required: ['doctorName', 'specialization', 'clinicName', 'clinicAddress', 'doctorContact', 'date', 'time', 'mode'],
                            properties: {
                                doctorId: { type: 'string' },
                                doctorName: { type: 'string' },
                                specialization: { type: 'string' },
                                clinicName: { type: 'string' },
                                clinicAddress: { type: 'string' },
                                doctorContact: { type: 'string' },
                                date: { type: 'string', example: '2026-04-01' },
                                time: { type: 'string', example: '10:00 AM' },
                                mode: { type: 'string', enum: ['Online', 'Offline'] }
                            }
                        }}}
                    },
                    responses: { 201: { description: 'Appointment booked, email sent' } }
                }
            },
            '/api/appointments/my-appointments': {
                get: {
                    tags: ['Appointments'],
                    summary: 'Get all appointments for the logged-in user (patient or doctor)',
                    responses: { 200: { description: 'Upcoming, completed, and cancelled appointments' } }
                }
            },
            '/api/appointments/{id}/complete': {
                put: {
                    tags: ['Appointments'],
                    summary: 'Mark appointment as completed',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Status updated to completed' } }
                }
            },
            '/api/appointments/{id}/reject': {
                put: {
                    tags: ['Appointments'],
                    summary: 'Cancel/reject an appointment',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            required: ['reason'],
                            properties: { reason: { type: 'string', example: 'Doctor unavailable' } }
                        }}}
                    },
                    responses: { 200: { description: 'Appointment cancelled, email sent' } }
                }
            },
            '/api/appointments/{id}/reschedule': {
                put: {
                    tags: ['Appointments'],
                    summary: 'Reschedule an appointment',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                            type: 'object',
                            required: ['date', 'time', 'reason'],
                            properties: {
                                date: { type: 'string' },
                                time: { type: 'string' },
                                reason: { type: 'string' }
                            }
                        }}}
                    },
                    responses: { 200: { description: 'Appointment rescheduled, email sent' } }
                }
            },

            // ─── MEDICAL RECORDS ───
            '/api/medical-records/my-records': {
                get: {
                    tags: ['Medical Records'],
                    summary: 'Get all medical records for the logged-in patient',
                    responses: { 200: { description: 'Array of medical records with prescriptions' } }
                }
            },
            '/api/medical-records/doctor-records': {
                get: {
                    tags: ['Medical Records'],
                    summary: 'Get all patient records for the logged-in doctor',
                    description: 'Returns records for all patients the doctor has consulted (via appointments)',
                    responses: { 200: { description: 'Array of patient records with prescriptions' } }
                }
            },
            '/api/medical-records/{id}/prescription': {
                patch: {
                    tags: ['Medical Records'],
                    summary: 'Upload a prescription file (Doctor only)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: { 'multipart/form-data': { schema: {
                            type: 'object',
                            properties: { prescription: { type: 'string', format: 'binary' } }
                        }}}
                    },
                    responses: { 200: { description: 'Prescription uploaded, patient notified' } }
                }
            },
            '/api/medical-records/{id}/prescription-details': {
                patch: {
                    tags: ['Medical Records'],
                    summary: 'Update prescription text details (Doctor only)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: { 'application/json': { schema: {
                            type: 'object',
                            properties: {
                                medicines: { type: 'array', items: {
                                    type: 'object',
                                    properties: {
                                        medicineName: { type: 'string' },
                                        dosage: { type: 'string' },
                                        frequency: { type: 'string' }
                                    }
                                }},
                                doctorComments: { type: 'string' }
                            }
                        }}}
                    },
                    responses: { 200: { description: 'Prescription updated, patient notified via email' } }
                }
            },

            // ─── HEALTH PASSPORT ───
            '/api/passport/data': {
                get: {
                    tags: ['Health Passport'],
                    summary: 'Get health passport data for the logged-in patient',
                    responses: { 200: { description: 'Aggregated health data for passport generation' } }
                }
            },
            '/api/passport/generate': {
                post: {
                    tags: ['Health Passport'],
                    summary: 'Generate a shareable health passport link',
                    responses: { 200: { description: 'Shareable link with 24h expiry' } }
                }
            },

            // ─── ANALYTICS ───
            '/api/analytics/doctor': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get doctor performance analytics',
                    responses: { 200: { description: 'Completion rate, daily stats, efficiency trends' } }
                }
            },
            '/api/appointments/heatmap': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get appointment density heatmap with best-time suggestions',
                    responses: { 200: { description: '7x24 density matrix with AI-suggested best times' } }
                }
            },

            // ─── HOSPITALS ───
            '/api/hospitals': {
                get: {
                    tags: ['Hospitals'],
                    summary: 'List all hospitals',
                    security: [],
                    responses: { 200: { description: 'Array of hospitals' } }
                }
            },

            // ─── DOCTORS ───
            '/api/doctors': {
                get: {
                    tags: ['Doctors'],
                    summary: 'List all doctors',
                    security: [],
                    responses: { 200: { description: 'Array of doctor profiles' } }
                }
            },

            // ─── MEDICINE SUGGESTION ───
            '/api/medicine-suggestion/suggest': {
                post: {
                    tags: ['Medicine'],
                    summary: 'Get AI-powered medicine suggestions',
                    requestBody: {
                        content: { 'application/json': { schema: {
                            type: 'object',
                            properties: {
                                symptoms: { type: 'string', example: 'headache, fever' }
                            }
                        }}}
                    },
                    responses: { 200: { description: 'Medicine recommendations' } }
                }
            }
        }
    },
    apis: [] // We define paths inline above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
