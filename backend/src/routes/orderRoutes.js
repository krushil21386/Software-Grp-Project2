const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/authenticate');

// Public/Auth routes
router.get('/medicines', orderController.getMedicines);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.post('/checkout', authenticate, orderController.createCheckoutSession);
router.post('/verify-payment', authenticate, orderController.verifyPayment);

module.exports = router;
