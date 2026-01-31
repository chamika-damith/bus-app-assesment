// Debug script to identify app startup issues
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('=== App Startup Debug ===');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'undefined');
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET');

// Check file structure
console.log('\nChecking file structure...');
const criticalPaths = [
  'lib/api/config.ts',
  'lib/firebase/config.ts',
  'app.json',
  'package.json',
  '.env',
  'app/_layout.tsx',
  'app/index.tsx'
];

criticalPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log('✅', filePath, 'exists');
  } else {
    console.log('❌', filePath, 'missing');
  }
});

// Check package.json dependencies
console.log('\nChecking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json loaded successfully');
  console.log('App name:', packageJson.name);
  console.log('Version:', packageJson.version);
  
  const criticalDeps = [
    'expo',
    'expo-router',
    'react-native',
    '@react-native-async-storage/async-storage',
    'react-native-maps'
  ];
  
  console.log('\nCritical dependencies:');
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    if (version) {
      console.log('✅', dep, ':', version);
    } else {
      console.log('❌', dep, ': NOT FOUND');
    }
  });
  
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Test Node.js compatible modules
console.log('\nTesting Node.js compatible modules...');

try {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  console.log('✅ AsyncStorage imported successfully');
} catch (error) {
  console.error('❌ AsyncStorage import error:', error.message);
}

// Check if we can read TypeScript config files as text
console.log('\nChecking TypeScript config files...');
try {
  const apiConfigContent = fs.readFileSync('lib/api/config.ts', 'utf8');
  if (apiConfigContent.includes('BASE_URL')) {
    console.log('✅ API config file contains BASE_URL');
    // Extract BASE_URL value
    const baseUrlMatch = apiConfigContent.match(/BASE_URL:\s*.*?'([^']+)'/);
    if (baseUrlMatch) {
      console.log('   Default BASE_URL:', baseUrlMatch[1]);
    }
  }
} catch (error) {
  console.error('❌ Error reading API config:', error.message);
}

try {
  const firebaseConfigContent = fs.readFileSync('lib/firebase/config.ts', 'utf8');
  if (firebaseConfigContent.includes('apiKey')) {
    console.log('✅ Firebase config file contains apiKey');
  }
} catch (error) {
  console.error('❌ Error reading Firebase config:', error.message);
}

console.log('\n=== Debug Complete ===');