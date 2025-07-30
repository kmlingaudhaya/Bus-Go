# 🚀 Getting Started

This project is a React Native app using Expo (Bare Workflow) with Bluetooth-based OBD2 integration built using react-native-ble-plx. The project was ejected using npx expo prebuild to allow access to native Android code required for advanced Bluetooth permissions and BLE configuration.

---

## 📦 Why this project was ejected from Expo Managed Workflow?

- Expo Managed Workflow does not support full access to native Android APIs, especially:

- Low-level Bluetooth Low Energy (BLE) access

- Customization of AndroidManifest.xml (for permissions like BLUETOOTH_CONNECT, FOREGROUND_SERVICE, etc.)

- Adding native code dependencies like react-native-ble-plx, which require changes to the native android/ directory

## 📦 Prerequisites

- **Node.js** (v18 or later recommended)
- **Android Studio** (for emulator or USB debugging)
- **Android device** (with Developer Mode & USB Debugging enabled)
- **Java JDK 17+**
- **Git**

---

## 📁 Project Setup

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Eject the project** (if not already done)  
   _Skip this step if `android` and `ios` folders already exist._

   ```bash
   npx expo prebuild
   ```

4. **Run the app on Android** (connected via USB or emulator)
   ```bash
   npx expo run:android
   ```

---

## 📱 OBD2 Integration (Bluetooth)

The Bluetooth-based OBD2 module is modularized into:

- `tabs/Bluetooth.tsx` → Main UI & control screen
- `hooks/useOBDLiveMonitor.ts` → Custom hook to scan, connect, and send data
- `utils/obdParser.ts` → PID parsing logic
- `services/client.ts` → API service to send data to backend

---

### Required Permissions (Already added in `AndroidManifest.xml`)

- `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `INTERNET`, `FOREGROUND_SERVICE`, etc.
