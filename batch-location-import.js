#!/usr/bin/env node

/**
 * Batch Location Import Tool
 * Import multiple bus locations from CSV or JSON file
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://192.168.204.176:5001';

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Sample data structure
const sampleLocations = [
  {
    driverId: 'driver_001',
    busId: 'bus_138_01',
    routeId: 'route_138',
    latitude: 6.9271,
    longitude: 79.8612,
    speed: 30,
    heading: 45,
    location_name: 'Colombo Fort'
  },
  {
    driverId: 'driver_002',
    busId: 'bus_177_01',
    routeId: 'route_177',
    latitude: 6.9147,
    longitude: 79.8731,
    speed: 25,
    heading: 90,
    location_name: 'Pettah Market'
  },
  {
    driverId: 'driver_003',
    busId: 'bus_245_01',
    routeId: 'route_245',
    latitude: 6.8649,
    longitude: 79.8997,
    speed: 35,
    heading: 180,
    location_name: 'Nugegoda Junction'
  }
];

async function createSampleFile() {
  const sampleJson = JSON.stringify(sampleLocations, null, 2);
  const sampleCsv = [
    'driverId,busId,routeId,latitude,longitude,speed,heading,location_name',
    ...sampleLocations.map(loc => 
      `${loc.driverId},${loc.busId},${loc.routeId},${loc.latitude},${loc.longitude},${loc.speed},${loc.heading},${loc.location_name}`
    )
  ].join('\n');
  
  fs.writeFileSync('sample-locations.json', sampleJson);
  fs.writeFileSync('sample-locations.csv', sampleCsv);
  
  console.log('📄 Created sample files:');
  console.log('   - sample-locations.json');
  console.log('   - sample-locations.csv');
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim();
    });
    return obj;
  });
}

function validateLocation(location) {
  const required = ['driverId', 'busId', 'routeId', 'latitude', 'longitude'];
  const missing = required.filter(field => !location[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  const lat = parseFloat(location.latitude);
  const lng = parseFloat(location.longitude);
  
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, error: 'Invalid latitude/longitude coordinates' };
  }
  
  return { valid: true };
}

async function updateSingleLocation(location) {
  try {
    const locationData = {
      driverId: location.driverId,
      busId: location.busId,
      routeId: location.routeId,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      heading: parseInt(location.heading) || 0,
      speed: parseInt(location.speed) || 25,
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
      return { success: true, message: 'Updated successfully' };
    } else {
      return { success: false, message: result.message || 'Update failed' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function importLocations(filePath) {
  try {
    console.log(`📂 Reading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found');
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileExt = path.extname(filePath).toLowerCase();
    
    let locations = [];
    
    if (fileExt === '.json') {
      locations = JSON.parse(fileContent);
    } else if (fileExt === '.csv') {
      locations = parseCSV(fileContent);
    } else {
      console.log('❌ Unsupported file format. Use .json or .csv');
      return;
    }
    
    console.log(`📊 Found ${locations.length} locations to import\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const locationName = location.location_name || `Location ${i + 1}`;
      
      console.log(`📍 Processing ${i + 1}/${locations.length}: ${locationName}`);
      console.log(`   Bus: ${location.busId} (${location.latitude}, ${location.longitude})`);
      
      // Validate location
      const validation = validateLocation(location);
      if (!validation.valid) {
        console.log(`   ❌ Validation failed: ${validation.error}`);
        errorCount++;
        continue;
      }
      
      // Update location
      const result = await updateSingleLocation(location);
      if (result.success) {
        console.log(`   ✅ ${result.message}`);
        successCount++;
      } else {
        console.log(`   ❌ ${result.message}`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📈 Total: ${locations.length}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

async function main() {
  console.log('📦 Batch Location Import Tool');
  console.log('==============================\n');
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node batch-location-import.js <file.json|file.csv>');
    console.log('  node batch-location-import.js --create-sample');
    console.log('\nExamples:');
    console.log('  node batch-location-import.js locations.json');
    console.log('  node batch-location-import.js locations.csv');
    console.log('  node batch-location-import.js --create-sample');
    return;
  }
  
  if (args[0] === '--create-sample') {
    await createSampleFile();
    console.log('\n💡 Edit these files with your bus locations and run:');
    console.log('   node batch-location-import.js sample-locations.json');
    return;
  }
  
  const filePath = args[0];
  await importLocations(filePath);
}

// Start the tool
main();