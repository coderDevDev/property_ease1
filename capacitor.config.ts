import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stinaga.propertyease',
  appName: 'Property Ease',
  webDir: 'public',
  server: {
    // Production server - your deployed Next.js app
    url: 'https://naga-property-ease.vercel.app',
    
    // For local development, comment out the production URL above and uncomment below:
    // url: 'http://192.168.1.100:3000', // Replace with your computer's IP address
    // cleartext: true,
    
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#00af8f',
      androidSplashResourceName: 'splash',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      showSpinner: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00af8f',
      overlaysWebView: false
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      androidRequestPermissions: true
    },
    App: {
      launchUrl: 'capacitor://localhost'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      keystorePassword: undefined,
      releaseType: 'APK'
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;
