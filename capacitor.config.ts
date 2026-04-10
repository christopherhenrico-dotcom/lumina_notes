import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumina.notes',
  appName: 'Lumina Notes',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;