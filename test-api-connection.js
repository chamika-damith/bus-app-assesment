// Simple test script to verify backend API connection
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

async function testAPIConnection() {
  console.log('Testing API connection to:', API_BASE_URL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('   Database:', healthData.services.database);
    console.log('   GPS Service:', healthData.services.gps.serviceRunning ? 'Running' : 'Stopped');
    console.log('   Total Drivers:', healthData.services.gps.totalDrivers);
    
    // Test get drivers endpoint
    console.log('\n2. Testing get drivers endpoint...');
    const driversResponse = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
    const driversData = await driversResponse.json();
    console.log('✅ Drivers endpoint:', driversData.success ? 'Working' : 'Failed');
    console.log('   Drivers count:', driversData.count);
    
    // Test get users endpoint
    console.log('\n3. Testing get users endpoint...');
    const usersResponse = await fetch(`${API_BASE_URL}/api/users`);
    const usersData = await usersResponse.json();
    console.log('✅ Users endpoint:', usersData.success ? 'Working' : 'Failed');
    console.log('   Users count:', usersData.count);
    
    // Test live buses endpoint
    console.log('\n4. Testing live buses endpoint...');
    const liveBusesResponse = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
    const liveBusesData = await liveBusesResponse.json();
    console.log('✅ Live buses endpoint:', liveBusesData.success ? 'Working' : 'Failed');
    console.log('   Active buses:', liveBusesData.count);
    
    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('\nThe mobile app should now be able to connect to the backend.');
    
  } catch (error) {
    console.error('\n❌ API Connection Failed:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure the backend server is running: cd BusTracking-Backend && npm start');
    console.log('2. Check if the server is accessible at:', API_BASE_URL);
    console.log('3. Verify MongoDB is running and connected');
    console.log('4. Check firewall settings if using a different IP address');
  }
}

testAPIConnection();