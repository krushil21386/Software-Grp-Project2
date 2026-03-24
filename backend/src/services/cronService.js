const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendReminderEmail } = require('./emailService');

// Format parsed date safely
const parseAppointmentDateTime = (dateStr, timeStr) => {
    // dateStr is usually 'YYYY-MM-DD' or 'DD-MM-YYYY' or similar. 
    // Usually the frontend uses <input type="date"> which produces 'YYYY-MM-DD'.
    // timeStr is usually 'HH:MM AM/PM' or 'HH:MM'
    
    try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (hours === '12') hours = '00';
        if (modifier && modifier.toUpperCase() === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
            // fallback (e.g. if DD-MM-YYYY)
            const [d, m, y] = dateStr.split('-');
            dateObj.setFullYear(y, m - 1, d);
        }
        
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
    } catch(err) {
        return null;
    }
};

const initCronJobs = () => {
    console.log('⏳ Initializing Appointment Email Reminder Cron Jobs...');
    
    // Check every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            const upcomingAppointments = await Appointment.find({ status: 'upcoming' });
            const now = new Date();

            for (const appt of upcomingAppointments) {
                const apptDate = parseAppointmentDateTime(appt.date, appt.time);
                if (!apptDate || isNaN(apptDate.getTime())) continue;

                // Time difference in hours
                const diffMs = apptDate.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                // 24-hour reminder exactly? We'll use a window (e.g., between 23.75h and 24.25h)
                // But since cron runs every 15 mins, any diff between 23.5 and 24.5 where reminder24hSent is false is fine.
                if (diffHours > 23 && diffHours <= 24.5 && !appt.reminder24hSent) {
                    await sendReminderEmail(appt.toJSON(), '24h');
                    appt.reminder24hSent = true;
                    await appt.save();
                }

                // 2-hour reminder
                if (diffHours > 1.5 && diffHours <= 2.5 && !appt.reminder2hSent) {
                    await sendReminderEmail(appt.toJSON(), '2h');
                    appt.reminder2hSent = true;
                    await appt.save();
                }
            }
        } catch (error) {
            console.error('⚠️ Cron job error checking appointments:', error);
        }
    });
};

module.exports = { initCronJobs };
