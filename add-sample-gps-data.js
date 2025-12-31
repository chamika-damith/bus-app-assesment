#!/usr/bin/env node

/**
 * Add Sample GPS Data to Drivers
 * 
 * This script adds GPS coordinates to existing drivers so they show up as live buses
 */

const API_BASE_URL = 'http://192.168.204.176:5000';

// Sample GPS coordinates around Colombo, Sri Lanka
const sampleLocations = [
  { latitude: 6.9271, longitude: 79.8612, name: 'Colombo Fort' },
  { latitude: 6.9147, longitude: 79.8731, name: 'Pettah' },
  { latitude: 6.8649, longitude: 79.8997, name: 'Nugegoda' },
  { latitude: 6.8905, longitude: 79.8567, name: 'Dehiwala' },
  { latitude: 6.9497, longitude: 79.8500, name: 'Kelaniya' },
];

async function addGPSDataToDrivers() {
  console.log('📍 Adding GPS Data to Drivers\n');

  try {
    // Get all drivers
    console.log('1. Fetching all drivers...');
    const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch drivers');
    }

    const drivers = data.data;
    console.log(`✅ Found ${drivers.length} drivers`);

    // Add GPS locations to active drivers
    console.log('\n2. Adding GPS locations to drivers...');
    
    for (let i = 0; i < Math.min(drivers.length, sampleLocations.length); i++) {
      const driver = drivers[i];
      const location = sampleLocations[i];
      
      if (driver.isActive) {
        console.log(`   Adding location to ${driver.name} (${driver.driverId})`);
        
        const locationData = {
          driverId: driver.driverId,
          busId: driver.busId,
          routeId: driver.routeId,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: Math.floor(Math.random() * 360), // Random heading
          speed: Math.floor(Math.random() * 60) + 20, // 20-80 km/h
          accuracy: 5, // 5 meter accuracy
          status: 'active'
        };

        try {
          const updateResponse = await fetch(`${API_BASE_URL}/api/gps/driver/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(locationData),
          });

          const updateResult = await updateResponse.json();
          
          if (updateResult.success) {
            console.log(`   ✅ Location added: ${location.name} (${location.latitude}, ${location.longitude})`);
          } else {
            console.log(`   ❌ Failed to add location: ${updateResult.message}`);
          }
        } catch (error) {
          console.log(`   ❌ Error adding location: ${error.message}`);
        }
      } else {
        console.log(`   ⏸️  Skipping inactive driver: ${driver.name}`);
      }
    }

    console.log('\n3. Verifying live buses...');
    
    // Check live buses
    const liveBusesResponse = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
    const liveBusesData = await liveBusesResponse.json();
    
    if (liveBusesData.success) {
      console.log(`✅ Live buses available: ${liveBusesData.count}`);
      
      if (liveBusesData.count > 0) {
        console.log('\n📍 Live Bus Locations:');
        liveBusesData.data.forEach((bus, index) => {
          console.log(`   ${index + 1}. Bus ${bus.busId} (Route ${bus.routeId})`);
          console.log(`      Location: ${bus.location?.latitude}, ${bus.location?.longitude}`);
          console.log(`      Speed: ${bus.location?.speed} km/h`);
          console.log(`      Last Update: ${new Date(bus.lastSeen).toLocaleTimeString()}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch live buses');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 GPS data setup completed!');
    console.log('\n✅ Next Steps:');
    console.log('   1. The mobile app should now show live buses');
    console.log('   2. GPS locations will be displayed on the map');
    console.log('   3. Real-time tracking is now available');
    console.log('\n🗺️  You can now test the map functionality in the mobile app!');

  } catch (error) {
    console.error('❌ Failed to add GPS data:', error.message);
    process.exit(1);
  }
}

// Run the script
addGPSDataToDrivers();