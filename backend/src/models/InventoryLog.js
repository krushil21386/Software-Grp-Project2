const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    medicineName: {
        type: String,
        required: true
    },
    change: {
        type: Number,
        required: true // Positive for restock, negative for sale
    },
    action: {
        type: String,
        enum: ['SALE', 'RESTOCK', 'ADJUSTMENT', 'EXPIRED'],
        required: true
    },
    orderId: {
        type: String, // String because it might be from Stripe or external or internal ID
        default: 'N/A'
    },
    previousStock: {
        type: Number
    },
    newStock: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
