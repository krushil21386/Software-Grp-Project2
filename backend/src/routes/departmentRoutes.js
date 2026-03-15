const express = require('express');
const router  = express.Router();
const { departments } = require('../data/mockData');

// GET /api/departments
router.get('/', (req, res) => {
    res.json({ success: true, departments });
});

module.exports = router;
