# BillBoard Mobile App Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Edit `src/config/api.ts` and update the `API_BASE_URL`:

- **macOS/iOS Simulator**: `http://localhost:8000`
- **Android Emulator**: `http://10.0.2.2:8000`
- **Physical Device**: `http://YOUR_COMPUTER_IP:8000` (e.g., `http://192.168.1.100:8000`)

To find your computer's IP address:
- **macOS/Linux**: Run `ifconfig | grep "inet "` and look for your local network IP
- **Windows**: Run `ipconfig` and look for IPv4 Address

### 3. Start FastAPI Backend

Make sure your FastAPI server is running:

```bash
# From the project root
cd ..
fastapi dev app/main.py
```

The API should be accessible at `http://localhost:8000`

### 4. Start React Native App

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app on your phone

## Testing the App

1. **Home Screen**: Enter a username (e.g., `su_victor21`) and search for recommendations
2. **Profile Screen**: View user profiles with interests and demographics
3. **Recommendations**: Browse personalized bill recommendations
4. **Bill Details**: Tap any bill card to see full details

## Available Usernames

Based on your profiles directory, you can use:
- `su_victor21`
- `arkhanlewis`
- `j29parma`
- `levspam23`
- `parth_desai`
- `pokhrelkripa`
- `sstirling1224`

## Troubleshooting

### "Network Error" or "Cannot connect to API"

1. **Check FastAPI is running**: Visit `http://localhost:8000` in your browser
2. **Check API URL**: Verify the URL in `src/config/api.js` matches your setup
3. **Physical device**: Ensure device and computer are on the same WiFi network
4. **Firewall**: Allow connections on port 8000

### "Module not found" errors

```bash
cd mobile
rm -rf node_modules
npm install
expo start -c
```

### App crashes on startup

Check that all dependencies are installed:
```bash
npm install
```

If using Expo Go, make sure you have the latest version installed from the app store.

## Development Tips

- Use Expo Dev Tools: Press `j` in the terminal to open developer menu
- Hot reloading is enabled by default
- Check console logs in the terminal or browser DevTools
- To reload: Press `r` in terminal or shake device and select "Reload"

## Building for Production

See the [Expo documentation](https://docs.expo.dev/build/introduction/) for building standalone apps.

