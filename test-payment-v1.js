/**
 * Test script to check Whop API v1 payment creation format
 * Run with: node test-payment-v1.js
 */

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;

if (!WHOP_API_KEY || !WHOP_COMPANY_ID) {
  console.error('Missing WHOP_API_KEY or WHOP_COMPANY_ID environment variables');
  process.exit(1);
}

// Test data from the error
const testData = {
  plan: {
    initial_price: 0.00, // Test product is $0
    currency: 'usd',
    plan_type: 'one_time',
  },
  company_id: WHOP_COMPANY_ID,
  member_id: 'mber_F7StCPtXuYI9q',
  payment_method_id: 'payt_ioh89BcQCQRYg',
  // Try without metadata first
};

console.log('Testing Whop API v1 payment creation...');
console.log('Request body:', JSON.stringify(testData, null, 2));

fetch('https://api.whop.com/api/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${WHOP_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then(async (response) => {
    const data = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('\n❌ Error creating payment');
      if (data.error) {
        console.error('Error details:', data.error);
      }
    } else {
      console.log('\n✅ Payment created successfully');
    }
  })
  .catch((error) => {
    console.error('\n❌ Request failed:', error.message);
  });

