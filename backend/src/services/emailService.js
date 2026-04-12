const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter using Gmail SMTP with App Password.
 * Requires EMAIL_USER and EMAIL_PASS in .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generates a professional HTML email body for appointment confirmation.
 * @param {Object} appt - Appointment data object
 * @returns {string} HTML string
 */
function buildEmailHtml(appt) {
  // Optional Google Maps deep-link for clinic address
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.clinicAddress)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Appointment Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                ✅ Appointment Confirmed
              </div>
              <div style="margin-top:8px;font-size:14px;color:#bbdefb;">
                Your booking has been successfully registered.
              </div>
            </td>
          </tr>

          <!-- APPOINTMENT ID BADGE -->
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:6px;padding:16px 20px;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#5f6368;letter-spacing:1px;">
                  Appointment ID
                </div>
                <div style="font-size:18px;font-weight:700;color:#1a73e8;margin-top:4px;font-family:monospace;">
                  ${appt.appointmentId}
                </div>
              </div>
            </td>
          </tr>

          <!-- DOCTOR DETAILS -->
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#5f6368;letter-spacing:1px;margin-bottom:14px;">
                👨‍⚕️ Doctor Details
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('Doctor Name', appt.doctorName)}
                ${row('Specialization', appt.specialization)}
                ${row('Clinic Name', appt.clinicName)}
                ${row('Contact Number', appt.doctorContact)}
              </table>
            </td>
          </tr>

          <!-- APPOINTMENT DETAILS -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#5f6368;letter-spacing:1px;margin-bottom:14px;">
                📅 Appointment Details
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('Date', appt.date)}
                ${row('Time', appt.time)}
                ${row('Mode', `<span style="background:${appt.mode === 'Online' ? '#e6f4ea' : '#fce8e6'};color:${appt.mode === 'Online' ? '#137333' : '#c5221f'};padding:2px 10px;border-radius:12px;font-size:13px;">${appt.mode}</span>`)}
              </table>
            </td>
          </tr>

          <!-- PATIENT DETAILS -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#5f6368;letter-spacing:1px;margin-bottom:14px;">
                🧑 Patient Details
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('Patient Name', appt.patientName)}
                ${row('Phone', appt.patientPhone)}
                ${row('Address', appt.patientAddress)}
              </table>
            </td>
          </tr>

          <!-- LOCATION INFO -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#5f6368;letter-spacing:1px;margin-bottom:14px;">
                📍 Location Info
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('Clinic Address', appt.clinicAddress)}
                ${row('Patient Address', appt.patientAddress)}
              </table>
              <a href="${mapsUrl}"
                 style="display:inline-block;margin-top:14px;background:#1a73e8;color:#ffffff;text-decoration:none;
                        padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">
                📍 View on Google Maps
              </a>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:32px 40px 0;">
              <hr style="border:none;border-top:1px solid #e8eaed;margin:0;"/>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;color:#80868b;font-size:12px;line-height:1.6;">
              This is an automated confirmation email. Please do not reply.<br/>
              If you need to reschedule or cancel, contact your clinic directly.<br/><br/>
              <strong style="color:#1a73e8;">HealthCare Platform</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Helper: renders a two-column table row */
function row(label, value) {
  return `
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#5f6368;width:38%;vertical-align:top;">${label}</td>
        <td style="padding:7px 0;font-size:13px;color:#202124;font-weight:500;">${value || '—'}</td>
      </tr>`;
}

/**
 * Sends an appointment confirmation email to the patient.
 * @param {Object} appointmentData - Full appointment object from DB
 * @returns {Promise<void>}
 */
async function sendAppointmentConfirmationEmail(appointmentData) {
    const mailOptions = {
        from: `"HealthCare Platform" <${process.env.EMAIL_USER}>`,
        to: appointmentData.patientEmail,
        subject: `✅ Appointment Confirmed — ${appointmentData.appointmentId}`,
        html: buildEmailHtml(appointmentData)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to ${appointmentData.patientEmail} [${info.messageId}]`);
}

/**
 * Sends an appointment cancellation email.
 */
async function sendCancellationEmail(appt, reason = 'Not provided') {
  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#e53935 0%,#c62828 100%);padding:36px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">❌ Appointment Canceled</div>
          <div style="margin-top:8px;font-size:14px;color:#ffcdd2;">Your appointment has been canceled by the doctor.</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="color:#5f6368;line-height:1.6;">Hello <strong>${appt.patientName}</strong>,</p>
          <p style="color:#5f6368;line-height:1.6;">Unfortunately, your appointment with <strong>${appt.doctorName}</strong> on <strong>${appt.date}</strong> at <strong>${appt.time}</strong> has been canceled.</p>
          <div style="background:#fce8e6;border-left:4px solid #d32f2f;padding:12px 16px;margin:20px 0;">
            <strong style="color:#c62828;font-size:13px;">Reason:</strong>
            <div style="color:#c62828;margin-top:4px;font-size:14px;">${reason}</div>
          </div>
          <p style="color:#5f6368;line-height:1.6;">Please visit our portal to book a new appointment. We apologize for the inconvenience.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;color:#80868b;font-size:12px;">This is an automated email. Please do not reply.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"HealthCare Platform" <${process.env.EMAIL_USER}>`,
    to: appt.patientEmail,
    subject: `❌ Appointment Canceled — ${appt.appointmentId}`,
    html
  });
}

/**
 * Sends an appointment reschedule email.
 */
async function sendRescheduleEmail(appt, newDate, newTime, reason = 'Not provided') {
  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#fada5e 0%,#f9a825 100%);padding:36px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">🔄 Appointment Rescheduled</div>
          <div style="margin-top:8px;font-size:14px;color:#fff9c4;">The time or date has been updated.</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="color:#5f6368;line-height:1.6;">Hello <strong>${appt.patientName}</strong>,</p>
          <p style="color:#5f6368;line-height:1.6;">Your appointment with <strong>${appt.doctorName}</strong> has been rescheduled.</p>
          
          <table width="100%" style="margin-top:20px;border-collapse:collapse;">
            <tr>
              <td style="padding:10px;background:#f1f3f4;text-align:center;border-radius:6px 0 0 6px;">
                <div style="color:#5f6368;font-size:12px;text-transform:uppercase;font-weight:700;">Old Time</div>
                <div style="text-decoration:line-through;color:#9aa0a6;margin-top:4px;">${appt.date} at ${appt.time}</div>
              </td>
              <td style="padding:10px;background:#e8f0fe;text-align:center;border-radius:0 6px 6px 0;">
                <div style="color:#1a73e8;font-size:12px;text-transform:uppercase;font-weight:700;">New Time</div>
                <div style="color:#1a73e8;font-weight:700;margin-top:4px;">${newDate} at ${newTime}</div>
              </td>
            </tr>
          </table>

          <div style="background:#fff8e1;border-left:4px solid #f9a825;padding:12px 16px;margin:20px 0;">
            <strong style="color:#f57f17;font-size:13px;">Reason:</strong>
            <div style="color:#f57f17;margin-top:4px;font-size:14px;">${reason}</div>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;color:#80868b;font-size:12px;">This is an automated email. Please do not reply.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"HealthCare Platform" <${process.env.EMAIL_USER}>`,
    to: appt.patientEmail,
    subject: `🔄 Appointment Rescheduled — ${appt.appointmentId}`,
    html
  });
}

/**
 * Sends a reminder email (24h or 2h).
 */
async function sendReminderEmail(appt, type) {
  const is24h = type === '24h';
  const hoursText = is24h ? '24 hours' : '2 hours';
  const bgColor = is24h ? '#1a73e8' : '#e65100'; // blue for 24h, intense orange for 2h
  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:${bgColor};padding:36px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⏰ Appointment Reminder</div>
          <div style="margin-top:8px;font-size:14px;color:#e8eaed;">Your appointment is approaching in less than ${hoursText}!</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="color:#5f6368;line-height:1.6;">Hello <strong>${appt.patientName}</strong>,</p>
          <p style="color:#5f6368;line-height:1.6;">This is a friendly reminder that you have an upcoming appointment with <strong>${appt.doctorName}</strong>.</p>
          <div style="background:#f1f3f4;padding:16px;border-radius:8px;margin:20px 0;">
            <div style="color:#202124;font-size:16px;font-weight:700;text-align:center;">
              📅 ${appt.date} at ${appt.time}
            </div>
          </div>
          <p style="color:#5f6368;line-height:1.6;">Please make sure to arrive 10 minutes early at:<br/><strong>${appt.clinicAddress}</strong></p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;color:#80868b;font-size:12px;">This is an automated reminder. Please do not reply.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"HealthCare Security" <${process.env.EMAIL_USER}>`,
    to: appt.patientEmail,
    subject: `⏰ Reminder: Appointment in ${hoursText} (${appt.appointmentId})`,
    html
  });
}

/**
 * Sends a security alert email for login from a new location.
 */
async function sendSecurityAlertEmail(user, location, ipAddress) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#fef2f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
        <tr><td style="background:#dc2626;padding:36px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#ffffff;">⚠️ Security Alert: New Login</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We detected a successful login to your account from a new location:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:20px 0;">
             <strong>Location:</strong> ${location}<br/>
             <strong>IP Address:</strong> ${ipAddress}<br/>
             <strong>Time:</strong> ${new Date().toLocaleString()}
          </div>
          <p style="color:#ef4444;font-weight:600;">If this wasn't you, please change your password immediately and contact support.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;color:#64748b;font-size:12px;">HealthCare Security Team</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"HealthCare Security" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `⚠️ Security Alert: New login from ${location}`,
    html
  });
}

/**
 * Sends an OTP for MFA verification.
 */
async function sendLoginOtpEmail(email, otp, location) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.05);">
        <tr><td style="background:#2563eb;padding:36px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#ffffff;">🔐 Verify Your Identity</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p>Someone is trying to log in to your account from <strong>${location}</strong>.</p>
          <p>To verify your identity, please enter the following code:</p>
          <div style="text-align:center;margin:30px 0;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1e40af;background:#eff6ff;padding:10px 20px;border-radius:8px;border:1px dashed #3b82f6;">${otp}</span>
          </div>
          <p style="font-size:13px;color:#64748b;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;color:#64748b;font-size:12px;">HealthCare Security Team</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"HealthCare Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 ${otp} is your verification code`,
    html
  });
}

/**
 * Sends a prescription update notification email to the patient.
 * @param {Object} patient - { name, email }
 * @param {string} doctorName - Name of the doctor
 * @param {string} action - 'uploaded' or 'updated'
 */
async function sendPrescriptionUpdateEmail(patient, doctorName, action = 'updated') {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Prescription ${action === 'uploaded' ? 'Uploaded' : 'Updated'}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#DC143C 0%,#b91c3c 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                💊 Prescription ${action === 'uploaded' ? 'Uploaded' : 'Updated'}
              </div>
              <div style="margin-top:8px;font-size:14px;color:#fecdd3;">
                Dr. ${doctorName} has ${action} your prescription.
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:15px;color:#202124;line-height:1.7;margin:0 0 16px;">
                Dear <strong>${patient.name}</strong>,
              </p>
              <p style="font-size:15px;color:#202124;line-height:1.7;margin:0 0 16px;">
                Your prescription has been <strong>${action}</strong> by <strong>Dr. ${doctorName}</strong>.
                Please log in to your MediCare Plus account to view and download the latest prescription.
              </p>
              <div style="background:#fef2f2;border-left:4px solid #DC143C;border-radius:6px;padding:16px 20px;margin:20px 0;">
                <div style="font-size:13px;color:#991b1b;font-weight:600;">
                  ⚠️ Important: Always follow your doctor's instructions. If you have any questions about your prescription, contact your healthcare provider directly.
                </div>
              </div>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/Software-Grp-Project/medical-records"
                 style="display:inline-block;margin-top:16px;background:#DC143C;color:#ffffff;text-decoration:none;
                        padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View My Records →
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;color:#80868b;font-size:12px;line-height:1.6;border-top:1px solid #e8eaed;">
              This is an automated notification. Please do not reply.<br/>
              <strong style="color:#DC143C;">MediCare Plus</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"MediCare Plus" <${process.env.EMAIL_USER}>`,
    to: patient.email,
    subject: `💊 Your prescription has been ${action} — Dr. ${doctorName}`,
    html
  });
}

module.exports = {
  sendAppointmentConfirmationEmail,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendReminderEmail,
  sendSecurityAlertEmail,
  sendLoginOtpEmail,
  sendPrescriptionUpdateEmail
};
