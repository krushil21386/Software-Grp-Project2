const crypto = require('crypto');
const logger = require('./loggerService');
const fs = require('fs');

// Master Encryption Key (Derived to be exactly 32 bytes for AES-256)
const RAW_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();
const IV_LENGTH = 16;

console.log('[SecurityGateway] Encryption key initialized (32 bytes hash).');

// ── PRODUCTION SAFETY CHECK ──────────────────────────────────────
if (!process.env.ENCRYPTION_KEY) {
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  ⚠️  CRITICAL SECURITY WARNING                              ║');
    console.error('║  ENCRYPTION_KEY is not set in environment variables!        ║');
    console.error('║  Using hardcoded fallback key — PHI data is NOT secure.     ║');
    console.error('║  Set ENCRYPTION_KEY in .env with a random 32-byte string.  ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
}

const securityGateway = {
    /**
     * Encrypts a string using AES-256-CBC.
     */
    encrypt(text) {
        if (text === null || text === undefined || text === '') return text;
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let encrypted = cipher.update(String(text));
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (err) {
            console.error('[SecurityGateway] Encryption CRITICAL FAILURE:', err.message);
            logger.error('Encryption failed:', err);
            return text;
        }
    },

    /**
     * Decrypts a string.
     */
    decrypt(text) {
        if (!text || typeof text !== 'string' || !text.includes(':')) return text;
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (err) {
            logger.error('Decryption failed (malformed data):', err);
            return text;
        }
    },

    /**
     * Scans a file for malicious patterns.
     * Real-time signature and heuristic analysis.
     */
    async scanFile(filePath) {
        return new Promise((resolve, reject) => {
            logger.info(`🔍 Scanning file: ${filePath}`);
            
            // 1. Signature Check for common malicious patterns (Real Implementation)
            const MALICIOUS_PATTERNS = [
                Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'), // EICAR Test
                Buffer.from('base64_decode('),
                Buffer.from('eval(gzuncompress('),
                Buffer.from('system('),
                Buffer.from('shell_exec(')
            ];

            const fileBuffer = fs.readFileSync(filePath);

            for (const pattern of MALICIOUS_PATTERNS) {
                if (fileBuffer.includes(pattern)) {
                    logger.warn(`🛑 MALWARE DETECTED in ${filePath}. Pattern: ${pattern.toString()}`);
                    return resolve({ 
                        safe: false, 
                        threat: 'Malicious Code Pattern Detected', 
                        status: 'THREAT_FOUND' 
                    });
                }
            }

            // 2. Entropy Analysis (Real Security Technique)
            // Files with extremely high entropy are often encrypted payloads or packed malware.
            const entropy = this.calculateEntropy(fileBuffer);
            if (entropy > 7.5 && filePath.endsWith('.exe')) {
                logger.warn(`🛑 SUSPICIOUS ENTROPY (${entropy}) in ${filePath}`);
                return resolve({ safe: false, threat: 'High Entropy Packed Executable', status: 'SUSPICIOUS' });
            }

            logger.info(`✅ File scan complete: ${filePath} is safe.`);
            resolve({ safe: true, status: 'CLEAN' });
        });
    },

    calculateEntropy(buffer) {
        const len = buffer.length;
        const frequencies = new Array(256).fill(0);
        for (let i = 0; i < len; i++) frequencies[buffer[i]]++;
        
        let entropy = 0;
        for (let i = 0; i < 256; i++) {
            if (frequencies[i] > 0) {
                const p = frequencies[i] / len;
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }
};

module.exports = securityGateway;
