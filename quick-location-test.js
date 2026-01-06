#!/usr/bin/env node

/**
 * Quick Location Test
 * Instantly add test locations for all registered drivers
 */

const API_BASE_URL = 'http://192.168.204.176:5001';

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Test locations around Colombo
const testLocations = [
  { name: 'Colombo Fort', latitude: 6.9271, longitude: 79.8612 },
  { name: 'Pettah Market', latitude: 6.9147, longitude: 79.8731 },
  { name: 'Nugegoda Junction', latitude: 6.8649, longitude: 79.8997 },
  { name: 'Mount Lavinia', latitude: 6.8344, longitude: 79.8640 },
  { name: 'Dehiwala', latitude: 6.8518, longitude: 79.8638 },
];

async function quickTest() {
  try {
    console.log('🚀 Quick Location Test - Adding test locations for all drivers\n');
    
    // Get all drivers
    const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
    const data = await response.json();
    
    if (!data.success || data.count === 0) {
      console.log('❌ No drivers found');
      return;
    }
    
    console.log(`📋 Found ${data.count} drivers\n`);
    
    let successCount = 0;
    
    for (let i = 0; i < data.data.length; i++) {
      const driver = data.data[i];
      const location = testLocations[i % testLocations.length];
      
      console.log(`📍 Updating ${driver.name} (${driver.busId}) → ${location.name}`);
      
      const locationData = {
        driverId: driver.driverId,
        busId: driver.busId,
        routeId: driver.routeId,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: Math.floor(Math.random() * 360),
        speed: 20 + Math.floor(Math.random() * 30), // 20-50 km/h
        accuracy: 5,
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
        
        const result = await updateResponse.json();
        
        if (result.success) {
          console.log(`   ✅ Success - Speed: ${locationData.speed} km/h, Heading: ${locationData.heading}°`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${result.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Results: ${successCount}/${data.data.length} drivers updated successfully`);
    
    // Check live buses
    console.log('\n🔍 Checking live buses...');
    const liveBusesResponse = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
    const liveBusesData = await liveBusesResponse.json();
    
    if (liveBusesData.success) {
      console.log(`🚌 Live buses available: ${liveBusesData.count}`);
      liveBusesData.data.forEach((bus, index) => {
        console.log(`   ${index + 1}. Bus ${bus.busId} (Route ${bus.routeId}) - ${bus.latitude.toFixed(4)}, ${bus.longitude.toFixed(4)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  }
}

console.log('⚡ Quick Location Test Tool');
console.log('===========================\n');

quickTest();