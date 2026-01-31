// Debug script for APK-specific issues
const fs = require('fs');
const path = require('path');

console.log('=== APK Debug Analysis ===\n');

// Check critical files for APK builds
const criticalFiles = [
  'app.json',
  'package.json',
  'metro.config.js',
  'babel.config.js',
  'app/_layout.tsx',
  'app/index.tsx',
  'app/splash.tsx',
  'lib/config/environment.ts',
  'components/ErrorBoundary.tsx'
];

console.log('1. Checking critical files:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check app.json configuration
console.log('\n2. Analyzing app.json configuration:');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = appJson.expo;
  
  console.log(`✅ App name: ${expo.name}`);
  console.log(`✅ Version: ${expo.version}`);
  console.log(`✅ Package: ${expo.android?.package || 'NOT SET'}`);
  
  // Check permissions
  const permissions = expo.android?.permissions || [];
  console.log(`✅ Permissions: ${permissions.length} configured`);
  permissions.forEach(perm => console.log(`   - ${perm}`));
  
  // Check plugins
  const plugins = expo.plugins || [];
  console.log(`✅ Plugins: ${plugins.length} configured`);
  
  // Check for potential issues
  if (!expo.android?.package) {
    console.log('⚠️  WARNING: Android package not set');
  }
  
  if (!expo.android?.config?.googleMaps?.apiKey) {
    console.log('⚠️  WARNING: Google Maps API key not configured for Android');
  }
  
} catch (error) {
  console.log('❌ Error reading app.json:', error.message);
}

// Check package.json dependencies
console.log('\n3. Checking package.json dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const criticalDeps = [
    'expo',
    'expo-router',
    'react-native',
    'react-native-maps',
    '@react-native-async-storage/async-storage',
    'expo-location',
    'firebase'
  ];
  
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    if (version) {
      console.log(`✅ ${dep}: ${version}`);
    } else {
      console.log(`❌ ${dep}: NOT FOUND`);
    }
  });
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check for common APK issues
console.log('\n4. Common APK Issues Check:');

// Check for hardcoded localhost URLs
const filesToCheck = [
  'lib/api/config.ts',
  'lib/config/environment.ts',
  'app/passenger/map.tsx',
  'lib/services/websocket-service.ts'
];

let hasLocalhostIssues = false;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('localhost') || content.includes('127.0.0.1') || content.includes('192.168.')) {
      console.log(`⚠️  ${file} contains localhost/local IP references`);
      hasLocalhostIssues = true;
    }
  }
});

if (!hasLocalhostIssues) {
  console.log('✅ No localhost references found in critical files');
}

// Check environment configuration
console.log('\n5. Environment Configuration:');
if (fs.existsSync('lib/config/environment.ts')) {
  const envContent = fs.readFileSync('lib/config/environment.ts', 'utf8');
  
  if (envContent.includes('__DEV__')) {
    console.log('✅ Environment has development/production detection');
  }
  
  if (envContent.includes('bustracking-backend-ehnq.onrender.com')) {
    console.log('✅ Production API URL configured');
  }
  
  if (envContent.includes('AIzaSy')) {
    console.log('✅ Google Maps API key configured');
  }
} else {
  console.log('❌ Environment configuration file missing');
}

// Recommendations
console.log('\n6. APK Build Recommendations:');
console.log('📋 To fix APK startup issues:');
console.log('   1. Ensure all environment variables are hardcoded for production');
console.log('   2. Add proper error boundaries and error handling');
console.log('   3. Test with "expo build:android" or EAS Build');
console.log('   4. Check Android logs with "adb logcat" for crash details');
console.log('   5. Verify all permissions are properly configured');
console.log('   6. Test on different Android versions and devices');

console.log('\n=== Debug Complete ===');