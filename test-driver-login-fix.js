#!/usr/bin/env node

/**
 * Test driver login with the correct password
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test data - using the correct password from the database
const testDriver = {
  email: 'testlogin555@example.com',
  password: 'mypassword123' // This is the correct password based on the search results
};

async function testDriverLogin() {
  console.log('🧪 Testing Driver Login with Correct Password');
  console.log('===============================================\n');

  try {
    console.log('Attempting login with:');
    console.log('Email:', testDriver.email);
    console.log('Password: mypassword123');
    
    const loginResponse = await axios.post(`${BASE_URL}/gps/driver/login`, {
      email: testDriver.email,
      password: testDriver.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Authentication successful!');
      console.log('Response data:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Authentication failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data.message || error.response.data.error);
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Also test with wrong password to verify error handling
async function testWrongPassword() {
  console.log('\n🧪 Testing with Wrong Password');
  console.log('==============================\n');

  try {
    const loginResponse = await axios.post(`${BASE_URL}/gps/driver/login`, {
      email: testDriver.email,
      password: 'wrongpassword'
    });

    console.log('❌ Should have failed but succeeded:', loginResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Wrong password correctly rejected');
      console.log('Error message:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

async function runTests() {
  await testDriverLogin();
  await testWrongPassword();
  console.log('\n🏁 Driver login tests completed');
}

runTests().catch(console.error);