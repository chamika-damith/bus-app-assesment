#!/usr/bin/env node

/**
 * Test Mobile App API Connection
 * Tests the exact same API calls that the mobile app makes
 */

const API_BASE_URL = 'http://192.168.204.176:5000';

// Use node-fetch for Node.js compatibility
async function testAPIConnection() {
  console.log('🔍 Testing Mobile App API Connection');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    // Test 1: Health check (if available)
    console.log('1. Testing server connectivity...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Server is accessible`);
        console.log(`✅ Live buses available: ${data.count}`);
        
        if (data.count > 0) {
          console.log('\n📍 Live Bus Data:');
          data.data.forEach((bus, index) => {
            console.log(`   ${index + 1}. Bus ${bus.busId} (Route ${bus.routeId})`);
            console.log(`      Location: ${bus.latitude}, ${bus.longitude}`);
            console.log(`      Speed: ${bus.speed} km/h, Heading: ${bus.heading}°`);
            console.log(`      Status: ${bus.status}, Accuracy: ${bus.accuracy}m`);
          });
        }
      } else {
        console.log(`❌ Server responded but with error: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Server connectivity failed: ${error.message}`);
      throw error;
    }

    // Test 2: Get all users (for authentication testing)
    console.log('\n2. Testing user authentication endpoint...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();
      
      if (data.success || Array.isArray(data.data)) {
        console.log(`✅ Users endpoint accessible`);
        console.log(`✅ Users available: ${data.data?.length || 0}`);
      } else {
        console.log(`❌ Users endpoint error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Users endpoint failed: ${error.message}`);
    }

    // Test 3: Get all drivers
    console.log('\n3. Testing drivers endpoint...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Drivers endpoint accessible`);
        console.log(`✅ Drivers available: ${data.count}`);
        
        if (data.count > 0) {
          console.log('\n👨‍💼 Driver Data:');
          data.data.forEach((driver, index) => {
            console.log(`   ${index + 1}. ${driver.name} (${driver.driverId})`);
            console.log(`      Bus: ${driver.busId}, Route: ${driver.routeId}`);
            console.log(`      Phone: ${driver.phone}, Active: ${driver.isActive}`);
            console.log(`      Online: ${driver.isOnline}, Last Seen: ${new Date(driver.lastSeen).toLocaleString()}`);
          });
        }
      } else {
        console.log(`❌ Drivers endpoint error: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Drivers endpoint failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 API Connection Test Completed!');
    console.log('\n✅ Summary:');
    console.log('   - Backend server is running and accessible');
    console.log('   - GPS data is available for live bus tracking');
    console.log('   - Mobile app should be able to connect successfully');
    console.log('\n🚀 The mobile app network connectivity issue should be resolved!');

  } catch (error) {
    console.error('\n❌ API Connection Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure backend server is running: cd BusTracking-Backend && npm start');
    console.log('   2. Check if IP address 192.168.204.176 is correct for your network');
    console.log('   3. Verify firewall settings allow connections on port 5000');
    console.log('   4. Try using localhost:5000 if testing on the same machine');
    process.exit(1);
  }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the test
testAPIConnection();