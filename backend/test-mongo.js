require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
    try {
        console.log('Connecting to', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected!');
        process.exit(0);
    } catch(err) {
        console.error('ERROR RENDER:', err);
        process.exit(1);
    }
}
test();
