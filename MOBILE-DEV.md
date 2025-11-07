# 📱 Mobile Development Guide

## Important Note

This Next.js app uses **server-side rendering and API routes**, which means it **cannot be built as a standalone static mobile app**. The mobile app must connect to a running Next.js server.

## Development Workflow

### Option 1: Connect to Local Dev Server (Recommended for Development)

1. **Find your computer's IP address:**
   - Windows: Run `ipconfig` and look for IPv4 Address
   - Mac/Linux: Run `ifconfig` or `ip addr`
   - Example: `192.168.1.100`

2. **Start the Next.js dev server:**
   ```bash
   npm run dev:host
   ```
   This starts the server on `0.0.0.0:3000` (accessible from other devices)

3. **Update `capacitor.config.ts`:**
   ```typescript
   server: {
     url: 'http://192.168.1.100:3000', // Replace with YOUR IP
     cleartext: true,
     androidScheme: 'https',
     allowNavigation: ['*']
   },
   ```

4. **Sync and open Android Studio:**
   ```bash
   npm run mobile:sync
   ```

5. **Build and run from Android Studio**

### Option 2: Deploy to Production Server

1. **Deploy Next.js to a hosting service:**
   - Vercel (recommended): `vercel deploy`
   - Railway: `railway up`
   - Any Node.js hosting

2. **Update `capacitor.config.ts` with production URL:**
   ```typescript
   server: {
     url: 'https://your-app.vercel.app',
     androidScheme: 'https',
     allowNavigation: ['*']
   },
   ```

3. **Build APK:**
   ```bash
   npm run cap:sync
   npm run cap:open:android
   ```
   Then build release APK from Android Studio

## Why Can't We Use Static Export?

Your app has:
- ✅ Dynamic routes (`/dashboard/payments/[id]`, `/properties/[id]`, etc.)
- ✅ API routes (`/api/auth/*`, `/api/payments/*`, etc.)
- ✅ Server-side data fetching from Supabase

These features require a Node.js server and are incompatible with `output: 'export'`.

## Available Scripts

- `npm run dev` - Start dev server (localhost only)
- `npm run dev:host` - Start dev server (accessible from network)
- `npm run cap:sync` - Sync web assets to native platforms
- `npm run cap:open:android` - Open Android Studio
- `npm run mobile:sync` - Sync and open Android Studio

## Troubleshooting

### "Cannot connect to server"
- Ensure Next.js dev server is running
- Check that your phone/emulator is on the same network
- Verify the IP address in `capacitor.config.ts` is correct
- Check firewall settings allow port 3000

### "API routes not working"
- API routes require a server - they won't work in static export
- Ensure the server URL in Capacitor config is correct

## Production Deployment Checklist

- [ ] Deploy Next.js to a hosting service
- [ ] Update `capacitor.config.ts` with production URL
- [ ] Test all features work with production server
- [ ] Build release APK with proper signing keys
- [ ] Test APK on real devices
