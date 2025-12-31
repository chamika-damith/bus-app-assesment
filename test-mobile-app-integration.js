#!/usr/bin/env node

/**
 * Test Mobile App Integration
 * Comprehensive test to verify mobile app can connect to backend and retrieve GPS data
 */

const API_BASE_URL = 'http://192.168.204.176:5000';

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function testMobileAppIntegration() {
  console.log('🚀 Testing Mobile App Integration');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  let allTestsPassed = true;

  try {
    // Test 1: Live Buses API (Primary feature)
    console.log('1. Testing Live Buses API...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
      const data = await response.json();
      
      if (data.success && data.count > 0) {
        console.log(`✅ Live buses API working: ${data.count} buses available`);
        
        // Validate GPS data structure
        const firstBus = data.data[0];
        if (firstBus.latitude && firstBus.longitude && firstBus.busId && firstBus.routeId) {
          console.log(`✅ GPS data structure is valid`);
          console.log(`   Sample: Bus ${firstBus.busId} at (${firstBus.latitude}, ${firstBus.longitude})`);
        } else {
          console.log(`❌ GPS data structure is invalid`);
          allTestsPassed = false;
        }
      } else {
        console.log(`❌ Live buses API failed: ${data.message || 'No buses available'}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Live buses API error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 2: User Authentication API
    console.log('\n2. Testing User Authentication API...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();
      
      if (data.success || Array.isArray(data.data)) {
        console.log(`✅ Users API working: ${data.data?.length || 0} users available`);
      } else {
        console.log(`❌ Users API failed: ${data.message || 'Unknown error'}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Users API error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 3: Drivers Management API
    console.log('\n3. Testing Drivers Management API...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
      const data = await response.json();
      
      if (data.success && data.count > 0) {
        console.log(`✅ Drivers API working: ${data.count} drivers available`);
        
        // Check if drivers have GPS locations
        const driversWithLocation = data.data.filter(driver => driver.currentLocation);
        console.log(`✅ Drivers with GPS data: ${driversWithLocation.length}/${data.count}`);
        
        if (driversWithLocation.length === 0) {
          console.log(`⚠️  Warning: No drivers have GPS locations`);
        }
      } else {
        console.log(`❌ Drivers API failed: ${data.message || 'No drivers available'}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Drivers API error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 4: Specific Bus Location API
    console.log('\n4. Testing Specific Bus Location API...');
    try {
      // Get a bus ID from live buses
      const liveBusesResponse = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
      const liveBusesData = await liveBusesResponse.json();
      
      if (liveBusesData.success && liveBusesData.count > 0) {
        const testBusId = liveBusesData.data[0].busId;
        
        const response = await fetch(`${API_BASE_URL}/api/gps/bus/${testBusId}/location`);
        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Specific bus location API working for bus ${testBusId}`);
        } else {
          console.log(`❌ Specific bus location API failed: ${data.message}`);
          allTestsPassed = false;
        }
      } else {
        console.log(`⚠️  Skipping specific bus test: No live buses available`);
      }
    } catch (error) {
      console.log(`❌ Specific bus location API error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 5: Network Connectivity Simulation
    console.log('\n5. Testing Network Connectivity...');
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        console.log(`✅ Network connectivity good: ${responseTime}ms response time`);
        
        if (responseTime > 5000) {
          console.log(`⚠️  Warning: Slow response time (${responseTime}ms)`);
        }
      } else {
        console.log(`❌ Network connectivity issue: HTTP ${response.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Network connectivity error: ${error.message}`);
      allTestsPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\n✅ Mobile App Integration Status:');
      console.log('   - Backend server is accessible');
      console.log('   - Live GPS data is available');
      console.log('   - Authentication endpoints working');
      console.log('   - Network connectivity is good');
      console.log('\n🚀 The mobile app should now work correctly with:');
      console.log('   - Real-time bus tracking');
      console.log('   - Live GPS locations on Google Maps');
      console.log('   - User authentication');
      console.log('   - Admin driver management');
      console.log('\n📱 Ready to test on mobile device!');
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log('\n🔧 Issues found that need to be addressed:');
      console.log('   - Check backend server status');
      console.log('   - Verify GPS data is being updated');
      console.log('   - Ensure network connectivity');
      console.log('\n📱 Mobile app may have connectivity issues.');
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the integration test
testMobileAppIntegration();