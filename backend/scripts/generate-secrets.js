/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Script to generate strong security secrets
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating Strong Security Secrets for PacheduConnect\n');

// Generate JWT Secret (64 bytes = 512 bits)
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('✅ JWT Secret Generated:');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Generate NextAuth Secret (32 bytes = 256 bits)
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('✅ NextAuth Secret Generated:');
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}\n`);

// Generate API Keys
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('✅ API Key Generated:');
console.log(`API_KEY=${apiKey}\n`);

// Generate Encryption Keys
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log('✅ Encryption Key Generated:');
console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);

// Generate Database Password
const dbPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
console.log('✅ Database Password Generated:');
console.log(`POSTGRES_PASSWORD=${dbPassword}\n`);

// Generate Redis Password
const redisPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
console.log('✅ Redis Password Generated:');
console.log(`REDIS_PASSWORD=${redisPassword}\n`);

// Create .env.example with new secrets
const envExamplePath = path.join(__dirname, '..', '..', 'env.example');
const envPath = path.join(__dirname, '..', '..', '.env');

console.log('📝 Updating environment files...\n');

// Read existing env.example
let envContent = '';
if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf8');
} else {
  envContent = `# PacheduConnect Environment Configuration
# Generated on ${new Date().toISOString()}

# Application Settings
NODE_ENV=production
PORT=5001
FRONTEND_PORT=3000
ADMIN_PORT=3001

# Database Configuration
DATABASE_URL=postgresql://pachedu_user:POSTGRES_PASSWORD@localhost:5432/pachedu_db
POSTGRES_PASSWORD=POSTGRES_PASSWORD
POSTGRES_USER=pachedu_user
POSTGRES_DB=pachedu_db

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=REDIS_PASSWORD

# JWT & Authentication
JWT_SECRET=JWT_SECRET
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=2592000
NEXTAUTH_SECRET=NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000

# Security
API_KEY=API_KEY
ENCRYPTION_KEY=ENCRYPTION_KEY

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

OZOW_API_KEY=your_ozow_api_key
OZOW_SITE_CODE=your_ozow_site_code
OZOW_PRIVATE_KEY=your_ozow_private_key
OZOW_ENVIRONMENT=sandbox

STITCH_CLIENT_ID=your_stitch_client_id
STITCH_CLIENT_SECRET=your_stitch_client_secret
STITCH_ENVIRONMENT=sandbox

PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
PAYFAST_PASSPHRASE=your_payfast_passphrase
PAYFAST_ENVIRONMENT=sandbox

# Mobile Wallet Integrations
ECOCASH_API_KEY=your_ecocash_api_key
ECOCASH_SECRET=your_ecocash_secret

# Communication Services
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SMSPORTAL_CLIENT_ID=your_smsportal_client_id
SMSPORTAL_CLIENT_SECRET=your_smsportal_client_secret

# Exchange Rate Services
XE_ACCOUNT_ID=your_xe_account_id
XE_API_KEY=your_xe_api_key

# Monitoring & Analytics
LOG_LEVEL=info
PROMETHEUS_HOST=localhost
PROMETHEUS_PORT=9090

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SENTRY_DSN=your_sentry_dsn
`;
}

// Replace placeholder values with generated secrets
envContent = envContent
  .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`)
  .replace(/NEXTAUTH_SECRET=.*/g, `NEXTAUTH_SECRET=${nextAuthSecret}`)
  .replace(/API_KEY=.*/g, `API_KEY=${apiKey}`)
  .replace(/ENCRYPTION_KEY=.*/g, `ENCRYPTION_KEY=${encryptionKey}`)
  .replace(/POSTGRES_PASSWORD=.*/g, `POSTGRES_PASSWORD=${dbPassword}`)
  .replace(/REDIS_PASSWORD=.*/g, `REDIS_PASSWORD=${redisPassword}`);

// Write updated env.example
fs.writeFileSync(envExamplePath, envContent);
console.log('✅ Updated env.example with new secrets');

// Create .env file if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with new secrets');
} else {
  console.log('⚠️  .env file already exists - please update manually with the secrets above');
}

console.log('\n🔒 Security Secrets Generated Successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Update your .env file with the generated secrets');
console.log('2. Keep these secrets secure and never commit them to version control');
console.log('3. Use different secrets for each environment (development, staging, production)');
console.log('4. Rotate secrets regularly for enhanced security');
console.log('\n⚠️  IMPORTANT: Store these secrets securely and never share them publicly!'); 