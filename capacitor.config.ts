import type { CapacitorConfig } from '@capacitor/cli';

// Application iPhone : le site compilé (dist) est embarqué dans l'application.
// Même identifiant que l'application Android du Play Store.
const config: CapacitorConfig = {
  appId: 'com.maximaths.app',
  appName: 'MAXIMATHS',
  webDir: 'dist',
};

export default config;
