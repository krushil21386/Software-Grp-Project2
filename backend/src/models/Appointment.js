const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    hospitalId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    date: {
        type: DataTypes.STRING, // Using string for simplicity or DATEONLY
        allowNull: false
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('upcoming', 'completed', 'cancelled'),
        defaultValue: 'upcoming'
    },
    notes: DataTypes.TEXT
});

module.exports = Appointment;
