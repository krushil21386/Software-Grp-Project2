const { processBookingRequest } = require('../../src/services/prioritizationService');

const dummySlots = [
    { date: '2026-04-01', time: '14:00', doctorName: 'Dr. Smith' },
    { date: '2026-03-24', time: '09:00', doctorName: 'Dr. Jones' }, // Earliest
    { date: '2026-03-24', time: '10:30', doctorName: 'Dr. Smith' },
    { date: '2026-03-25', time: '11:00', doctorName: 'Dr. Adams' },
    { date: '2026-03-30', time: '15:00', doctorName: 'Dr. Jones' }
];

console.log('--- TEST 1: Low Risk Patient (Routine Checkup) ---');
const routineRequest = {
    patientName: 'John Doe',
    condition: 'Annual physical checkup',
    isUrgent: false,
    preferredDate: '2026-04-01',
    availableSlots: dummySlots
};

const routineResult = processBookingRequest(routineRequest);
console.log(JSON.stringify(routineResult, null, 2));


console.log('\n--- TEST 2: High Risk Patient (Detected by Condition Text) ---');
const highRiskTextRequest = {
    patientName: 'Jane Smith',
    condition: 'I am experiencing severe chest pain and shortness of breath.',
    isUrgent: false, // Flag is false, but text has keywords
    preferredDate: '2026-04-01', // They prefer a later date, but we should override
    availableSlots: dummySlots
};

const highRiskTextResult = processBookingRequest(highRiskTextRequest);
console.log(JSON.stringify(highRiskTextResult, null, 2));


console.log('\n--- TEST 3: High Risk Patient (Explicitly marked Urgent) ---');
const highRiskFlagRequest = {
    patientName: 'Bob Brown',
    condition: 'Fever and chills',
    isUrgent: true, // User manually checked 'Urgent' checkbox
    preferredDate: '2026-03-30',
    availableSlots: dummySlots
};

const highRiskFlagResult = processBookingRequest(highRiskFlagRequest);
console.log(JSON.stringify(highRiskFlagResult, null, 2));
