#!/usr/bin/env node

/**
 * Simulate Real-Time GPS Tracking
 * Continuously updates driver locations to simulate real-time bus movement
 */

const API_BASE_URL = 'http://192.168.204.176:5000';

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Base locations around Colombo, Sri Lanka
const baseLocations = [
  { latitude: 6.9271, longitude: 79.8612, name: 'Colombo Fort' },
  { latitude: 6.9147, longitude: 79.8731, name: 'Pettah' },
  { latitude: 6.8649, longitude: 79.8997, name: 'Nugegoda' },
];

let drivers = [];
let isRunning = false;

async function initializeDrivers() {
  try {
    console.log('🚌 Initializing Real-Time GPS Simulation\n');
    
    const response = await fetch(`${API_BASE_URL}/api/gps/admin/drivers`);
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      drivers = data.data.map((driver, index) => ({
        ...driver,
        baseLocation: baseLocations[index % baseLocations.length],
        currentLat: baseLocations[index % baseLocations.length].latitude,
        currentLng: baseLocations[index % baseLocations.length].longitude,
        direction: Math.random() * 360, // Random initial direction
        speed: 20 + Math.random() * 40, // 20-60 km/h
      }));
      
      console.log(`✅ Initialized ${drivers.length} drivers for simulation`);
      drivers.forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.name} (${driver.driverId}) - Bus ${driver.busId}`);
      });
      
      return true;
    } else {
      console.log('❌ No drivers found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize drivers:', error.message);
    return false;
  }
}

function simulateMovement(driver) {
  // Simulate realistic bus movement
  const speedKmh = driver.speed;
  const speedMs = speedKmh / 3.6; // Convert km/h to m/s
  const timeInterval = 30; // 30 seconds
  const distanceM = speedMs * timeInterval; // Distance in meters
  
  // Convert distance to lat/lng (rough approximation)
  const latChange = (distanceM / 111000) * Math.cos(driver.direction * Math.PI / 180);
  const lngChange = (distanceM / (111000 * Math.cos(driver.currentLat * Math.PI / 180))) * Math.sin(driver.direction * Math.PI / 180);
  
  // Update position
  driver.currentLat += latChange;
  driver.currentLng += lngChange;
  
  // Occasionally change direction (simulate turns)
  if (Math.random() < 0.1) {
    driver.direction += (Math.random() - 0.5) * 60; // Turn up to 30 degrees
    driver.direction = driver.direction % 360;
  }
  
  // Occasionally change speed
  if (Math.random() < 0.2) {
    driver.speed = Math.max(10, Math.min(60, driver.speed + (Math.random() - 0.5) * 20));
  }
  
  // Keep within reasonable bounds (around Colombo area)
  if (driver.currentLat < 6.8 || driver.currentLat > 7.0) {
    driver.direction = 180 - driver.direction; // Reverse direction
  }
  if (driver.currentLng < 79.8 || driver.currentLng > 80.0) {
    driver.direction = -driver.direction; // Reverse direction
  }
}

async function updateDriverLocation(driver) {
  try {
    const locationData = {
      driverId: driver.driverId,
      busId: driver.busId,
      routeId: driver.routeId,
      latitude: driver.currentLat,
      longitude: driver.currentLng,
      heading: Math.round(driver.direction),
      speed: Math.round(driver.speed),
      accuracy: 5,
      status: 'active'
    };

    const response = await fetch(`${API_BASE_URL}/api/gps/driver/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });

    const result = await response.json();
    
    if (result.success) {
      return true;
    } else {
      console.log(`❌ Failed to update ${driver.name}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating ${driver.name}: ${error.message}`);
    return false;
  }
}

async function simulationLoop() {
  if (!isRunning) return;
  
  console.log(`\n📍 Updating GPS locations... (${new Date().toLocaleTimeString()})`);
  
  let successCount = 0;
  
  for (const driver of drivers) {
    // Simulate movement
    simulateMovement(driver);
    
    // Update location in backend
    const success = await updateDriverLocation(driver);
    if (success) {
      successCount++;
      console.log(`   ✅ ${driver.name}: (${driver.currentLat.toFixed(4)}, ${driver.currentLng.toFixed(4)}) - ${Math.round(driver.speed)} km/h`);
    }
  }
  
  console.log(`📊 Updated ${successCount}/${drivers.length} drivers successfully`);
  
  // Check live buses count
  try {
    const response = await fetch(`${API_BASE_URL}/api/gps/buses/live`);
    const data = await response.json();
    console.log(`🚌 Live buses available: ${data.count}`);
  } catch (error) {
    console.log(`⚠️  Could not check live buses: ${error.message}`);
  }
  
  // Schedule next update
  setTimeout(simulationLoop, 30000); // Update every 30 seconds
}

async function startSimulation() {
  const initialized = await initializeDrivers();
  if (!initialized) {
    console.log('❌ Cannot start simulation without drivers');
    process.exit(1);
  }
  
  isRunning = true;
  console.log('\n🚀 Starting real-time GPS simulation...');
  console.log('📍 Updating locations every 30 seconds');
  console.log('⏹️  Press Ctrl+C to stop\n');
  
  // Start the simulation loop
  simulationLoop();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping GPS simulation...');
  isRunning = false;
  console.log('✅ GPS simulation stopped');
  process.exit(0);
});

// Start the simulation
startSimulation();