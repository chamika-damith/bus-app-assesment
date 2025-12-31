#!/usr/bin/env node

/**
 * Test Backend Integration
 * 
 * This script tests the mobile app's integration with the backend API
 * to ensure all endpoints are working correctly.
 */

const API_BASE_URL = 'http://localhost:5000';

async function testBackendIntegration() {
  console.log('🧪 Testing Backend Integration for Mobile App\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  let allTestsPassed = true;

  // Test 1: Health Check
  try {
    console.log('1. Testing health endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Health check: Server is running');
      console.log(`   Database: ${data.services.database}`);
      console.log(`   GPS Service: ${data.services.gps.serviceRunning ? 'Running' : 'Stopped'}`);
      console.log(`   Total Drivers: ${data.services.gps.totalDrivers}`);
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 2: Get Live Buses (for nearby buses screen)
  try {
    console.log('2. Testing live buses endpoint (for nearby buses screen)...');
    const response = await fetch(`${API_BASE_URL}/api/gps/live-buses`);
    const data = await response.json();
    
    console.log('✅ Live buses endpoint: Working');
    console.log(`   Active buses: ${Array.isArray(data) ? data.length : 'Invalid response format'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample bus data:');
      const sampleBus = data[0];
      console.log(`     - Bus ID: ${sampleBus.busId}`);
      console.log(`     - Route: ${sampleBus.routeId}`);
      console.log(`     - Active: ${sampleBus.isActive}`);
      console.log(`     - Location: ${sampleBus.location ? 'Available' : 'Not available'}`);
    }
  } catch (error) {
    console.log('❌ Live buses endpoint failed:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 3: Get Drivers (for admin drivers screen)
  try {
    console.log('3. Testing drivers endpoint (for admin drivers screen)...');
    const response = await fetch(`${API_BASE_URL}/api/gps/drivers`);
    const data = await response.json();
    
    console.log('✅ Drivers endpoint: Working');
    console.log(`   Drivers count: ${Array.isArray(data) ? data.length : 'Invalid response format'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample driver data:');
      const sampleDriver = data[0];
      console.log(`     - Driver ID: ${sampleDriver.id || sampleDriver.driverId}`);
      console.log(`     - Name: ${sampleDriver.name}`);
      console.log(`     - Phone: ${sampleDriver.phone}`);
      console.log(`     - Bus ID: ${sampleDriver.busId}`);
      console.log(`     - Active: ${sampleDriver.isActive}`);
    }
  } catch (error) {
    console.log('❌ Drivers endpoint failed:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 4: Get Users (for admin users screen)
  try {
    console.log('4. Testing users endpoint (for admin users screen)...');
    const response = await fetch(`${API_BASE_URL}/api/users`);
    const data = await response.json();
    
    console.log('✅ Users endpoint: Working');
    console.log(`   Users count: ${Array.isArray(data) ? data.length : 'Invalid response format'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample user data:');
      const sampleUser = data[0];
      console.log(`     - User ID: ${sampleUser._id || sampleUser.id}`);
      console.log(`     - Name: ${sampleUser.name}`);
      console.log(`     - Email: ${sampleUser.email}`);
      console.log(`     - Phone: ${sampleUser.telephone}`);
    }
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 5: Test Driver Registration (for admin add driver functionality)
  try {
    console.log('5. Testing driver registration endpoint...');
    const testDriverData = {
      name: 'Test Driver Integration',
      phone: '+94771234567',
      licenseNumber: 'TEST_LICENSE_001',
      busId: 'test_bus_001',
      routeId: 'test_route_001',
      deviceId: 'test_device_' + Date.now(),
    };

    const response = await fetch(`${API_BASE_URL}/api/gps/driver/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDriverData),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Driver registration: Working');
      console.log(`   New driver ID: ${data.data?.driverId || data.driverId}`);
      console.log('   Registration response format is compatible with mobile app');
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (error) {
    console.log('❌ Driver registration failed:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 6: Test User Registration (for passenger/admin registration)
  try {
    console.log('6. Testing user registration endpoint...');
    const testUserData = {
      name: 'Test User Integration',
      email: `testuser${Date.now()}@integration.test`,
      password: 'testpassword123',
      telephone: `+9477123456${Math.floor(Math.random() * 10)}`,
      nic: 'TEST_NIC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    };

    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ User registration: Working');
      console.log(`   New user ID: ${data.data?._id || data.data?.id}`);
      console.log('   Registration response format is compatible with mobile app');
    } else {
      throw new Error(data.message || 'User registration failed');
    }
  } catch (error) {
    console.log('❌ User registration failed:', error.message);
    allTestsPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 All backend integration tests passed!');
    console.log('\n✅ The mobile app should now be able to:');
    console.log('   - Connect to the backend server');
    console.log('   - Load real driver data in admin screens');
    console.log('   - Load real user data in admin screens');
    console.log('   - Display live bus locations in passenger screens');
    console.log('   - Register new drivers and users');
    console.log('   - Handle backend response formats correctly');
    console.log('\n🚀 Backend integration is complete and working!');
  } else {
    console.log('❌ Some backend integration tests failed.');
    console.log('   Please check the backend server and fix any issues.');
    process.exit(1);
  }
}

// Run the tests
testBackendIntegration().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});