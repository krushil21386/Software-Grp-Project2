const axios = require('axios');

async function testAvailability() {
  try {
    console.log('--- Testing Doctor Availability API ---');
    
    // 1. Login as doctor (assuming credentials exist)
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'drmonikapanchal@example.com',
      password: 'Password@123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Logged in as doctor');

    // 2. Get current availability
    const getRes = await axios.get('http://localhost:5001/api/doctors/availability', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Fetched current availability:', getRes.data.success);

    // 3. Update availability
    const newSchedule = {
      ...getRes.data.availability,
      monday: { start: '10:00 AM', end: '4:00 PM', available: true }
    };
    
    const updateRes = await axios.put('http://localhost:5001/api/doctors/availability', 
      { schedule: newSchedule },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Update response:', updateRes.data.message);

    // 4. Verify update
    const verifyRes = await axios.get('http://localhost:5001/api/doctors/availability', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (verifyRes.data.availability.monday.start === '10:00 AM') {
      console.log('🚀 SUCCESS: Availability persisted correctly!');
    } else {
      console.log('❌ FAILURE: Persistent check failed.');
    }

  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testAvailability();
