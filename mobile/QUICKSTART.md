# Quick Start Guide - Running BillBoard Mobile App

## Step 1: Install Dependencies

First, make sure you have Node.js installed (v16 or higher). Then install the app dependencies:

```bash
cd mobile
npm install
```

### Fix EMFILE Error (macOS)

If you encounter "EMFILE: too many open files" error, install Watchman:

```bash
# Using Homebrew
brew install watchman

# Or if you don't have Homebrew, install it first:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# brew install watchman
```

Alternatively, you can try clearing the Metro cache:
```bash
cd mobile
rm -rf node_modules/.cache
expo start -c
```

## Step 2: Configure API URL

Before running, you need to configure the API URL to point to your FastAPI backend.

Edit `src/config/api.ts` and update the `API_BASE_URL`:

**For iOS Simulator or macOS:**
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

**For Android Emulator:**
```typescript
const API_BASE_URL = 'http://10.0.2.2:8000';
```

**For Physical Device:**
1. Find your computer's IP address:
   - macOS/Linux: Run `ifconfig | grep "inet "` and look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)
   - Windows: Run `ipconfig` and look for IPv4 Address
2. Update the URL:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000';  // e.g., 'http://192.168.1.100:8000'
   ```

## Step 3: Install FastAPI Dependencies (if not already installed)

If you get an error about fastapi[standard] not being installed, run:

```bash
# From the project root (BillBoard directory)
pip install "fastapi[standard]" uvicorn
```

## Step 4: Start the FastAPI Backend

Open a new terminal and start your FastAPI server:

```bash
# From the project root (BillBoard directory)
fastapi dev app/main.py
```

**Alternative method** (if fastapi command doesn't work):
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API should be running at `http://localhost:8000`. Verify by visiting that URL in your browser.

## Step 5: Start the React Native App

In the `mobile` directory, start Expo:

```bash
cd mobile
npm install  # Make sure dependencies are installed
npm start
```

If you see version warnings, update packages:
```bash
npm install
npx expo install --fix
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code in the terminal

## Step 6: Run on Your Device/Simulator

### Option A: iOS Simulator (macOS only)
1. Make sure you have Xcode installed
2. Press `i` in the terminal where Expo is running
3. The iOS simulator will open and the app will load

### Option B: Android Emulator
1. Make sure you have Android Studio installed and an emulator running
2. Press `a` in the terminal where Expo is running
3. The app will load in the Android emulator

### Option C: Physical Device (Recommended for Testing)
1. Install **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure your phone and computer are on the same WiFi network

3. Scan the QR code:
   - **iOS**: Open the Camera app and scan the QR code
   - **Android**: Open the Expo Go app and tap "Scan QR code"

4. The app will load on your device

## Troubleshooting

### "EMFILE: too many open files" Error

This is a macOS file watching issue. Solutions:

1. **Install Watchman** (Recommended):
   ```bash
   brew install watchman
   ```

2. **Clear Metro cache and restart**:
   ```bash
   cd mobile
   rm -rf node_modules/.cache
   expo start -c
   ```

3. **Increase file descriptor limit** (if needed):
   ```bash
   ulimit -n 4096
   expo start
   ```

### "Cannot connect to API" Error

1. **Check FastAPI is running**: Open `http://localhost:8000` in your browser
2. **Verify API URL**: Make sure `src/config/api.ts` has the correct URL
3. **Physical device**: Ensure device and computer are on the same WiFi
4. **Firewall**: Allow connections on port 8000

### "Module not found" Errors

```bash
cd mobile
rm -rf node_modules
npm install
npx expo install --fix
expo start -c  # -c clears the cache
```

### App Not Loading

1. Press `r` in the terminal to reload
2. Or shake your device and select "Reload"
3. Clear cache: `expo start -c`

### Version Mismatch Warnings

If you see warnings about package versions:
```bash
cd mobile
npx expo install --fix
```

This will update packages to versions compatible with your Expo SDK.

### TypeScript Errors

Run type checking:
```bash
npm run type-check
```

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Fix package versions
npx expo install --fix

# Start the app
npm start

# Clear cache and start
expo start -c

# Run on iOS (macOS only)
npm run ios

# Run on Android
npm run android

# Type check
npm run type-check
```

## Testing the App

Once the app loads:

1. **Home Screen**: Enter a username (e.g., `su_victor21`) and search
2. **Profile Screen**: View user profiles with interests and demographics  
3. **Recommendations**: Browse personalized bill recommendations
4. **Bill Details**: Tap any bill card to see full details

Available test usernames (based on your profiles):
- `su_victor21`
- `arkhanlewis`
- `j29parma`
- `levspam23`
- `parth_desai`
- `pokhrelkripa`
- `sstirling1224`
