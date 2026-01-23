import { Platform } from 'react-native';

// Platform-specific module loader
export function loadPlatformModule(moduleName: string) {
  if (Platform.OS === 'web') {
    // Return web-compatible alternatives or mocks
    switch (moduleName) {
      case 'expo-sqlite':
        return {
          openDatabaseAsync: () => Promise.resolve(null),
          SQLiteDatabase: null,
        };
      case 'expo-task-manager':
        return {
          defineTask: () => {},
          isTaskRegisteredAsync: () => Promise.resolve(false),
        };
      case 'expo-background-fetch':
        return {
          registerTaskAsync: () => Promise.resolve(),
          unregisterTaskAsync: () => Promise.resolve(),
          BackgroundFetchResult: {
            NewData: 'newData',
            Failed: 'failed',
          },
        };
      default:
        return null;
    }
  }
  
  // Return actual modules for native platforms
  switch (moduleName) {
    case 'expo-sqlite':
      return require('expo-sqlite');
    case 'expo-task-manager':
      return require('expo-task-manager');
    case 'expo-background-fetch':
      return require('expo-background-fetch');
    default:
      return null;
  }
}