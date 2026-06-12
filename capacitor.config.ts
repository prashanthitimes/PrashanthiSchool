import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prashanthischool.app', // You can change this to your choice
  appName: 'Prashanthi School',
  webDir: 'out',
  server: {
    // This is the magic part for auto-updates
    url: 'https://prashanthi-school-6kow.vercel.app', 
    cleartext: true
  }
};

export default config;