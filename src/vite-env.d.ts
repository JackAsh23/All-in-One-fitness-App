/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_MAPTILER_KEY?: string;
  readonly VITE_STRAVA_CLIENT_ID?: string;
  readonly VITE_STRAVA_TOKEN_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
}

interface Window {
  BarcodeDetector?: {
    new (options?: { formats?: string[] }): BarcodeDetector;
  };
}
