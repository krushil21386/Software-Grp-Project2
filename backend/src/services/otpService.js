const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const OtpToken   = require('../models/OtpToken');
const { Op }     = require('sequelize');
require('dotenv').config();

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt — safer than Math.random()
 */
function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Detect whether real Gmail credentials are configured.
 */
function hasRealCredentials() {
    const email = process.env.EMAIL || '';
    const pass  = process.env.EMAIL_PASS || '';
    return (
        email.includes('@') &&
        !email.includes('your-') &&
        pass.length > 0 &&
        !pass.includes('your-')
    );
}

/**
 * Create a nodemailer transporter.
 *
 * Strategy:
 *  - If real Gmail credentials are in .env → use Gmail SMTP
 *  - Otherwise → create an Ethereal Email test account on-the-fly
 *    (sends to a captured inbox you can preview in browser)
 */
async function createTransporter() {
    if (hasRealCredentials()) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS   // Must be a Gmail App Password
            }
        });
    }

    // ── Ethereal Email fallback (perfect for development) ──────────────────
    // Creates a fresh throwaway SMTP account automatically — no sign-up needed
    const testAccount = await nodemailer.createTestAccount();
    console.log('\n📬 Ethereal Email test account created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   Preview emails at: https://ethereal.email\n');

    return nodemailer.createTransport({
        host:   'smtp.ethereal.email',
        port:   587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
}

/**
 * Build the HTML email body.
 */
function buildEmailHtml(otp, type, expiryMinutes) {
    const isReset    = type === 'password-reset';
    const actionText = isReset ? 'reset your password' : 'verify your email';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
            style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🏥 HealthCare Platform</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Secure Healthcare Management</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 28px;">
                <h2 style="color:#0f172a;font-size:19px;margin:0 0 10px;">
                  ${isReset ? 'Password Reset Request' : 'Verify Your Email'}
                </h2>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Use the one-time code below to ${actionText}.
                  This code is valid for <strong>${expiryMinutes} minutes</strong> only.
                </p>

                <!-- OTP Box -->
                <div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:12px;
                            padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:2px;
                             margin:0 0 8px;text-transform:uppercase;">Your Verification Code</p>
                  <span style="font-size:38px;font-weight:800;letter-spacing:12px;
                               color:#0284c7;font-family:'Courier New',monospace;">
                    ${otp}
                  </span>
                  <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">
                    Expires in ${expiryMinutes} minutes
                  </p>
                </div>

                <!-- Warning -->
                <div style="background:#fff7ed;border-left:4px solid #f97316;
                            padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
                  <p style="color:#9a3412;font-size:13px;margin:0;line-height:1.5;">
                    <strong>Security:</strong> Never share this code. Our team will never ask for it.
                  </p>
                </div>

                <p style="color:#94a3b8;font-size:12px;margin:0;">
                  This is an automated message — please do not reply.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:18px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">
                  © ${new Date().getFullYear()} HealthCare Platform · All rights reserved
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

// ─────────────────────────────────────────────────────────────────────────────

const otpService = {

    /**
     * Generate, store, and email an OTP.
     *
     * Returns the plain-text OTP so the caller can pass it to the frontend
     * (devOtp) when running in development mode.
     */
    async generateAndSend(email, type = 'registration') {
        const otp          = generateOtp();
        const expiryMins   = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
        const expiresAt    = new Date(Date.now() + expiryMins * 60 * 1000);

        // Invalidate any existing unused OTPs for this email + type
        await OtpToken.update(
            { used: true },
            { where: { email, type, used: false } }
        );

        // Persist the new OTP
        await OtpToken.create({ email, otp, type, expiresAt });

        // ── Send email ──────────────────────────────────────────────────────
        try {
            const transporter = await createTransporter();
            const subject     = type === 'password-reset'
                ? 'HealthCare — Password Reset OTP'
                : 'HealthCare — Email Verification OTP';

            const info = await transporter.sendMail({
                from:    `"HealthCare Platform" <${process.env.EMAIL || 'noreply@healthcare.dev'}>`,
                to:      email,
                subject,
                html:    buildEmailHtml(otp, type, expiryMins)
            });

            console.log(`✅ OTP email sent to ${email}`);

            // For Ethereal test emails — print the preview URL to terminal
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`\n🔗 Preview your email here (open in browser):`);
                console.log(`   ${previewUrl}\n`);
            }

        } catch (err) {
            // Email failure is non-fatal — OTP is still stored in DB
            console.warn(`⚠️  Email send failed: ${err.message}`);
            console.warn(`   OTP for ${email}: ${otp}  (check terminal — email not configured)`);
        }

        return otp;
    },

    /**
     * Verify an OTP submitted by the user.
     * Returns true on success; marks the record used (no replay).
     */
    async verify(email, otp, type = 'registration') {
        const record = await OtpToken.findOne({
            where: {
                email,
                otp,
                type,
                used:      false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!record) return false;

        record.used = true;
        await record.save();
        return true;
    }
};

module.exports = otpService;
