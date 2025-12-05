// Test script to check checkout config creation
const fs = require('fs');
const path = require('path');

// Read .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const PLAN_ID = process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc';
const TEST_EMAIL = 'test@example.com';

console.log('Testing Checkout Config Creation...');
console.log('API Key:', WHOP_API_KEY ? `${WHOP_API_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('Plan ID:', PLAN_ID);
console.log('\n');

async function testCheckoutConfig() {
  try {
    console.log('Creating checkout configuration with API v1...');
    const response = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: PLAN_ID,
        metadata: {
          userEmail: TEST_EMAIL,
          source: 'xperience_living',
        },
      }),
    });

    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (!response.ok) {
      try {
        const error = JSON.parse(responseText);
        console.log('\n❌ Error Response:', JSON.stringify(error, null, 2));
      } catch (e) {
        console.log('❌ Raw Error Response:', responseText);
      }
    } else {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Success! Checkout Config Created:');
        console.log('  ID:', data.id);
        console.log('  Plan ID:', data.plan?.id || PLAN_ID);
        console.log('  Purchase URL:', data.purchase_url);
        console.log('  Metadata:', JSON.stringify(data.metadata || {}, null, 2));
        console.log('\nFull Response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('✅ Success! Raw Response:', responseText);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCheckoutConfig();

