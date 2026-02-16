import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.hamarr.app',
  appName: 'HAMARR JIU-JITSU',
  webDir: 'dist',
  server: {
    url: 'https://hamarr.cl',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
