const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Appointment model — stores all booking details tied to a specific user.
 * appointmentId is a UUID generated at creation time.
 */
const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // Link to the logged-in user who made the booking
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },

    // Human-readable unique booking reference (UUID) — uniqueness guaranteed by uuidv4()
    appointmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    // --- Doctor Details ---
    doctorName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clinicName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clinicAddress: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    doctorContact: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // --- Patient Details ---
    patientName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patientEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patientPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patientAddress: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    // --- Appointment Details ---
    date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mode: {
        type: DataTypes.ENUM('Online', 'Offline'),
        allowNull: false,
        defaultValue: 'Offline'
    },
    status: {
        type: DataTypes.ENUM('upcoming', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'upcoming'
    }
}, {
    timestamps: true
});

module.exports = Appointment;
