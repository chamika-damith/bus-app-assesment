// Simple test to verify GPS service functionality
const { gpsService } = require('./lib/services/gps-service');

async function testGPSService() {
  try {
    console.log('Testing GPS Service...');
    
    // Test initialization
    const config = {
      driverId: 'test-driver-123',
      busId: 'bus-456',
      routeId: 'route-789',
      deviceId: 'device-test-001'
    };
    
    console.log('Initializing GPS service...');
    await gpsService.initialize(config);
    
    console.log('GPS service initialized successfully!');
    
    // Test status
    const status = gpsService.getStatus();
    console.log('GPS Status:', status);
    
    console.log('GPS Service test completed successfully!');
    
  } catch (error) {
    console.error('GPS Service test failed:', error);
  }
}

// Run the test
testGPSService();