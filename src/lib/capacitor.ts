import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#07090c" });
  } catch {
    /* Status bar API unavailable on this platform */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* Splash already hidden */
  }
}
