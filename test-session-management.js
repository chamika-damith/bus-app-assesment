/**
 * Test script for enhanced driver authentication and session management
 * This script tests the new session management features implemented in task 2
 */

const { gpsService } = require('./BusTracking-Backend/services/gpsService');

async function testSessionManagement() {
  console.log('🧪 Testing Enhanced Driver Authentication and Session Management\n');

  // Test 1: Driver Authentication with Device ID Validation
  console.log('1️⃣ Testing driver authentication with device ID validation...');
  
  const phone = '+94771234567'; // Mock driver phone
  const deviceId = 'device_android_001'; // Mock device ID
  
  const driverSession = gpsService.authenticateDriver(phone, deviceId);
  
  if (driverSession && driverSession.sessionId) {
    console.log('✅ Driver authenticated successfully');
    console.log(`   Session ID: ${driverSession.sessionId}`);
    console.log(`   Driver ID: ${driverSession.driverId}`);
    console.log(`   Bus ID: ${driverSession.busId}`);
    console.log(`   Route ID: ${driverSession.routeId}`);
    console.log(`   Session expires at: ${new Date(driverSession.sessionExpiresAt).toISOString()}`);
  } else {
    console.log('❌ Driver authentication failed');
    return;
  }

  // Test 2: Session Validation
  console.log('\n2️⃣ Testing session validation...');
  
  const isValidSession = gpsService.validateSession(driverSession.sessionId);
  
  if (isValidSession) {
    console.log('✅ Session validation successful');
  } else {
    console.log('❌ Session validation failed');
  }

  // Test 3: Location Update with Session Validation
  console.log('\n3️⃣ Testing location update with session validation...');
  
  const locationData = {
    busId: driverSession.busId,
    routeId: driverSession.routeId,
    latitude: 6.9271,
    longitude: 79.8612,
    heading: 45,
    speed: 30,
    accuracy: 10,
    status: 'active'
  };
  
  const locationUpdateSuccess = gpsService.updateLocation(
    driverSession.driverId, 
    locationData, 
    driverSession.sessionId
  );
  
  if (locationUpdateSuccess) {
    console.log('✅ Location update with session validation successful');
  } else {
    console.log('❌ Location update with session validation failed');
  }

  // Test 4: Session State Management
  console.log('\n4️⃣ Testing session state management...');
  
  const activeSessions = gpsService.getActiveSessions();
  console.log(`   Active sessions count: ${activeSessions.length}`);
  
  const sessionStats = gpsService.getSessionStats();
  console.log(`   Total active sessions: ${sessionStats.totalActiveSessions}`);
  console.log(`   Average session duration: ${Math.round(sessionStats.averageSessionDuration / 1000)}s`);

  // Test 5: Session Expiration Handling
  console.log('\n5️⃣ Testing session expiration handling...');
  
  // Get the session to check expiration
  const session = gpsService.getDriverSession(driverSession.driverId);
  if (session) {
    const isExpired = gpsService.isSessionExpired(session);
    console.log(`   Session expired: ${isExpired}`);
    console.log(`   Session expires at: ${new Date(session.expiresAt).toISOString()}`);
  }

  // Test 6: Device ID Validation
  console.log('\n6️⃣ Testing device ID validation...');
  
  // Try to authenticate with wrong device ID
  const wrongDeviceAuth = gpsService.authenticateDriver(phone, 'wrong_device_id');
  
  if (!wrongDeviceAuth) {
    console.log('✅ Device ID validation working - rejected wrong device ID');
  } else {
    console.log('❌ Device ID validation failed - accepted wrong device ID');
  }

  // Test 7: Session End
  console.log('\n7️⃣ Testing session termination...');
  
  const sessionEnded = gpsService.endSession(driverSession.sessionId);
  
  if (sessionEnded) {
    console.log('✅ Session ended successfully');
    
    // Verify session is no longer valid
    const isStillValid = gpsService.validateSession(driverSession.sessionId);
    if (!isStillValid) {
      console.log('✅ Session properly invalidated after termination');
    } else {
      console.log('❌ Session still valid after termination');
    }
  } else {
    console.log('❌ Session termination failed');
  }

  console.log('\n🎉 Session management testing completed!');
}

// Run the test
testSessionManagement().catch(console.error);