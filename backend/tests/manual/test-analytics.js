const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Appointment = require('../../src/models/Appointment');
const User = require('../../src/models/User'); // Required by Appointment ref
const analyticsService = require('../../src/services/analyticsService');

async function testAnalytics() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected! Generating test appointments...');
    
    // Create some dummy appointments to test aggregation
    const dummyId = new mongoose.Types.ObjectId();
    
    // Clear old test data if needed? We'll just insert a few temporary docs if it's empty, 
    // but the DB already has data (since we connected earlier). We'll just run the stats.
    
    console.log('Fetching Analytics Data...');
    const stats = await analyticsService.getAnalytics();
    
    console.log('--- ANALYTICS REPORT ---');
    console.log(JSON.stringify(stats, null, 2));

    process.exit(0);
}

testAnalytics().catch(err => {
    console.error(err);
    process.exit(1);
});
