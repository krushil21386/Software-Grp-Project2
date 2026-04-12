const mongoose = require('mongoose');

const shareTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: true
});

// TTL Index — MongoDB automatically deletes documents after expiresAt
shareTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ShareToken', shareTokenSchema);
