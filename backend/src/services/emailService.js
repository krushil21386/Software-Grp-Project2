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
                ${row('Doctor Name',      appt.doctorName)}
                ${row('Specialization',   appt.specialization)}
                ${row('Clinic Name',      appt.clinicName)}
                ${row('Contact Number',   appt.doctorContact)}
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
                ${row('Date',  appt.date)}
                ${row('Time',  appt.time)}
                ${row('Mode',  `<span style="background:${appt.mode === 'Online' ? '#e6f4ea' : '#fce8e6'};color:${appt.mode === 'Online' ? '#137333' : '#c5221f'};padding:2px 10px;border-radius:12px;font-size:13px;">${appt.mode}</span>`)}
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
                ${row('Patient Name',  appt.patientName)}
                ${row('Phone',         appt.patientPhone)}
                ${row('Address',       appt.patientAddress)}
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
                ${row('Clinic Address',  appt.clinicAddress)}
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

module.exports = { sendAppointmentConfirmationEmail };
