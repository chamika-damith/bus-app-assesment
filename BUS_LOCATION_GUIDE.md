# Bus Location Tracking Guide

## System Overview

Your bus tracking system has **4 different ways** to add and manage bus locations:

### 🏗️ System Architecture
```
Driver Registration → Location Updates → Live Bus Data → Passenger App
```

## Method 1: 🎯 Manual Location Entry (Interactive)

**Use Case:** Quick testing, manual positioning, demo purposes

```bash
node manual-location-update.js
```

**Features:**
- Interactive command-line interface
- Predefined Colombo locations (Fort, Pettah, Nugegoda, etc.)
- Custom coordinate entry
- Speed and heading configuration
- Real-time validation

**Steps:**
1. Select a registered driver
2. Choose location (predefined or custom coordinates)
3. Set speed and heading (optional)
4. Location is instantly updated

---

## Method 2: 📦 Batch Import (CSV/JSON)

**Use Case:** Importing multiple locations, route planning, bulk updates

### Create Sample Files:
```bash
node batch-location-import.js --create-sample
```

### Import Locations:
```bash
node batch-location-import.js sample-locations.json
# or
node batch-location-import.js sample-locations.csv
```

**JSON Format:**
```json
[
  {
    "driverId": "driver_001",
    "busId": "bus_138_01",
    "routeId": "route_138",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "speed": 30,
    "heading": 45,
    "location_name": "Colombo Fort"
  }
]
```

**CSV Format:**
```csv
driverId,busId,routeId,latitude,longitude,speed,heading,location_name
driver_001,bus_138_01,route_138,6.9271,79.8612,30,45,Colombo Fort
```

---

## Method 3: ⚡ Quick Test (Instant Setup)

**Use Case:** Instant demo data, testing, development

```bash
node quick-location-test.js
```

**What it does:**
- Automatically assigns test locations to all registered drivers
- Uses predefined Colombo area coordinates
- Random speed (20-50 km/h) and heading
- Instant results

---

## Method 4: 🔄 Real-time Simulation (Continuous)

**Use Case:** Live demo, realistic movement simulation, testing passenger features

```bash
node simulate-real-time-gps.js
```

**Features:**
- Continuous GPS updates every 30 seconds
- Realistic bus movement patterns
- Speed and direction changes
- Automatic boundary management
- Real-time status monitoring

---

## 🛠️ API Endpoints

### Update Location (Manual/Programmatic)
```bash
POST /api/gps/driver/location
Content-Type: application/json

{
  "driverId": "driver_001",
  "busId": "bus_138_01",
  "routeId": "route_138",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "heading": 45,
  "speed": 30,
  "accuracy": 5,
  "status": "active"
}
```

### Get Live Buses (Passenger App)
```bash
GET /api/gps/buses/live
```

### Get Specific Bus Location
```bash
GET /api/gps/bus/{busId}/location
```

---

## 📱 Mobile App Integration

Your React Native app automatically fetches live buses using:

```typescript
// In your passenger screens
const liveBuses = await apiClient.getLiveBuses();
```

**Auto-refresh:** Every 30 seconds in passenger screens

---

## 🗺️ Coordinate Systems

### Colombo Area Coordinates:
- **Colombo Fort:** 6.9271, 79.8612
- **Pettah Market:** 6.9147, 79.8731
- **Nugegoda Junction:** 6.8649, 79.8997
- **Mount Lavinia:** 6.8344, 79.8640
- **Dehiwala:** 6.8518, 79.8638

### Validation Rules:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Speed: 0-100 km/h (recommended)
- Heading: 0-360 degrees
- Accuracy: ≥ 0 meters

---

## 🚀 Quick Start Workflow

### For Testing/Demo:
1. **Start Backend:** `cd BusTracking-Backend && npm start`
2. **Add Test Data:** `node quick-location-test.js`
3. **Start Mobile App:** Your React Native app will now show live buses

### For Development:
1. **Manual Testing:** `node manual-location-update.js`
2. **Batch Import:** Create CSV/JSON → `node batch-location-import.js file.csv`
3. **Live Simulation:** `node simulate-real-time-gps.js`

### For Production:
- Use real GPS data from driver mobile apps
- Implement automatic location updates from driver devices
- Set up proper authentication and validation

---

## 🔧 Troubleshooting

### "Network request failed" Error:
✅ **FIXED:** Port configuration corrected (5001)
- Backend runs on: `http://192.168.204.176:5001`
- Frontend configured correctly in `.env`

### No Live Buses Showing:
1. Check if drivers are registered: `GET /api/gps/admin/drivers`
2. Add test locations: `node quick-location-test.js`
3. Verify API connection: `curl http://192.168.204.176:5001/api/gps/buses/live`

### Location Not Updating:
1. Verify driverId exists
2. Check coordinate format (decimal degrees)
3. Ensure backend is running
4. Check network connectivity

---

## 📊 System Status

**Current Status:** ✅ Fully Operational
- **Registered Drivers:** 3 active
- **Live Buses:** 3 available
- **API Endpoints:** All working
- **Mobile Integration:** Connected
- **Real-time Updates:** Functional

**Available Tools:**
- ✅ Manual location entry
- ✅ Batch import (CSV/JSON)
- ✅ Quick test setup
- ✅ Real-time simulation
- ✅ API testing scripts

Your bus tracking system is now fully functional with multiple ways to manage bus locations!