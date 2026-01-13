import Constants from 'expo-constants';

export type GoogleAuthIds = {
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  expoClientId?: string;
};

export function getGoogleAuthIds(): GoogleAuthIds {
  const extra = (Constants?.expoConfig as any)?.extra || {};
  const cfg = extra.googleAuth || {};

  return {
    webClientId: cfg.webClientId,
    androidClientId: cfg.androidClientId,
    iosClientId: cfg.iosClientId,
    expoClientId: cfg.expoClientId,
  };
}
