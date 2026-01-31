# APK Build and Deployment Guide

## Current Status ✅
Your app configuration is properly set up for APK builds. All critical files and dependencies are in place.

## Recent Fixes Applied

### 1. Enhanced Error Handling
- ✅ Added `ErrorBoundary` component to catch and handle crashes
- ✅ Updated splash screen with better initialization handling
- ✅ Added production-ready environment configuration

### 2. Configuration Updates
- ✅ Added `INTERNET` and `ACCESS_NETWORK_STATE` permissions
- ✅ Configured proper runtime version and updates policy
- ✅ Centralized environment configuration in `lib/config/environment.ts`

### 3. API Configuration
- ✅ Fixed duplicate `/api/api/routes` issue
- ✅ Proper development vs production URL handling
- ✅ Hardcoded configuration for production builds

## Building APK

### Option 1: EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### Option 2: Expo Build (Legacy)
```bash
# Build APK
expo build:android -t apk

# Check build status
expo build:status
```

## Testing APK

### 1. Install on Device
```bash
# Install via ADB
adb install your-app.apk

# Or transfer APK to device and install manually
```

### 2. Debug APK Issues
```bash
# Check Android logs
adb logcat | grep -i "translink\|expo\|react"

# Clear app data if needed
adb shell pm clear com.translink.app
```

## Common APK Issues and Solutions

### Issue 1: App Crashes on Startup
**Solution**: Check `adb logcat` for error messages. Common causes:
- Missing permissions
- Network connectivity issues
- Firebase configuration problems

### Issue 2: White Screen/Splash Screen Stuck
**Solution**: 
- ✅ Already fixed with enhanced splash screen
- Check if AsyncStorage is accessible
- Verify API connectivity

### Issue 3: Maps Not Loading
**Solution**:
- ✅ Google Maps API key is configured
- Ensure device has internet connection
- Check if location permissions are granted

### Issue 4: API Calls Failing
**Solution**:
- ✅ Production API URL is configured
- Verify backend server is accessible
- Check network permissions

## Environment Variables in APK

⚠️ **Important**: Environment variables from `.env` are NOT available in built APKs.

✅ **Fixed**: All configuration is now hardcoded in `lib/config/environment.ts`:
- API URLs (dev vs production)
- Google Maps API key
- Firebase configuration

## Pre-Build Checklist

- ✅ All dependencies installed
- ✅ Google Maps API key configured
- ✅ Firebase configuration set
- ✅ Permissions properly configured
- ✅ Error boundaries in place
- ✅ Production API URLs configured
- ✅ No localhost references in production code

## Build Commands

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test locally first
npx expo start

# Build APK
eas build --platform android --profile preview

# Or for production
eas build --platform android --profile production
```

## Troubleshooting

### If APK still doesn't open:

1. **Check device compatibility**:
   - Android 5.0+ (API level 21+)
   - Sufficient storage space
   - Allow installation from unknown sources

2. **Debug with logs**:
   ```bash
   adb logcat -c  # Clear logs
   # Install and launch app
   adb logcat | grep -E "(TransLink|Expo|React|Error|Exception)"
   ```

3. **Test on different devices**:
   - Different Android versions
   - Different manufacturers
   - Emulator vs real device

4. **Verify build configuration**:
   ```bash
   # Check if build completed successfully
   eas build:list
   
   # Download and test APK
   eas build:download [build-id]
   ```

## Next Steps

1. Build APK using EAS Build
2. Test on multiple devices
3. Check logs for any remaining issues
4. Deploy to Google Play Store (optional)

Your app is now properly configured for APK builds with comprehensive error handling and production-ready configuration! 🚀