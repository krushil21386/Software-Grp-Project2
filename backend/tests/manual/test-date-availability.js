const axios = require('axios');

async function testDateAvailability() {
  try {
    console.log('--- Testing Date-Specific Availability ---');
    
    // 1. Login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'drmonikapanchal@example.com',
      password: 'Password@123'
    });
    const token = loginRes.data.accessToken;
    const cookie = loginRes.headers['set-cookie'];
    console.log('✅ Logged in as doctor');

    // 2. Set specific date availability (April 15, 2026 - Unavailable)
    const testDate = '2026-04-15';
    console.log(`🚀 Updating availability for ${testDate} to Unavailable...`);
    const updateRes = await axios.patch('http://localhost:5001/api/doctors/availability/date', {
      date: testDate,
      available: false
    }, {
      headers: { Cookie: cookie.join('; ') }
    });
    console.log('✅ Update response status:', updateRes.status);

    // 3. Fetch availability and verify
    console.log('🔍 Fetching availability to verify...');
    const verifyRes = await axios.get('http://localhost:5001/api/doctors/availability', {
      headers: { Cookie: cookie.join('; ') }
    });
    
    const specific = verifyRes.data.specificDates.find(d => d.date === testDate);
    if (specific && specific.available === false) {
      console.log('✨ SUCCESS: Date-specific override is correctly stored and retrieved!');
    } else {
      console.error('❌ FAILURE: Could not find correct override for date.');
      console.log('Data received:', verifyRes.data.specificDates);
    }

  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testDateAvailability();
