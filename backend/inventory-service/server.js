require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// We re-import the Medicine model to interact with the database directly.
// In a true distributed system, this service would have its own database, 
// but pointing to the same MongoDB URI is extremely common to start.
const Medicine = require('../src/models/Medicine'); 
const InventoryLog = require('../src/models/InventoryLog');

const app = express();
app.use(express.json());

const PORT = process.env.INVENTORY_PORT || 4001;

// Connect to the main database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Inventory Service connected to MongoDB'))
  .catch(err => console.error('Inventory Service DB Error:', err));

// The isolated Microservice Route
app.post('/api/inventory/deduct', async (req, res) => {
    try {
        const { items, orderId } = req.body; // Expects [{ medicineId, quantity }]
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const auditLogs = [];

        const deductPromises = items.map(async (item) => {
            // 1. Fetch current medicine to get its name and old stock for auditing
            const med = await Medicine.findById(item.medicineId);
            if (!med) return null;

            const oldStock = med.stock;

            // 2. Atomic update to subtract stock using MongoDB $inc
            const updatedMed = await Medicine.findOneAndUpdate(
                { _id: item.medicineId, stock: { $gte: item.quantity } }, 
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (updatedMed) {
                // 3. Prepare log entry
                auditLogs.push({
                    medicineId: updatedMed._id,
                    medicineName: updatedMed.name,
                    change: -item.quantity,
                    action: 'SALE',
                    orderId: orderId || 'N/A',
                    previousStock: oldStock,
                    newStock: updatedMed.stock
                });
            }

            return updatedMed;
        });

        const results = await Promise.all(deductPromises);

        // Check if any medicine failed to deduct (e.g., due to low stock)
        const failedItems = results.filter(r => r === null);
        
        // 4. Create Audit Logs in bulk for successful deductions
        if (auditLogs.length > 0) {
            await InventoryLog.insertMany(auditLogs);
            console.log(`[INVENTORY MICROSERVICE] Created ${auditLogs.length} audit trail entries.`);
        }

        if (failedItems.length > 0) {
            console.error('[INVENTORY MICROSERVICE] Warning: Some items failed to deduct (Out of stock or invalid ID)');
            return res.status(400).json({ 
                error: 'Some items had insufficient stock', 
                deductedCount: auditLogs.length, 
                failedCount: failedItems.length 
            });
        }

        const lowStockItems = results
            .filter(r => r !== null && r.stock < 10) // Threshold of 10 for demo/safety
            .map(r => ({ id: r._id, name: r.name, stock: r.stock }));

        console.log(`[INVENTORY MICROSERVICE] Successfully deducted stock for ${items.length} unique medicines.`);
        return res.json({ 
            success: true, 
            message: 'Inventory deducted and tracked globally',
            lowStockItems 
        });

    } catch (error) {
        console.error('[INVENTORY MICROSERVICE] Error:', error);
        return res.status(500).json({ error: 'Inventory deduction failed' });
    }
});

// Start the isolated microservice
app.listen(PORT, () => {
    console.log(`✅ Inventory Microservice running on port ${PORT}`);
});
