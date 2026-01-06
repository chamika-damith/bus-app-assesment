#!/usr/bin/env node

/**
 * Debug authentication issue
 */

const axios = require('axios');

// Test the exact same request that the frontend is making
async function testAuthentication() {
  console.log('🔍 Debugging Authentication Issue');
  console.log('=================================\n');

  const testData = {
    email: 'testlogin555@example.com',
    password: 'mypassword123'
  };

  console.log('Testing with:');
  console.log('Email:', testData.email);
  console.log('Password:', testData.password);
  console.log('');

  try {
    // Try different API URLs
    const urls = [
      'http://localhost:5000/api/gps/driver/login',
      'http://localhost:5001/api/gps/driver/login',
      'http://localhost:3000/api/gps/driver/login'
    ];

    for (const url of urls) {
      console.log(`Trying URL: ${url}`);
      
      try {
        const response = await axios.post(url, testData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return; // Exit on first success

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('❌ Connection refused - server not running');
        } else if (error.response) {
          console.log('❌ HTTP Error');
          console.log('Status:', error.response.status);
          console.log('Response:', JSON.stringify(error.response.data, null, 2));
          
          if (error.response.status === 401) {
            console.log('🔍 Authentication failed - checking password...');
            
            // Try with different passwords
            const passwords = ['mypassword123', 'password123', 'temp_password', '123456'];
            
            for (const pwd of passwords) {
              try {
                console.log(`  Trying password: ${pwd}`);
                const testResponse = await axios.post(url, {
                  email: testData.email,
                  password: pwd
                });
                
                console.log(`  ✅ Success with password: ${pwd}`);
                console.log('  Response:', JSON.stringify(testResponse.data, null, 2));
                return;
                
              } catch (pwdError) {
                if (pwdError.response && pwdError.response.status === 401) {
                  console.log(`  ❌ Failed with password: ${pwd}`);
                } else {
                  console.log(`  ❌ Error with password ${pwd}:`, pwdError.message);
                }
              }
            }
          }
        } else {
          console.log('❌ Network error:', error.message);
        }
      }
      
      console.log('');
    }

    console.log('❌ All URLs failed');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuthentication();