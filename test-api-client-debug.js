#!/usr/bin/env node

/**
 * Debug API Client
 */

// Mock the required modules for Node.js testing
global.fetch = require('node-fetch');

// Mock Expo modules
const mockExpoSecureStore = {
  getItemAsync: async (key) => null,
  setItemAsync: async (key, value) => {},
  deleteItemAsync: async (key) => {},
};

const mockExpoConstants = {
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:5000'
    }
  }
};

// Mock the modules
require.cache[require.resolve('expo-secure-store')] = {
  exports: mockExpoSecureStore
};

require.cache[require.resolve('expo-constants')] = {
  exports: { default: mockExpoConstants }
};

// Now import our API client
const { getAPIClient } = require('./lib/api/client.js');

async function testAPIClient() {
  console.log('🧪 Testing API Client Directly\n');

  try {
    const apiClient = getAPIClient();
    
    console.log('1. Testing getUsers()...');
    const users = await apiClient.getUsers();
    console.log('✅ Users loaded:', users.length);
    console.log('   Sample user:', users[0]);
    
    console.log('\n2. Testing getDrivers()...');
    const drivers = await apiClient.getDrivers();
    console.log('✅ Drivers loaded:', drivers.length);
    if (drivers.length > 0) {
      console.log('   Sample driver:', drivers[0]);
    }
    
    console.log('\n3. Testing getLiveBuses()...');
    const buses = await apiClient.getLiveBuses();
    console.log('✅ Live buses loaded:', buses.length);
    if (buses.length > 0) {
      console.log('   Sample bus:', buses[0]);
    }
    
    console.log('\n4. Testing authentication with real user...');
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`   Attempting login with email: ${testUser.email}`);
      
      try {
        const authResult = await apiClient.login({
          email: testUser.email,
          password: 'anypassword' // Password validation not implemented yet
        });
        console.log('✅ Authentication successful');
        console.log('   User:', authResult.user.name);
        console.log('   Role:', authResult.user.role);
      } catch (authError) {
        console.log('❌ Authentication failed:', authError.message);
      }
    }
    
    console.log('\n5. Testing authentication with invalid email...');
    try {
      await apiClient.login({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      });
      console.log('❌ Authentication should have failed but succeeded');
    } catch (authError) {
      console.log('✅ Authentication properly rejected invalid email');
      console.log('   Error:', authError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testAPIClient();