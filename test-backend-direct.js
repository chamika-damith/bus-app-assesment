#!/usr/bin/env node

/**
 * Test backend authentication directly
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';

async function testBackendDirect() {
  console.log('🧪 Testing Backend Authentication Directly');
  console.log('==========================================\n');

  // Test data from the database
  const testDriver = {
    email: 'testlogin555@example.com',
    password: 'mypassword123'
  };

  try {
    console.log('Testing with:');
    console.log('Email:', testDriver.email);
    console.log('Password:', testDriver.password);
    console.log('URL:', `${BASE_URL}/gps/driver/login`);
    
    const response = await axios.post(`${BASE_URL}/gps/driver/login`, testDriver, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n❌ Error occurred:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - backend server is not running');
      console.log('Please start the backend server first');
    } else if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network error:', error.message);
    }
  }
}

testBackendDirect();