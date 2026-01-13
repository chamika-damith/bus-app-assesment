# Firebase Google Authentication Setup

## Prerequisites
✅ Firebase and Google Sign-In packages installed

## Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name: `translink-app`
4. Follow the setup wizard

### 2. Enable Google Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Click **Enable**
4. Enter your project support email
5. Click **Save**

### 3. Get Firebase Configuration
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web** icon (</>) to add a web app
4. Register app with nickname: `TransLink Web`
5. Copy the Firebase configuration object

### 4. Update Firebase Config
Replace the placeholder config in `/lib/firebase/config.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 5. Configure OAuth Consent Screen (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - App name: `TransLink`
   - User support email: your email
   - Developer contact: your email
5. Add scopes: `email`, `profile`
6. Add test users if in development mode

### 6. Configure Authorized Domains
In Firebase Console → Authentication → Settings → Authorized domains:
- Add your production domain
- localhost is pre-authorized for development

## How It Works

### Google Sign-In Flow:
1. User clicks "Continue with Google"
2. Google account picker appears
3. User selects Google account
4. Firebase authenticates the user
5. App checks if user exists in backend
6. If **new user**: Auto-registers as **PASSENGER**
7. If **existing user**: Logs in directly
8. Redirects to passenger dashboard

### Auto-Registration as Passenger:
- All Google sign-ins default to PASSENGER role
- User data extracted from Google:
  - Email
  - Display name
  - Profile photo URL
  - Unique ID (UID)
- Creates account in your backend
- No password needed (Firebase handles auth)

## Features Implemented

✅ **Firebase Google Authentication**
✅ **Account picker for Google accounts**
✅ **Auto-register new users as PASSENGER**
✅ **Automatic login for existing users**
✅ **Error handling with user-friendly messages**
✅ **Loading states during authentication**
✅ **Direct navigation to passenger dashboard**
✅ **Secure token management**

## Testing

### Web Testing:
```bash
npm run web
```
- Navigate to auth screen
- Click "Continue with Google"
- Select Google account
- Should auto-register and redirect to passenger home

### Common Issues:

**Pop-up Blocked:**
- Allow pop-ups in browser settings
- App shows appropriate error message

**Authentication Error:**
- Check Firebase config is correct
- Verify Google provider is enabled
- Check authorized domains

**Network Error:**
- Check internet connection
- Verify Firebase project is active

## Security Notes

- Firebase handles all OAuth security
- ID tokens are used for backend verification
- No passwords stored for Google users
- Tokens automatically refresh
- Secure session management

## Next Steps

1. Update Firebase config with your credentials
2. Test Google sign-in flow
3. Verify auto-registration works
4. Test on different devices/browsers
5. Add additional OAuth providers if needed (Apple, Facebook)

## File Locations

- Firebase config: `/lib/firebase/config.ts`
- Auth context: `/context/AuthContext.tsx`
- Login screen: `/app/auth/index.tsx`
