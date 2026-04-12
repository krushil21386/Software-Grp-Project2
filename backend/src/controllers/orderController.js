const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const socketIO = require('../socket');

const orderController = {

    // GET /api/orders/medicines
    async getMedicines(req, res) {
        try {
            const medicines = await Medicine.find();
            res.json({ success: true, medicines });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
        }
    },

    // POST /api/orders/checkout
    async createCheckoutSession(req, res) {
        try {
            const { cartItems, shippingAddress, paymentMethod, upiId } = req.body;
            const userId = req.user.id;

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }

            // 1. Validate Prescription for RX medicines
            const rxItems = cartItems.filter(item => item.requiresPrescription);
            if (rxItems.length > 0) {
                const userPrescriptions = await Prescription.find({ 
                    patientId: userId, 
                    status: 'active',
                    expiryDate: { $gt: new Date() } 
                });

                for (const item of rxItems) {
                    const hasPrescription = userPrescriptions.some(p => 
                        p.medicines.some(m => m.medicineName.toLowerCase() === item.name.toLowerCase())
                    );
                    if (!hasPrescription) {
                        return res.status(403).json({ 
                            success: false, 
                            message: `Prescription required for ${item.name}. Please consult a doctor first.` 
                        });
                    }
                }
            }

            // --- MULTI-OPTION PAYMENT GATEWAY ---
            if (paymentMethod === 'cod' || paymentMethod === 'upi') {
                // Bypass Logic for COD and Simulated UPI
                const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const orderItems = cartItems.map(item => ({
                    medicineId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }));

                const newOrder = await Order.create({
                    userId,
                    items: orderItems,
                    totalAmount,
                    shippingAddress,
                    stripeSessionId: paymentMethod === 'upi' ? `UPI-${upiId}` : `COD-${Date.now()}`,
                    paymentStatus: paymentMethod === 'upi' ? 'paid' : 'pending',
                    orderStatus: 'processing' // Starts processing immediately
                });

                // Instantly trigger Inventory Microservice for physical stock deduction
                try {
                    const invRes = await fetch(process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001/api/inventory/deduct', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            items: newOrder.items,
                            orderId: newOrder.stripeSessionId
                        })
                    });
                    const invData = await invRes.json();
                    
                    if (invData.lowStockItems && invData.lowStockItems.length > 0) {
                        socketIO.getIO().to('role:admin').emit('LOW_STOCK_ALERT', {
                            items: invData.lowStockItems
                        });
                        console.log(`📡 Broadcasted low-stock alert for ${invData.lowStockItems.length} items.`);
                    }
                    console.log(`📦 ${paymentMethod.toUpperCase()} Order: Triggered Inventory Service.`);
                } catch (inventoryErr) {
                    console.error('⚠️ Inventory Service is offline:', inventoryErr.message);
                }

                return res.json({ 
                    success: true, 
                    isBypass: true, 
                    message: `${paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'} Order placed successfully!` 
                });
            }

            // 2. Prepare Stripe line items (For Credit Card)
            const lineItems = cartItems.map(item => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100, // Stripe expects amount in paise (cents equivalent)
                },
                quantity: item.quantity,
            }));

            // 3. Create Stripe Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${req.headers.origin}/Software-Grp-Project?orderStatus=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/Software-Grp-Project?orderStatus=cancel`,
                customer_email: req.user.email,
                metadata: {
                    userId: userId.toString(),
                    shippingAddress
                }
            });

            // 4. Create pending order in DB
            const orderItems = cartItems.map(item => ({
                medicineId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }));

            const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            await Order.create({
                userId,
                items: orderItems,
                totalAmount,
                shippingAddress,
                stripeSessionId: session.id,
                paymentStatus: 'pending'
            });

            res.json({ success: true, url: session.url });

        } catch (error) {
            console.error('Stripe Session Error:', error);
            res.status(500).json({ success: false, message: 'Failed to initiate payment', error: error.message });
        }
    },

    // GET /api/orders/my-orders
    async getMyOrders(req, res) {
        try {
            const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
            res.json({ success: true, orders });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
    },

    // POST /api/orders/webhook (Actually a callback for simple implementation)
    async verifyPayment(req, res) {
        try {
            const { sessionId } = req.body;
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                const updatedOrder = await Order.findOneAndUpdate(
                    { stripeSessionId: sessionId },
                    { paymentStatus: 'paid', orderStatus: 'processing' },
                    { new: true }
                );

                // --- MICROSERVICE DECOUPLING ---
                // Try to alert the completely separate Inventory Service to handle physical stock.
                // Notice how fault tolerance works: even if the Inventory server is dead, 
                // the user's payment still succeeds and crashes don't bring down the main API.
                try {
                    const invRes = await fetch(process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001/api/inventory/deduct', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            items: updatedOrder.items,
                            orderId: updatedOrder.stripeSessionId
                        })
                    });
                    const invData = await invRes.json();

                    if (invData.lowStockItems && invData.lowStockItems.length > 0) {
                        socketIO.getIO().to('role:admin').emit('LOW_STOCK_ALERT', {
                            items: invData.lowStockItems
                        });
                    }
                    console.log('📦 Successfully triggered Inventory Service to deduct stock.');
                } catch (inventoryErr) {
                    console.error('⚠️ Inventory Service is offline, but payment processed successfully:', inventoryErr.message);
                }
                // -------------------------------

                return res.json({ success: true, message: 'Order paid successfully' });
            }
            
            res.status(400).json({ success: false, message: 'Payment not completed' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Payment verification failed' });
        }
    }
};

module.exports = orderController;
