/**
 * Test Enhanced Real-Time Map Display Immediately After Adding Data
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5001/api';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = http;
    
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

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testImmediateMapDisplay() {
  console.log('=== Testing Enhanced Real-Time Map Display (Immediate) ===\n');

  try {
    // Add fresh location data
    console.log('1. Adding fresh location data...');
    
    // Login driver
    const loginData = {
      phone: '+94771234567',
      deviceId: 'device_android_001'
    };
    
    const loginResponse = await makePostRequest(`${API_BASE_URL}/gps/driver/login`, loginData);
    
    if (loginResponse.success && loginResponse.data.sessionId) {
      const sessionId = loginResponse.data.sessionId;
      const driverId = loginResponse.data.driverId;
      
      // Add location immediately
      const locationData = {
        driverId: driverId,
        busId: 'bus_138_01',
        routeId: 'route_138',
        latitude: 6.9271,
        longitude: 79.8612,
        heading: 45,
        speed: 35,
        accuracy: 15,
        status: 'active',
        sessionId: sessionId
      };
      
      const locationResponse = await makePostRequest(`${API_BASE_URL}/gps/driver/location`, locationData);
      
      if (locationResponse.success) {
        console.log('✓ Location added successfully');
        
        // Immediately test the live buses endpoint
        console.log('\n2. Testing live buses endpoint immediately...');
        const liveBusesData = await makeRequest(`${API_BASE_URL}/gps/buses/live`);
        
        console.log('Live buses response:', JSON.stringify(liveBusesData, null, 2));
        
        if (liveBusesData.success && liveBusesData.data && liveBusesData.data.length > 0) {
          console.log(`✓ Successfully retrieved ${liveBusesData.data.length} bus locations`);
          
          // Test the data structure
          const bus = liveBusesData.data[0];
          console.log('\nFirst bus data structure:');
          console.log('- driverId:', bus.driverId);
          console.log('- busId:', bus.busId);
          console.log('- routeId:', bus.routeId);
          console.log('- location:', bus.location);
          console.log('- status:', bus.status);
          console.log('- timestamp:', bus.timestamp);
          
          // Test specific bus location endpoint
          console.log('\n3. Testing specific bus location endpoint...');
          const busLocationData = await makeRequest(`${API_BASE_URL}/gps/bus/${bus.busId}/location`);
          console.log('Bus location response:', JSON.stringify(busLocationData, null, 2));
          
          console.log('\n✅ Enhanced map display test completed successfully!');
          return true;
        } else {
          console.log('✗ No live buses found in response');
          return false;
        }
      } else {
        console.log('✗ Failed to add location:', locationResponse.message);
        return false;
      }
    } else {
      console.log('✗ Failed to login driver:', loginResponse.message);
      return false;
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
testImmediateMapDisplay()
  .then(success => {
    console.log(success ? '\n🎉 Test passed!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });