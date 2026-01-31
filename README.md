# TransLink - Smart Bus Tracking App

A comprehensive bus tracking application built with React Native and Expo, featuring real-time bus tracking, route planning, and crowd reporting for passengers and drivers in Sri Lanka.

## Features

### 🚌 Multi-Role Support
- **Passengers**: Track buses in real-time, find routes, report crowd levels
- **Drivers**: Automatic location tracking, route management, trip history

### 📱 Core Functionality
- Real-time bus location tracking
- Smart route planning and suggestions
- Crowd level reporting and visualization
- Offline mode with cached data
- Multi-language support (English, Sinhala, Tamil)
- Dual UI modes (Simple/Modern) for accessibility

### 🛠 Tech Stack
- **Frontend**: React Native, Expo Router, TypeScript
- **State Management**: Zustand, React Query
- **Backend**: tRPC, Hono (planned)
- **Maps**: Google Maps SDK
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Bun (recommended) or npm/yarn
- Expo CLI
- iOS Simulator or Android Emulator (for mobile testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd translink-app
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run start
```

4. Open the app:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your device

## Project Structure

```
├── app/                    # App screens and routing
│   ├── auth/              # Authentication flow
│   │   ├── simple.tsx     # Get started screen
│   │   ├── login.tsx      # Login screen
│   │   ├── register.tsx   # Registration screen
│   │   ├── ui-preference.tsx
│   │   └── route-selection.tsx
│   ├── driver/            # Driver dashboard screens
│   ├── passenger/         # Passenger screens
│   │   ├── search.tsx
│   │   ├── map.tsx
│   │   ├── routes-buses.tsx
│   │   └── bus-tracking.tsx
│   ├── splash.tsx         # Splash screen
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # App entry point
├── components/            # Reusable UI components
├── constants/             # App constants (colors, etc.)
├── context/               # React contexts
├── lib/                   # Utilities and configurations
└── assets/                # Images and static assets
```

## Demo Credentials

For testing purposes, use these demo credentials:

- **Driver**: driver@demo.com / password  
- **Passenger**: passenger@demo.com / password

## Key Features by Role

### Passenger Features
- **Smart Search**: Find destinations with autocomplete and voice search
- **Real-time Tracking**: Track buses live on map with arrival predictions
- **Route Planning**: Get best routes with multiple options
- **Crowd Reporting**: Report and view bus crowd levels
- **Offline Mode**: Access cached routes and predictions offline
- **UI Modes**: Choose between Simple (accessibility) and Modern interfaces

### Driver Features
- **Automatic Tracking**: Location shared automatically during shifts
- **Route Management**: View assigned route with all stops
- **Trip History**: Detailed logs of completed trips
- **Performance Stats**: Daily/weekly driving statistics

## App Flow

### Authentication Flow
1. **Splash Screen** (3s) → Auto-detects language and theme
2. **Welcome Screen** → Google Sign-in with language selection
3. **Role Selection** → Choose Passenger or Driver
4. **UI Preference** (Passengers) → Simple vs Modern mode
5. **Route Selection** (Drivers) → Assign driving route

### Passenger Flow
- **Home** → Search destinations or quick actions
- **Search** → Find destinations with categories and voice
- **Map** → Pin locations or browse live buses
- **Routes & Buses** → View available routes with live times
- **Bus Tracking** → Real-time bus location and arrival

### Driver Flow
- **Home** → Route info and automatic tracking status
- **Route View** → Full route map with all stops
- **History** → Past trips and performance data

## Technical Features

### Performance Targets
- App launch: < 3 seconds
- API response: < 2 seconds
- Map load: < 5 seconds
- 60 FPS smooth animations

### Accessibility
- High contrast mode support
- Screen reader compatibility
- Minimum 48dp touch targets
- Voice command search
- Text scaling support
- Color blind friendly design

### Offline Capabilities
- SQLite local storage
- Cached routes and predictions
- Recent searches stored locally
- Background sync when online

## Development

### Available Scripts
- `bun run start` - Start development server
- `bun run start-web` - Start web development server
- `bun run lint` - Run ESLint

### Environment Variables
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_API_URL=http://localhost:3000/trpc
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@translink.lk or create an issue in the repository.