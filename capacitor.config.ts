import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.df243c6c71bd47d2890e61f29ee059c3',
  appName: 'BMS Pro Staff',
  webDir: 'dist',
  server: {
    url: 'https://df243c6c-71bd-47d2-890e-61f29ee059c3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B5CF6',
      showSpinner: false,
    },
  },
};

export default config;
