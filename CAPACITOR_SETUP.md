# 📱 Capacitor Native App Setup Guide

Your BMS Pro Staff App is now configured as a **True Native Mobile App** with full camera access for QR code scanning!

## 🚀 Getting Started

### Step 1: Export to GitHub
1. Click the **"Export to GitHub"** button in Lovable
2. Clone your repository to your local machine:
```bash
git clone <your-repo-url>
cd <your-project-folder>
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Capacitor (Already configured!)
The Capacitor config is already set up in `capacitor.config.ts`. You're ready to add platforms!

### Step 4: Add Native Platforms

**For Android:**
```bash
npx cap add android
```

**For iOS (Mac with Xcode required):**
```bash
npx cap add ios
```

### Step 5: Configure Camera Permissions

**Android:**
- See `android-permissions.md` for detailed instructions
- Add camera permissions to `android/app/src/main/AndroidManifest.xml`

**iOS:**
- See `ios-permissions.md` for detailed instructions  
- Add camera usage description to `ios/App/App/Info.plist`

### Step 6: Build & Sync

```bash
# Build the web assets
npm run build

# Sync with native platforms
npx cap sync
```

### Step 7: Run on Device/Emulator

**Android:**
```bash
npx cap run android
```
This will open Android Studio. You can then run on an emulator or connected device.

**iOS (Mac only):**
```bash
npx cap run ios
```
This will open Xcode. You can then run on iOS Simulator or a connected device.

## 📲 QR Scanner Features

Your app now includes:
- ✅ **Native camera access** with full performance
- ✅ **Real-time QR code scanning** for customer lookup
- ✅ **Beautiful scanner UI** with overlay and animations
- ✅ **Automatic customer detection** after scanning
- ✅ **Fallback manual entry** if QR scanning isn't available

## 🔄 Development Workflow

When you make changes in Lovable:

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Sync with native platforms:**
```bash
npx cap sync
```

3. **Run the app:**
```bash
npx cap run android
# or
npx cap run ios
```

## 🛠️ Troubleshooting

**Camera not working?**
- Make sure you added permissions to AndroidManifest.xml (Android) or Info.plist (iOS)
- Run `npx cap sync` after adding permissions
- Rebuild the app

**Build errors?**
- Delete `node_modules` and run `npm install` again
- Make sure you have the latest versions of Android Studio (Android) or Xcode (iOS)
- Run `npx cap update android` or `npx cap update ios`

**Hot reload not working?**
- The app is currently configured to use hot reload from Lovable's sandbox
- For production, update `capacitor.config.ts` to remove the `server` section

## 📚 Learn More

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Barcode Scanner Plugin](https://github.com/capacitor-community/barcode-scanner)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)

## 🎉 You're All Set!

Your native mobile app with QR scanning is ready to build and deploy. Follow the steps above to run it on your device!

For more help, check out the [Lovable Capacitor Guide](https://docs.lovable.dev/tips-tricks/using-capacitor).
