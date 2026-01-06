#!/usr/bin/env node

/**
 * Manual Bus Location Update Tool
 * Allows manual entry of latitude/longitude for bus tracking
 */

const readline = require('readline');

const API_BASE_URL = 'http://192.168.204.176:5001';

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Predefined locations in Colombo for quick selection
const predefinedLocations = {
  '1': { name: 'Colombo Fort', latitude: 6.9271, longitude: 79.8612 },
  '2': { name: 'Pettah Market', latitude: 6.9147, longitude: 79.8731 },
  '3': { name: 'Nugegoda Junction', latitude: 6.8649, longitude: 79.8997 },
  '4': { name: 'Mount Lavinia', latitude: 6.8344, longitude: 79.8640 },
  '5': { name: 'Dehiwala', latitude: 6.8518, longitude: 79.8638 },
  '6': { name: 'Bambalapitiya', latitude: 6.8851, longitude: 79.8567 },
  '7': { name: 'Wellawatte', latitude: 6.8687, longitude: 79.8590 },
  '8': { name: 'Kirulapone', latitude: 6.8751, longitude: 79.8816 },
};

async function getAvailableDrivers() {
  try {
    console.log('🔍 Fetching available drivers...\n');
    
    const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      console.log('📋 Available Drivers:');
      data.data.forEach((driver, index) => {
        const status = driver.isActive ? '🟢 Active' : '🔴 Inactive';
        console.log(`   ${index + 1}. ${driver.name} - Bus ${driver.busId} (Route ${driver.routeId}) ${status}`);
        console.log(`      Driver ID: ${driver.driverId}`);
      });
      return data.data;
    } else {
      console.log('❌ No drivers found');
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to fetch drivers:', error.message);
    return [];
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function updateBusLocation(driverId, busId, routeId, latitude, longitude, speed = 25, heading = 0) {
  try {
    const locationData = {
      driverId,
      busId,
      routeId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      heading: parseInt(heading),
      speed: parseInt(speed),
      accuracy: 5,
      status: 'active'
    };

    console.log('\n📡 Sending location update...');
    console.log(`   📍 Coordinates: ${latitude}, ${longitude}`);
    console.log(`   🚌 Bus: ${busId} (Route ${routeId})`);
    console.log(`   🏃 Speed: ${speed} km/h, Heading: ${heading}°`);

    const response = await fetch(`${API_BASE_URL}/api/gps/driver/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Location updated successfully!');
      console.log(`   🕐 Timestamp: ${new Date().toLocaleString()}`);
      return true;
    } else {
      console.log(`❌ Failed to update location: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating location: ${error.message}`);
    return false;
  }
}

async function showPredefinedLocations() {
  console.log('\n📍 Predefined Locations:');
  Object.entries(predefinedLocations).forEach(([key, location]) => {
    console.log(`   ${key}. ${location.name} (${location.latitude}, ${location.longitude})`);
  });
  console.log('   9. Enter custom coordinates');
}

async function getLocationInput() {
  showPredefinedLocations();
  
  const choice = await askQuestion('\n🎯 Select location (1-9): ');
  
  if (predefinedLocations[choice]) {
    const location = predefinedLocations[choice];
    console.log(`✅ Selected: ${location.name}`);
    return { latitude: location.latitude, longitude: location.longitude };
  } else if (choice === '9') {
    const latitude = await askQuestion('📍 Enter latitude: ');
    const longitude = await askQuestion('📍 Enter longitude: ');
    
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('❌ Invalid coordinates. Please try again.');
      return await getLocationInput();
    }
    
    return { latitude: lat, longitude: lng };
  } else {
    console.log('❌ Invalid choice. Please try again.');
    return await getLocationInput();
  }
}

async function main() {
  console.log('🚌 Manual Bus Location Update Tool');
  console.log('=====================================\n');
  
  // Get available drivers
  const drivers = await getAvailableDrivers();
  if (drivers.length === 0) {
    console.log('❌ No drivers available. Exiting...');
    rl.close();
    return;
  }
  
  // Select driver
  const driverChoice = await askQuestion('\n👨‍💼 Select driver number: ');
  const selectedDriver = drivers[parseInt(driverChoice) - 1];
  
  if (!selectedDriver) {
    console.log('❌ Invalid driver selection. Exiting...');
    rl.close();
    return;
  }
  
  console.log(`✅ Selected: ${selectedDriver.name} - Bus ${selectedDriver.busId}`);
  
  // Get location
  const location = await getLocationInput();
  
  // Get optional parameters
  const speed = await askQuestion('🏃 Enter speed (km/h) [default: 25]: ') || '25';
  const heading = await askQuestion('🧭 Enter heading (0-360°) [default: 0]: ') || '0';
  
  // Update location
  const success = await updateBusLocation(
    selectedDriver.driverId,
    selectedDriver.busId,
    selectedDriver.routeId,
    location.latitude,
    location.longitude,
    speed,
    heading
  );
  
  if (success) {
    console.log('\n🎉 Location update completed!');
    
    // Ask if user wants to continue
    const continueChoice = await askQuestion('\n🔄 Update another location? (y/n): ');
    if (continueChoice.toLowerCase() === 'y') {
      console.log('\n' + '='.repeat(50) + '\n');
      main(); // Restart
      return;
    }
  }
  
  console.log('\n👋 Goodbye!');
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

// Start the tool
main();