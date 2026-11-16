import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sachin.aiflow',
  appName: 'SACHIN AI FLOW',
  webDir: 'public',
  // Set this to your deployed HTTPS app URL before building the APK.
  // The backend must be deployed too because /api/video and /api/image-edit run on the server.
  server: {
    url: 'https://YOUR-DEPLOYED-APP-URL',
    cleartext: false
  },
  android: { allowMixedContent: false }
};

export default config;
