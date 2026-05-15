import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prashanthividyalaya.app', // You can change this to your choice
  appName: 'Prashanti Vidyalaya & High School.',
  webDir: 'out',
  server: {
    // This is the magic part for auto-updates
    url: 'https://www.prashanthitimes.com', 
    cleartext: true
  }
};

export default config;