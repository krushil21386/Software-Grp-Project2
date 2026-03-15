const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OtpToken = sequelize.define('OtpToken', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // 'registration' | 'password-reset' | 'login'
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'registration'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = OtpToken;
