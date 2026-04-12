const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDoctorUpload() {
  try {
    console.log('--- Debugging Doctor Report Upload ---');
    
    // 1. Login as doctor
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'drmonikapanchal@example.com',
      password: 'Password@123'
    });
    const token = loginRes.data.accessToken;
    const cookie = loginRes.headers['set-cookie'];
    console.log('✅ Logged in as doctor');

    // 2. Get a patient ID (from their appointments)
    const apptRes = await axios.get('http://localhost:5001/api/appointments/my-appointments', {
      headers: { Cookie: cookie.join('; ') }
    });
    const patientId = apptRes.data.completed[0]?.userId;
    if (!patientId) throw new Error('No completed patient found for test.');
    console.log(`✅ Targeted Patient ID: ${patientId}`);

    // 3. Prepare upload
    const form = new FormData();
    const dummyFilePath = path.join(__dirname, 'dummy_report.pdf');
    fs.writeFileSync(dummyFilePath, 'This is a dummy medical report.');
    
    form.append('report', fs.createReadStream(dummyFilePath));
    form.append('patientId', String(patientId));

    console.log('🚀 Sending POST /api/medical-records/upload-report...');
    const uploadRes = await axios.post('http://localhost:5001/api/medical-records/upload-report', form, {
      headers: { 
        ...form.getHeaders(),
        Cookie: cookie.join('; ')
      }
    });

    console.log('✅ Upload response:', uploadRes.data);
    fs.unlinkSync(dummyFilePath);

  } catch (err) {
    console.error('❌ Upload failed:', err.response?.data || err.message);
    if (err.response?.status === 500) {
        console.log('💡 TIP: Check the server logs (STDOUT) for the full stack trace.');
    }
  }
}

testDoctorUpload();
