const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testSendMoney() {
  console.log('🧪 Testing Send Money Feature...\n');

  try {
    // First, let's register two test users
    console.log('📝 Creating test users...');
    
    const user1 = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Test Sender',
      email: 'sender@test.com',
      password: 'password123'
    });

    const user2 = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Test Recipient',
      email: 'recipient@test.com',
      password: 'password123'
    });

    console.log('✅ Test users created successfully');

    // Login as sender
    console.log('\n🔐 Logging in as sender...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'sender@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test user search by email
    console.log('\n🔍 Testing user search by email...');
    const searchResponse = await axios.get(`${API_URL}/api/users/search/email?email=recipient@test.com`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ User search successful:', searchResponse.data.user.name);

    // Test balance endpoint
    console.log('\n💰 Testing balance endpoint...');
    const balanceResponse = await axios.get(`${API_URL}/api/users/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Balance fetched:', balanceResponse.data.balance);

    // Test send money
    console.log('\n💸 Testing send money...');
    const sendMoneyResponse = await axios.post(`${API_URL}/api/transactions`, {
      recipientEmail: 'recipient@test.com',
      amount: 50.00,
      currency: 'USD',
      description: 'Test transaction'
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Money sent successfully:', sendMoneyResponse.data.message);

    // Check updated balance
    console.log('\n💰 Checking updated balance...');
    const updatedBalanceResponse = await axios.get(`${API_URL}/api/users/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Updated balance:', updatedBalanceResponse.data.balance);

    // Check transactions
    console.log('\n📊 Checking transactions...');
    const transactionsResponse = await axios.get(`${API_URL}/api/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Transactions fetched:', transactionsResponse.data.transactions.length, 'transactions');

    console.log('\n🎉 All send money tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testSendMoney(); 