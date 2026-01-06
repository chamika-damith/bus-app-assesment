/**
 * Add test location data to verify enhanced map display
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5001/api';

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

async function addTestLocationData() {
  console.log('Adding test location data...\n');

  try {
    // First, login a driver to get a session
    console.log('1. Logging in test driver...');
    const loginData = {
      phone: '+94771234567', // This matches driver_001 from mock data
      deviceId: 'device_android_001'
    };
    
    const loginResponse = await makePostRequest(`${API_BASE_URL}/gps/driver/login`, loginData);
    console.log('Login response:', loginResponse);
    
    if (loginResponse.success && loginResponse.data.sessionId) {
      const sessionId = loginResponse.data.sessionId;
      const driverId = loginResponse.data.driverId;
      
      console.log(`✓ Driver logged in successfully. Session: ${sessionId}`);
      
      // Now add a current location update
      console.log('\n2. Adding current location update...');
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
      console.log('Location response:', locationResponse);
      
      if (locationResponse.success) {
        console.log('✓ Location updated successfully');
        
        // Add a second bus location
        console.log('\n3. Adding second bus location...');
        const loginData2 = {
          phone: '+94771234568', // This matches driver_002 from mock data
          deviceId: 'device_android_002'
        };
        
        const loginResponse2 = await makePostRequest(`${API_BASE_URL}/gps/driver/login`, loginData2);
        
        if (loginResponse2.success && loginResponse2.data.sessionId) {
          const sessionId2 = loginResponse2.data.sessionId;
          const driverId2 = loginResponse2.data.driverId;
          
          const locationData2 = {
            driverId: driverId2,
            busId: 'bus_177_01',
            routeId: 'route_177',
            latitude: 6.9344,
            longitude: 79.8428,
            heading: 180,
            speed: 28,
            accuracy: 12,
            status: 'active',
            sessionId: sessionId2
          };
          
          const locationResponse2 = await makePostRequest(`${API_BASE_URL}/gps/driver/location`, locationData2);
          
          if (locationResponse2.success) {
            console.log('✓ Second bus location updated successfully');
          }
        }
        
        console.log('\n✅ Test location data added successfully!');
        return true;
      } else {
        console.log('✗ Failed to update location:', locationResponse.message);
        return false;
      }
    } else {
      console.log('✗ Failed to login driver:', loginResponse.message);
      return false;
    }
    
  } catch (error) {
    console.error('Error adding test data:', error.message);
    return false;
  }
}

// Run the script
addTestLocationData()
  .then(success => {
    console.log(success ? '\n🎉 Test data added successfully!' : '\n❌ Failed to add test data');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });