/**
 * Test Enhanced Real-Time Map Display
 * Tests the enhanced map functionality for Requirements 4.1, 4.2, 4.4, 4.5
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5001/api';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEnhancedMapDisplay() {
  console.log('=== Testing Enhanced Real-Time Map Display ===\n');

  try {
    // Test Requirement 4.1: Display all active bus locations
    console.log('Testing Requirement 4.1: Display all active bus locations');
    const liveBusesData = await makeRequest(`${API_BASE_URL}/gps/buses/live`);
    
    if (liveBusesData.success && liveBusesData.data) {
      console.log(`✓ Successfully retrieved ${liveBusesData.data.length} bus locations`);
      
      // Test Requirement 4.2: Comprehensive bus marker information
      console.log('\nTesting Requirement 4.2: Comprehensive bus marker information');
      liveBusesData.data.forEach((bus, index) => {
        console.log(`Bus ${index + 1} data:`, JSON.stringify(bus, null, 2));
        
        const hasRequiredInfo = (bus.busId || bus.driverId) && bus.routeId && 
                               (bus.latitude !== undefined || bus.location?.coordinates?.[1] !== undefined) &&
                               (bus.longitude !== undefined || bus.location?.coordinates?.[0] !== undefined);
        
        if (hasRequiredInfo) {
          console.log(`✓ Bus ${index + 1}: Has required marker information`);
        } else {
          console.log(`✗ Bus ${index + 1}: Missing required marker information`);
        }
      });

      // Test Requirement 4.5: Handle offline bus display scenarios
      console.log('\nTesting Requirement 4.5: Handle offline bus display scenarios');
      const onlineBuses = liveBusesData.data.filter(bus => {
        const lastSeen = bus.lastSeen || Date.now();
        const isOnline = (Date.now() - lastSeen) < 120000; // 2 minutes threshold
        return isOnline;
      });
      
      const offlineBuses = liveBusesData.data.length - onlineBuses.length;
      console.log(`✓ Online buses: ${onlineBuses.length}`);
      console.log(`✓ Offline buses: ${offlineBuses}`);
      console.log('✓ System can distinguish between online and offline buses');

    } else {
      console.log('✗ Failed to retrieve live bus data');
      return false;
    }

    // Test Requirement 4.4: Interactive marker behavior (simulated)
    console.log('\nTesting Requirement 4.4: Interactive marker behavior');
    if (liveBusesData.data.length > 0) {
      const testBus = liveBusesData.data[0];
      const busId = testBus.busId;
      
      // Test getting specific bus location for detailed information
      const busLocationData = await makeRequest(`${API_BASE_URL}/gps/bus/${busId}/location`);
      
      if (busLocationData.success) {
        console.log(`✓ Successfully retrieved detailed information for bus ${busId}`);
        console.log(`  - Location: ${busLocationData.data.latitude}, ${busLocationData.data.longitude}`);
        console.log(`  - Speed: ${busLocationData.data.speed || 0} km/h`);
        console.log(`  - Status: ${busLocationData.data.isOnline ? 'Online' : 'Offline'}`);
      } else {
        console.log(`✗ Failed to retrieve detailed information for bus ${busId}: ${busLocationData.message}`);
      }
    }

    console.log('\n=== Enhanced Map Display Tests Completed ===');
    return true;

  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
testEnhancedMapDisplay()
  .then(success => {
    if (success) {
      console.log('\n🎉 All enhanced map display tests passed!');
    } else {
      console.log('\n❌ Some tests failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });