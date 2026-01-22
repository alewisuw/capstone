# BillBoard Mobile App

A React Native cross-platform mobile application (built with TypeScript) for discovering and viewing personalized bill recommendations.

## Features

- 🏠 **Home Screen**: Search for bill recommendations by username
- 📋 **Recommendations**: View personalized bill recommendations
- 👤 **Profile**: View user profiles with interests and demographics
- 📄 **Bill Details**: Detailed view of individual bills

## Prerequisites

- Node.js (v16 or higher)
- npm
- For iOS: Xcode (macOS only)
- For Android: Android Studio + Android SDK
- Java 17 (set `JAVA_HOME`, e.g., `/usr/lib/jvm/java-17-openjdk-amd64`)

## Installation (SDK 50)

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies (Expo SDK 50):
```bash
npm install
```

## Configuration

Before running the app, update the API base URL in `src/config/api.ts`:

- **Local development**: `http://localhost:8000`
- **Android Emulator**: `http://10.0.2.2:8000`
- **iOS Simulator**: `http://localhost:8000`
- **Physical Device**: Replace with your computer's IP address (e.g., `http://192.168.1.100:8000`)

Make sure your FastAPI backend is running and accessible at the configured URL.

## Running the App (Android Emulator)

### Option A: Expo Go (QR code)
1. Start the dev server:
```bash
npm start
```
2. Press `a` to open the Android emulator or scan the QR code with Expo Go on a device.

### Option B: Dev Client (native build)
Use this if you need native modules/plugins:
```bash
npx expo run:android
```
Then in another terminal:
```bash
npx expo start --dev-client
```

If you see API connection errors in the app, set `EXPO_PUBLIC_API_BASE_URL` before launching:
```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000 npm run android
```

## Notes

- This project is pinned to **Expo SDK 50** (`expo@~50.0.0`).
- If you are prompted to upgrade to SDK 54, do not accept unless you plan to migrate dependencies.

## Project Structure

```
mobile/
├── App.tsx               # Main app entry point with navigation
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── screens/         # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── RecommendationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── BillDetailScreen.tsx
│   ├── components/      # Reusable components
│   │   ├── BillCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── services/        # API service layer
│   │   └── apiService.ts
│   └── config/          # Configuration
│       └── api.ts
└── package.json
```

## API Endpoints

The app uses the following FastAPI endpoints:

- `GET /api/profiles` - List all available profiles
- `GET /api/profiles/{username}` - Get a specific user profile
- `GET /api/recommendations/{username}` - Get bill recommendations for a user

## Troubleshooting

### Connection Issues

If you can't connect to the API:
1. Make sure the FastAPI server is running
2. Check the API base URL in `src/config/api.ts`
3. For physical devices, ensure both device and computer are on the same network
4. Check firewall settings

### Build Issues

If you encounter build errors:
1. Clear cache: `expo start -c`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Reset Metro bundler cache
4. Ensure `JAVA_HOME` points to Java 17 and the Android SDK is installed

## Development

The app uses:
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo** for development and building
- **Axios** for API requests
- **React Native Reanimated** for animations

### Type Checking

Run TypeScript type checking:
```bash
npm run type-check
```

## License

See the main project LICENSE file.
