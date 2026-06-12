# FridgeTrack

A smart, privacy-focused food inventory manager for households. Track everything in your fridge, freezer, and pantry. Get alerts when items are running low or unused. Generate smart shopping lists that can be easily shared, exported, and imported.

## Features

- **Dashboard** — Overview of total items, low stock, out of stock, unused items, and expiring soon
- **Storage Sections** — Organize items into Fridge, Freezer, and Pantry
- **Quick Quantity Controls** — Adjust quantities directly from the list with +/- buttons
- **Smart Shopping List** — Auto-generated when stock runs low, groupable and shareable
- **Unused Item Reminders** — Get reminded when items haven't been used after a set number of days
- **Expiry Alerts** — Visual warnings for items expiring within 7 days, 3 days, or expired
- **Multi-Language** — English, Arabic (with full RTL support), and French
- **Dark/Light Mode** — Toggle between themes
- **Full Offline-First** — All data stored locally, no cloud, no account needed
- **Export/Import** — Backup and restore your inventory as PDF, TXT, or JSON
- **Share** — Share shopping lists via text (WhatsApp/Telegram), PDF, or JSON
- **Push Notifications** — Daily morning summary of inventory status

## Tech Stack

- React + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion animations
- localStorage for persistence
- Capacitor.js for Android
- jsPDF for PDF generation

## Build from Source

### Prerequisites

- Node.js 20+
- npm
- Java 17 (for Android build)
- Android SDK (for local Android builds)

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build Android APK via GitHub Actions

1. **Create a new GitHub repository**
   - Go to https://github.com/new
   - Name it `fridgetrack` (or any name you prefer)
   - Make it public or private

2. **Push all project files to the main branch**
   ```bash
   git init
   git add .
   git commit -m "Initial FridgeTrack commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fridgetrack.git
   git push -u origin main
   ```

3. **Go to the Actions tab** — the workflow starts automatically on push

4. **Wait for "Build FridgeTrack Android APK" to complete** (5–10 minutes)

5. **Click the completed run**

6. **Download the artifacts:**
   - `FridgeTrack-debug-APK` — Debug build (recommended for testing)
   - `FridgeTrack-release-APK` — Release build (unsigned)

7. **Extract the zip** to get the APK file

8. **Transfer the APK to your Android device**
   - Use USB cable, Bluetooth, cloud storage, or email

9. **Install on your Android device:**
   - Go to **Settings > Security**
   - Enable **"Install from unknown sources"** or **"Install unknown apps"**
   - Open the APK file on your device and install it

### Manual Android Build

```bash
# Build the web app
npm run build

# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Sync Android project
npx cap sync android

# Build debug APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Android Permissions

The app requires these permissions:
- **Internet** — For Capacitor WebView
- **Storage** — To save and share PDF/JSON files
- **Notifications** — For daily inventory reminders and expiry alerts

All permissions are requested at runtime with user-friendly explanations.

## Data Privacy

- **No cloud storage** — All data stays on your device
- **No account required** — Use the app immediately
- **No data collection** — Nothing leaves your device
- **No built-in AI** — Your data is never processed externally

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context (AppContext)
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── i18n.js         # Translations (EN/AR/FR)
│   ├── App.jsx         # Root component
│   └── main.jsx        # Entry point
├── android/            # Android native project
├── .github/workflows/  # CI/CD automation
├── capacitor.config.json
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## License

MIT License
