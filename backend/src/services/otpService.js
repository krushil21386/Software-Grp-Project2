const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const OtpToken   = require('../models/OtpToken');

/**
 * Generates a 6-digit OTP.
 */
function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP using SHA-256 for secure storage.
 * Plain OTP is only sent via email — never stored.
 */
function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

function hasRealCredentials() {
    const email = process.env.EMAIL_USER || '';
    const pass  = process.env.EMAIL_PASS || '';
    return (
        email.includes('@') &&
        !email.includes('your-') &&
        pass.length > 0 &&
        !pass.includes('your-')
    );
}

async function createTransporter() {
    if (hasRealCredentials()) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

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
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🏥 HealthCare Platform</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 28px;">
                <h2 style="color:#0f172a;font-size:19px;margin:0 0 10px;">
                  ${isReset ? 'Password Reset Request' : 'Verify Your Email'}
                </h2>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Use the one-time code below to ${actionText}.
                  This code is valid for <strong>${expiryMinutes} minutes</strong> only.
                </p>
                <div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:12px;
                            padding:24px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:38px;font-weight:800;letter-spacing:12px;
                               color:#0284c7;font-family:'Courier New',monospace;">
                    ${otp}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

const otpService = {
    async generateAndSend(email, type = 'registration') {
        const otp = await this.generate(email, type);
        const expiryMins = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;

        try {
            const transporter = await createTransporter();
            const subject     = type === 'password-reset'
                ? 'HealthCare — Password Reset OTP'
                : 'HealthCare — Email Verification OTP';

            const info = await transporter.sendMail({
                from:    `"HealthCare Platform" <${process.env.EMAIL_USER || 'noreply@healthcare.dev'}>`,
                to:      email,
                subject,
                html:    buildEmailHtml(otp, type, expiryMins)
            });

            console.log(`✅ OTP email sent to ${email}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log(`\n🔗 Preview your email here: ${previewUrl}\n`);
        } catch (err) {
            console.warn(`⚠️  Email send failed: ${err.message}`);
            console.warn(`   OTP for ${email}: ${otp}  (check terminal — email not configured)`);
        }

        return otp;
    },

    /**
     * Generates an OTP and stores its SHA-256 hash in MongoDB.
     * The plain OTP is returned for email delivery only — never persisted.
     */
    async generate(email, type) {
        const otp          = generateOtp();
        const hashedOtp    = hashOtp(otp);
        const expiryMins   = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
        const expiresAt    = new Date(Date.now() + expiryMins * 60 * 1000);

        // Invalidate all previous unused OTPs for this email/type
        await OtpToken.updateMany(
            { email, type, used: false },
            { used: true }
        );

        // Store the HASHED OTP — plain text is never saved
        await OtpToken.create({ email, otp: hashedOtp, type, expiresAt });
        return otp;
    },

    /**
     * Verifies an OTP by comparing its SHA-256 hash against the stored hash.
     */
    async verify(email, otp, type = 'registration') {
        const hashedOtp = hashOtp(otp);

        const record = await OtpToken.findOne({
            email,
            otp: hashedOtp,
            type,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!record) return false;

        record.used = true;
        await record.save();
        return true;
    }
};

module.exports = otpService;
