#!/usr/bin/env node

/**
 * Test Email-Only Authentication
 * Tests the updated driver login system that uses email and password only
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test data
const testDriver = {
  email: 'john.doe@driver.com',
  password: 'password123'
};

async function testEmailAuthentication() {
  console.log('🧪 Testing Email-Only Authentication');
  console.log('=====================================\n');

  try {
    // Test 1: Valid email and password
    console.log('Test 1: Valid email and password authentication');
    console.log('Email:', testDriver.email);
    console.log('Password:', '[HIDDEN]');
    
    const loginResponse = await axios.post(`${BASE_URL}/gps/driver/login`, {
      email: testDriver.email,
      password: testDriver.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Authentication successful');
      console.log('Driver ID:', loginResponse.data.data.driverId);
      console.log('Name:', loginResponse.data.data.name);
      console.log('Email:', loginResponse.data.data.email);
      console.log('Bus ID:', loginResponse.data.data.busId);
      console.log('Route ID:', loginResponse.data.data.routeId);
      console.log('Session ID:', loginResponse.data.data.sessionId);
      
      // Test session validation
      console.log('\nTest 2: Session validation');
      const sessionId = loginResponse.data.data.sessionId;
      
      const validateResponse = await axios.post(`${BASE_URL}/gps/driver/validate-session`, {
        sessionId: sessionId
      });
      
      if (validateResponse.data.success) {
        console.log('✅ Session validation successful');
      } else {
        console.log('❌ Session validation failed');
      }
      
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Authentication failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data.message || error.response.data.error);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }

  // Test 3: Invalid credentials
  console.log('\nTest 3: Invalid credentials');
  try {
    const invalidResponse = await axios.post(`${BASE_URL}/gps/driver/login`, {
      email: 'invalid@email.com',
      password: 'wrongpassword'
    });
    
    console.log('❌ Should have failed but succeeded:', invalidResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid credentials correctly rejected');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test 4: Missing fields
  console.log('\nTest 4: Missing required fields');
  try {
    const missingFieldsResponse = await axios.post(`${BASE_URL}/gps/driver/login`, {
      email: testDriver.email
      // Missing password
    });
    
    console.log('❌ Should have failed but succeeded:', missingFieldsResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Missing fields correctly rejected');
      console.log('Error message:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\n🏁 Email authentication tests completed');
}

// Run the test
if (require.main === module) {
  testEmailAuthentication().catch(console.error);
}

module.exports = { testEmailAuthentication };